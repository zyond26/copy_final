/**
 * Generate a unique appointment code following the format defined in Chương 3 / Kế hoạch:
 * APP-YYYY-NNNN (e.g. APP-2026-0001)
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<string>}
 */
const generateAppointmentCode = async (prisma) => {
  const year = new Date().getFullYear();
  const prefix = `APP-${year}-`;

  // Tìm code mới nhất trong năm nay
  const latest = await prisma.appointments.findFirst({
    where: { appointment_code: { startsWith: prefix } },
    orderBy: { appointment_code: 'desc' },
    select: { appointment_code: true },
  });

  let nextNumber = 1;
  if (latest) {
    const lastNumber = parseInt(latest.appointment_code.split('-').pop(), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = { generateAppointmentCode };
