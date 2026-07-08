const RoleService = require('../services/role.service');
const { validateCreateRole, validateUpdateRole } = require('../validators/role.validator');
const { clearPermissionCache } = require('../middlewares/auth.middleware');

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await RoleService.getAllRoles();
    res.json({ status: 'success', data: roles });
  } catch (err) {
    next(err);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await RoleService.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy vai trò.' });
    }
    res.json({ status: 'success', data: role });
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { isValid, errors } = validateCreateRole(req.body);
    if (!isValid) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    const { name, description, permissions } = req.body;
    const newRole = await RoleService.createRole(name, description, permissions);

    clearPermissionCache();

    res.status(201).json({ status: 'success', message: 'Tạo vai trò thành công', data: newRole });
  } catch (err) {
    if (err.message.includes('đã tồn tại') || err.message.includes('không hợp lệ')) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { isValid, errors } = validateUpdateRole(req.body);
    if (!isValid) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    const { name, description, permissions } = req.body;
    const updatedRole = await RoleService.updateRole(req.params.id, name, description, permissions);

    clearPermissionCache();

    res.json({ status: 'success', message: 'Cập nhật vai trò thành công', data: updatedRole });
  } catch (err) {
    if (err.message.includes('Không tìm thấy')) {
      return res.status(404).json({ status: 'error', message: err.message });
    }
    if (err.message.includes('đã tồn tại') || err.message.includes('không hợp lệ')) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    await RoleService.deleteRole(req.params.id);
    
    clearPermissionCache();

    res.json({ status: 'success', message: 'Xóa vai trò thành công' });
  } catch (err) {
    if (err.message.includes('Không tìm thấy')) {
      return res.status(404).json({ status: 'error', message: err.message });
    }
    if (err.message.includes('Không thể xóa')) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next(err);
  }
};

const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await RoleService.getAllPermissions();
    res.json({ status: 'success', data: permissions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
};
