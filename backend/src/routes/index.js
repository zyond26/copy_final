const express = require('express');
const router = express.Router();
const auditLogRoutes = require('./auditLog.routes');
const breakGlassRoutes = require('./breakGlass.routes');
const { enforcePasswordFresh } = require('../middlewares/auth.middleware');

const prescriptionRoutes = require('./prescription.routes');

// ISO 27799 §9.4.3 – chặn API khi mật khẩu quá hạn (trừ đổi mật khẩu / đăng xuất)
router.use(enforcePasswordFresh);

// Mount feature routes
router.use('/auth', require('./auth.routes'));

router.get('/system-time', async (req, res) => {
    const { getCurrentTime, syncTime, getOffset, isSynced } = require('../utils/time');
    if (req.query.sync === 'true') {
        const success = await syncTime();
        return res.json({
            synchronized: success,
            time: getCurrentTime().toISOString(),
            offsetMs: getOffset()
        });
    }
    res.json({
        synchronized: isSynced(),
        time: getCurrentTime().toISOString(),
        localTime: new Date().toISOString(),
        offsetMs: getOffset()
    });
});

router.use('/users', require('./user.routes'));
router.use('/patients', require('./patient.routes'));
router.use('/audit-logs', auditLogRoutes);
router.use('/break-glass', breakGlassRoutes);
router.use('/records', require('./record.routes'));
router.use('/logs', require('./log.routes'));
router.use('/', prescriptionRoutes);
router.use('/vital-signs', require('./vital-signs.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/roles', require('./role.routes'));
router.use('/permissions', (req, res, next) => {
    // Để giữ logic API đơn giản, ta trỏ thẳng đến getAllPermissions của roleController
    const RoleController = require('../controllers/role.controller');
    const { authenticate, authorize } = require('../middlewares/auth.middleware');
    authenticate(req, res, (err) => {
        if (err) return next(err);
        authorize('role:manage')(req, res, (err) => {
            if (err) return next(err);
            RoleController.getAllPermissions(req, res, next);
        });
    });
});

module.exports = router;
