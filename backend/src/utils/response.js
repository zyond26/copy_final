/**
 * Standardised success / error response helpers.
 * Keeps every controller consistent with the format defined in Chương 3.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object}  data        – Payload to return
 * @param {number}  [statusCode=200]
 */
const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string}  message
 * @param {number}  [statusCode=500]
 * @param {object}  [errors=null] – Validation errors (if any)
 */
const error = (res, message, statusCode = 500, errors = null) => {
  const body = {
    status: 'error',
    message,
  };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
