const { validationResult } = require('express-validator');

/**
 * Validation middleware - checks for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({
    field: err.path,
    message: err.msg
  }));
  
  return res.status(400).json({
    error: 'Validation failed',
    errors: extractedErrors
  });
};

module.exports = validate;