const { PrismaClient } = require('../../generated/prisma');
const { getRequestContext } = require('../utils/asyncContext');
const { getCurrentTime } = require('../utils/time');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
}).$extends({
  name: 'auditLogger',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {

        // ====================== 1. BỎ QUA CÁC TRƯỜNG HỢP KHÔNG CẦN LOG ======================
        if (model === 'audit_logs') {
          return query(args); // Ngăn vòng lặp vô hạn
        }

        // Chỉ tự động ghi log với các thực thể hành chính/bảo mật không được ghi log thủ công
        // (Tránh ghi đúp log trùng lặp cho medical_records, vital_signs, prescriptions, appointments)
        const AUTOMATIC_LOGGED_MODELS = [
          'users',
          'patients',
          'roles',
          'permissions',
          'role_permissions',
          'otp_verifications',
          'break_glass',
        ];

        if (!AUTOMATIC_LOGGED_MODELS.includes(model)) {
          return query(args);
        }

        const WRITE_OPS = ['create', 'update', 'delete', 'upsert'];
        const AUDITED_OPS = [...WRITE_OPS];

        if (!AUDITED_OPS.includes(operation)) {
          return query(args);
        }

        const context = getRequestContext() || {};
        let oldValue = null;
        let newValue = null;
        let entityId = null;

        try {
          // ====================== 2. LẤY OLD_VALUE (Cho UPDATE, DELETE, UPSERT) ======================
          if (WRITE_OPS.includes(operation) && args?.where?.id && typeof args.where.id !== 'object') {
            entityId = args.where.id;

            if (operation !== 'create') {
              oldValue = await prisma[model].findUnique({
                where: { id: entityId }
              }).catch(() => null); // Không throw error để flow không bị đứt gãy
            }
          }

          // ====================== 3. THỰC THI CÂU LỆNH GỐC ======================
          const result = await query(args);

          // ====================== 4. XÁC ĐỊNH ENTITY_ID & NEW_VALUE ======================
          if (operation === 'create') {
            entityId = result?.id;
            newValue = result;
          } else if (operation === 'update' || operation === 'upsert') {
            entityId = entityId || result?.id || args?.where?.id;
            newValue = result;
          } else if (operation === 'delete') {
            entityId = entityId || args?.where?.id;
            newValue = null;
          } else if (result && !Array.isArray(result) && result.id) {
            // Trường hợp Read (findUnique, findFirst) lấy được kết quả
            entityId = result.id;
          } else if (args?.where?.id && typeof args.where.id !== 'object') {
            // Fallback: Nếu Read không ra kết quả nhưng user có tryền ID vào điều kiện tìm kiếm
            entityId = args.where.id;
          }

          // ====================== 5. GHI AUDIT LOG BẤT ĐỒNG BỘ ======================
          const isBreakGlass = !!context.breakGlass;

          const logData = {
            user_id: context.userId ? BigInt(context.userId) : null,
            patient_id: context.patientId ? BigInt(context.patientId) : null,
            action: operation.toUpperCase(),
            entity_type: model,
            entity_id: entityId ? BigInt(entityId) : null,
            old_value: oldValue ? oldValue : null,
            new_value: newValue ? newValue : null,
            ip_address: context.ipAddress || null,
            break_glass: isBreakGlass,
            break_glass_reason: isBreakGlass ? context.breakGlassReason : null,
            created_at: getCurrentTime(),
          };

          prisma.audit_logs.create({ data: logData })
            .catch((err) => {
              console.error(`[AUDIT LOG FAILED] ${model}.${operation}:`, err.message);
            });

          return result;

        } catch (error) {
          console.error(`[AUDIT ERROR] ${model}.${operation}:`, error.message);
          throw error;
        }
      },
    },
  },
});

module.exports = prisma;