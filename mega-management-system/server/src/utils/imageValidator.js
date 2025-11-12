// File Path: server/src/utils/imageValidator.js

const path = require('path');

/**
 * Validates business card image files
 * Only accepts JPG/PNG, max 5MB
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validates a single image file
 * @param {Object} file - Multer file object
 * @returns {Object} { valid: boolean, error: string }
 */
const validateBusinessCardImage = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Only JPG and PNG images are allowed (received: ${file.mimetype})`
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Only .jpg, .jpeg, and .png files are allowed (received: ${ext})`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validates both front and back business card images
 * @param {Object} frontImage - Front card image (required)
 * @param {Object} backImage - Back card image (optional)
 * @returns {Object} { valid: boolean, errors: Array }
 */
const validateBusinessCardImages = (frontImage, backImage) => {
  const errors = [];

  // Validate front image (required)
  if (!frontImage) {
    errors.push('Front image is required');
    return { valid: false, errors };
  }

  const frontValidation = validateBusinessCardImage(frontImage);
  if (!frontValidation.valid) {
    errors.push(`Front image: ${frontValidation.error}`);
  }

  // Validate back image (optional)
  if (backImage) {
    const backValidation = validateBusinessCardImage(backImage);
    if (!backValidation.valid) {
      errors.push(`Back image: ${backValidation.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Multer file filter for business card images
 * Used in multer configuration
 */
const businessCardImageFilter = (req, file, cb) => {
  const validation = validateBusinessCardImage(file);

  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

module.exports = {
  validateBusinessCardImage,
  validateBusinessCardImages,
  businessCardImageFilter,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
