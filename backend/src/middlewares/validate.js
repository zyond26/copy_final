/**
 * Validation middleware factory.
 * Receives a validator function and returns an Express middleware.
 * The validator should return { isValid, errors }.
 */
const validate = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req.body);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors,
      });
    }
    next();
  };
};

module.exports = validate;
