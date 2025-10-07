const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    // The user sending the request
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The user receiving the request
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Proposed relationship details
    proposedRelationship: {
      // Which person in requester's tree
      requesterPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
      },
      // Which person in recipient's tree
      recipientPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: true,
      },
      // Proposed relationship type
      relationshipType: {
        type: String,
        enum: [
          "parent",
          "child",
          "spouse",
          "sibling",
          "grandparent",
          "grandchild",
          "uncle",
          "aunt",
          "nephew",
          "niece",
          "cousin",
          "great_grandparent",
          "great_grandchild",
          "great_uncle",
          "great_aunt",
          "father_in_law",
          "mother_in_law",
          "son_in_law",
          "daughter_in_law",
          "brother_in_law",
          "sister_in_law",
          "stepparent",
          "stepchild",
          "stepsibling",
          "adoptive_parent",
          "adoptive_child",
          "same_person", // When they think it's the same person
        ],
        required: true,
      },
      // Direction of relationship
      relationshipDirection: String, // e.g., "Your father John is my grandfather"
    },

    // Request details
    message: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Evidence provided
    evidence: [
      {
        type: {
          type: String,
          enum: ["photo", "document", "story", "other"],
        },
        description: String,
        url: String, // If it's a file/photo
        content: String, // If it's text evidence
      },
    ],

    // Request status
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },

    // Response from recipient
    response: {
      message: String,
      respondedAt: Date,
      counterProposal: {
        relationshipType: String,
        relationshipDirection: String,
        message: String,
      },
    },

    // Auto-match confidence (if found through search)
    matchConfidence: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },

    // How was this connection discovered
    discoveryMethod: {
      type: String,
      enum: ["name_search", "location_search", "mutual_family", "manual"],
      required: true,
    },

    // Matching factors that led to this suggestion
    matchingFactors: [
      {
        factor: {
          type: String,
          enum: [
            "name_similarity",
            "location_match",
            "date_match",
            "mutual_relative",
          ],
        },
        confidence: Number, // 0-100
        details: String,
      },
    ],

    // Priority (for recipient's inbox)
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    // Expiration
    expiresAt: {
      type: Date,
      default: function () {
        // Requests expire after 30 days
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      },
    },

    // Metadata
    processedAt: Date, // When accepted/rejected
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
connectionRequestSchema.index({ requester: 1, status: 1 });
connectionRequestSchema.index({ recipient: 1, status: 1 });
connectionRequestSchema.index({ status: 1, expiresAt: 1 });
connectionRequestSchema.index(
  {
    "proposedRelationship.requesterPerson": 1,
    "proposedRelationship.recipientPerson": 1,
  },
  { unique: true }
); // Prevent duplicate requests

// Methods
connectionRequestSchema.methods.accept = async function (
  acceptingUserId,
  responseMessage = ""
) {
  const Relationship = require("./Relationship");

  this.status = "accepted";
  this.response = {
    message: responseMessage,
    respondedAt: new Date(),
  };
  this.processedAt = new Date();
  this.processedBy = acceptingUserId;

  // Create the actual relationship
  const relationship = new Relationship({
    person1: this.proposedRelationship.requesterPerson,
    person2: this.proposedRelationship.recipientPerson,
    relationshipType: this.proposedRelationship.relationshipType,
    person1ToPerson2: this.proposedRelationship.relationshipDirection,
    person2ToPerson1: this.getOppositeDirection(),
    addedBy: acceptingUserId,
    confidence: this.matchConfidence === "high" ? "high" : "medium",
  });

  await relationship.save();
  await this.save();

  return relationship;
};

connectionRequestSchema.methods.reject = async function (
  rejectingUserId,
  responseMessage = ""
) {
  this.status = "rejected";
  this.response = {
    message: responseMessage,
    respondedAt: new Date(),
  };
  this.processedAt = new Date();
  this.processedBy = rejectingUserId;

  await this.save();
};

connectionRequestSchema.methods.getOppositeDirection = function () {
  // This would contain logic to flip the relationship direction
  // e.g., if "A is father of B" then "B is child of A"
  return `Opposite of: ${this.proposedRelationship.relationshipDirection}`;
};

// Static methods for discovery
connectionRequestSchema.statics.findPotentialMatches = async function (
  userId,
  searchQuery
) {
  const Person = require("./Person");
  const User = require("./User");

  // Find potential family members based on name similarity
  const potentialMatches = await Person.findPublicPersons(searchQuery);

  // Filter out people already connected
  // Add logic to calculate match confidence
  // Return suggestions for connection requests

  return potentialMatches;
};

// Auto-expire old requests
connectionRequestSchema.statics.expireOldRequests = async function () {
  const expiredRequests = await this.updateMany(
    {
      status: "pending",
      expiresAt: { $lt: new Date() },
    },
    {
      status: "withdrawn",
    }
  );

  return expiredRequests;
};

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);
