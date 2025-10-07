// Validation utilities for user input
const validator = require("validator");

const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }

  if (!validator.isEmail(email)) {
    return { isValid: false, message: "Please provide a valid email address" };
  }

  return { isValid: true };
};

const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  // Check for at least one letter and one number
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one letter and one number",
    };
  }

  return { isValid: true };
};

const validateName = (name, fieldName = "Name") => {
  if (!name) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 2 characters long`,
    };
  }

  if (name.trim().length > 50) {
    return {
      isValid: false,
      message: `${fieldName} must be less than 50 characters`,
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
    return {
      isValid: false,
      message: `${fieldName} contains invalid characters`,
    };
  }

  return { isValid: true };
};

const validatePhoneNumber = (phone) => {
  if (!phone) {
    return { isValid: true }; // Phone is optional
  }

  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { isValid: false, message: "Please provide a valid phone number" };
  }

  return { isValid: true };
};

const validateRegistrationData = (data) => {
  const errors = [];

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.message);
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message);
  }

  // Validate first name
  const firstNameValidation = validateName(data.firstName, "First name");
  if (!firstNameValidation.isValid) {
    errors.push(firstNameValidation.message);
  }

  // Validate last name
  const lastNameValidation = validateName(data.lastName, "Last name");
  if (!lastNameValidation.isValid) {
    errors.push(lastNameValidation.message);
  }

  // Validate phone (optional)
  if (data.phoneNumber) {
    const phoneValidation = validatePhoneNumber(data.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateLoginData = (data) => {
  const errors = [];

  if (!data.email) {
    errors.push("Email is required");
  }

  if (!data.password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sanitize input data
const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.trim().replace(/[<>]/g, ""); // Basic XSS prevention
};

const sanitizeUserInput = (data) => {
  const sanitized = {};

  if (data.email) sanitized.email = validator.normalizeEmail(data.email);
  if (data.firstName) sanitized.firstName = sanitizeString(data.firstName);
  if (data.lastName) sanitized.lastName = sanitizeString(data.lastName);
  if (data.phoneNumber)
    sanitized.phoneNumber = sanitizeString(data.phoneNumber);
  if (data.password) sanitized.password = data.password; // Don't sanitize password

  return sanitized;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validatePhoneNumber,
  validateRegistrationData,
  validateLoginData,
  sanitizeString,
  sanitizeUserInput,
};
