// Validation utilities for forms and inputs

export const tiktokUrlValidator = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, message: 'URL is required' };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, message: 'URL is required' };
  }

  // Basic TikTok URL pattern
  const tiktokPattern = /^https?:\/\/(www\.)?tiktok\.com\/.+/i;
  if (!tiktokPattern.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid TikTok URL' };
  }

  return { valid: true };
};

export const commentValidator = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, message: 'Comment is required' };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, message: 'Comment cannot be empty' };
  }

  if (trimmed.length > 1000) {
    return { valid: false, message: 'Comment must be less than 1000 characters' };
  }

  return { valid: true };
};

export const displayNameValidator = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: true }; // Optional field
  }

  const trimmed = name.trim();
  if (trimmed.length > 50) {
    return { valid: false, message: 'Display name must be less than 50 characters' };
  }

  return { valid: true };
};

export const bioValidator = (bio) => {
  if (!bio || typeof bio !== 'string') {
    return { valid: true }; // Optional field
  }

  if (bio.length > 500) {
    return { valid: false, message: 'Bio must be less than 500 characters' };
  }

  return { valid: true };
};

// Format validation results for consistent handling
export const validateForm = (validators, values) => {
  const errors = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(values[field]);
    if (!result.valid) {
      isValid = false;
      errors[field] = result.message;
    }
  }

  return { valid: isValid, errors };
};