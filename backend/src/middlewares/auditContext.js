const { runWithContext } = require('../utils/asyncContext');

//middleware đặt thông tin audit (user,id..) vaof asyncLocalStorage
const setAuditContext = (req, res, next) => {
  const context = {
    req,
    requestId: req.headers['x-request-id'] || require('crypto').randomUUID(),
  };
  runWithContext(context, () => next());
};

module.exports = setAuditContext;