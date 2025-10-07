// Export all models for easy importing
const User = require("./User");
const Person = require("./Person");
const Relationship = require("./Relationship");
const ConnectionRequest = require("./ConnectionRequest");
const PrivacySettings = require("./PrivacySettings");

module.exports = {
  User,
  Person,
  Relationship,
  ConnectionRequest,
  PrivacySettings,
};
