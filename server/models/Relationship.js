const mongoose = require("mongoose");

const relationshipSchema = new mongoose.Schema(
  {
    // The two people in the relationship
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

    // Type of relationship
    relationshipType: {
      type: String,
      enum: [
        // Direct family
        "parent",
        "child",
        "spouse",
        "sibling",
        // Extended family (auto-calculated)
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
        // In-laws
        "father_in_law",
        "mother_in_law",
        "son_in_law",
        "daughter_in_law",
        "brother_in_law",
        "sister_in_law",
        // Step relationships
        "stepparent",
        "stepchild",
        "stepsibling",
        // Adoptive relationships
        "adoptive_parent",
        "adoptive_child",
        // Ex relationships (for divorce tracking)
        "ex_spouse",
      ],
      required: true,
    },

    // Relationship direction context
    // If relationshipType is 'parent', then person1 is parent of person2
    person1ToPerson2: {
      type: String,
      required: true,
    },
    person2ToPerson1: {
      type: String,
      required: true,
    },

    // Marriage specific information
    marriageDetails: {
      marriageDate: Date,
      marriagePlace: {
        city: String,
        state: String,
        country: String,
      },
      divorceDate: Date,
      divorcePlace: {
        city: String,
        state: String,
        country: String,
      },
      isCurrentMarriage: {
        type: Boolean,
        default: true,
      },
    },

    // Relationship status
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: Date, // When relationship began (birth, marriage, etc.)
    endDate: Date, // When relationship ended (death, divorce, etc.)

    // Data ownership and verification
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Verification by family members
    verifiedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        verifiedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Confidence level (for auto-calculated relationships)
    confidence: {
      type: String,
      enum: ["high", "medium", "low", "suggested"],
      default: "high",
    },

    // For tracking relationship calculation chain
    derivedFrom: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Relationship",
      },
    ],

    // Privacy
    visibility: {
      type: String,
      enum: ["public", "family", "close_family", "private"],
      default: "family",
    },

    // Additional context
    notes: String,

    // Metadata
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient relationship queries
relationshipSchema.index({ person1: 1, person2: 1 }, { unique: true });
relationshipSchema.index({ person1: 1, relationshipType: 1 });
relationshipSchema.index({ person2: 1, relationshipType: 1 });
relationshipSchema.index({ addedBy: 1 });

// Methods for relationship logic
relationshipSchema.methods.getOppositeRelationship = function () {
  const relationshipMap = {
    parent: "child",
    child: "parent",
    spouse: "spouse",
    sibling: "sibling",
    grandparent: "grandchild",
    grandchild: "grandparent",
    uncle: "nephew", // Note: This assumes male, we'll handle this in logic
    aunt: "niece",
    nephew: "uncle",
    niece: "aunt",
    cousin: "cousin",
    // Add more mappings as needed
  };

  return relationshipMap[this.relationshipType] || "related";
};

// Static method to find all relationships for a person
relationshipSchema.statics.findPersonRelationships = function (personId) {
  return this.find({
    $or: [{ person1: personId }, { person2: personId }],
    isActive: true,
  }).populate("person1 person2");
};

// Static method for smart relationship calculation
relationshipSchema.statics.calculateIndirectRelationships = async function (
  personId
) {
  // This will be a complex method to calculate relationships like:
  // If A is parent of B, and B is parent of C, then A is grandparent of C
  // We'll implement this logic step by step

  const directRelationships = await this.findPersonRelationships(personId);
  // Implementation will go here for calculating indirect relationships
  return directRelationships;
};

// Pre-save middleware for relationship validation
relationshipSchema.pre("save", function (next) {
  // Ensure person1 and person2 are different
  if (this.person1.toString() === this.person2.toString()) {
    return next(
      new Error("A person cannot have a relationship with themselves")
    );
  }

  // Handle marriage status updates
  if (this.relationshipType === "spouse" && this.marriageDetails) {
    if (this.marriageDetails.divorceDate) {
      this.relationshipType = "ex_spouse";
      this.marriageDetails.isCurrentMarriage = false;
      this.isActive = false;
      this.endDate = this.marriageDetails.divorceDate;
    }
  }

  next();
});

module.exports = mongoose.model("Relationship", relationshipSchema);
