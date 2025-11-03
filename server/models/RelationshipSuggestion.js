const mongoose = require("mongoose");

const relationshipSuggestionSchema = new mongoose.Schema(
  {
    // The two people involved in the suggested relationship
    person1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
    },
    person2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
    },

    // Type of suggested relationship
    relationshipType: {
      type: String,
      required: true,
      enum: [
        "uncle",
        "aunt",
        "nephew",
        "niece",
        "cousin",
        "great_grandparent",
        "great_grandchild",
        "in_law",
      ],
    },

    // Tier level (2 or 3)
    tier: {
      type: Number,
      required: true,
      enum: [2, 3],
      default: 2,
    },

    // Explanation of why this relationship is suggested
    reason: {
      type: String,
      required: true,
    },

    // The relationship that triggered this suggestion
    // e.g., "Hasan is parent of Rahim, and Kona is sibling of Rahim"
    triggerRelationships: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Relationship",
      },
    ],

    // Status of the suggestion
    status: {
      type: String,
      enum: ["pending", "accepted", "dismissed"],
      default: "pending",
    },

    // User who will receive this suggestion
    suggestedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // When user accepted or dismissed
    respondedAt: {
      type: Date,
    },

    // The relationship created if accepted
    createdRelationship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Relationship",
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
relationshipSuggestionSchema.index({ suggestedTo: 1, status: 1 });
relationshipSuggestionSchema.index({ person1: 1, person2: 1 });

// Method to accept suggestion and create relationship
relationshipSuggestionSchema.methods.accept = async function () {
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    // Get person details for gender-based relationship naming
    const person1 = await Person.findById(this.person1);
    const person2 = await Person.findById(this.person2);

    if (!person1 || !person2) {
      throw new Error("Person not found");
    }

    // Create the relationship
    const newRelationship = new Relationship({
      person1: this.person1,
      person2: this.person2,
      relationshipType: this.relationshipType,
      person1ToPerson2: `${person1.firstName} is ${this.relationshipType} of ${person2.firstName}`,
      person2ToPerson1: `${person2.firstName} is ${getOppositeRelationship(
        this.relationshipType,
        person1.gender,
        person2.gender
      )} of ${person1.firstName}`,
      addedBy: this.suggestedTo,
      lastUpdatedBy: this.suggestedTo,
      notes: `Auto-suggested (Tier ${this.tier}): ${this.reason}`,
    });

    await newRelationship.save();

    // Update suggestion status
    this.status = "accepted";
    this.respondedAt = new Date();
    this.createdRelationship = newRelationship._id;
    await this.save();

    return newRelationship;
  } catch (error) {
    console.error("Error accepting suggestion:", error);
    throw error;
  }
};

// Method to dismiss suggestion
relationshipSuggestionSchema.methods.dismiss = async function () {
  this.status = "dismissed";
  this.respondedAt = new Date();
  await this.save();
  return this;
};

// Helper function
function getOppositeRelationship(
  relationshipType,
  person1Gender,
  person2Gender
) {
  const opposites = {
    uncle: person2Gender === "female" ? "niece" : "nephew",
    aunt: person2Gender === "female" ? "niece" : "nephew",
    nephew: person1Gender === "female" ? "aunt" : "uncle",
    niece: person1Gender === "female" ? "aunt" : "uncle",
    cousin: "cousin",
    great_grandparent: "great_grandchild",
    great_grandchild: "great_grandparent",
    in_law: "in_law",
  };

  return opposites[relationshipType] || "related";
}

module.exports = mongoose.model(
  "RelationshipSuggestion",
  relationshipSuggestionSchema
);
