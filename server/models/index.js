// Export all models for easy importing
const User = require("./User");
const Person = require("./Person");
const Relationship = require("./Relationship");
const ConnectionRequest = require("./ConnectionRequest");
const PrivacySettings = require("./PrivacySettings");
const RelationshipSuggestion = require("./RelationshipSuggestion");

module.exports = {
  User,
  Person,
  Relationship,
  ConnectionRequest,
  PrivacySettings,
  RelationshipSuggestion,
};
