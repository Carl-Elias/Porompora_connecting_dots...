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
      // Which person in recipient's tree (filled in during acceptance)
      recipientPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
        required: false,
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
  const Person = require("./Person");

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
    person1ToPerson2: this.proposedRelationship.relationshipType,
    person2ToPerson1: this.getOppositeRelationship(
      this.proposedRelationship.relationshipType
    ),
    addedBy: acceptingUserId,
    confidence: this.matchConfidence === "high" ? "high" : "medium",
  });

  await relationship.save();
  await this.save();

  // AUTOMATIC TRANSITIVE RELATIONSHIP INFERENCE - TIER 1
  // Automatically infer critical relationships (parent, child, sibling, grandparent)
  try {
    const person1 = await Person.findById(
      this.proposedRelationship.requesterPerson
    );
    const person2 = await Person.findById(
      this.proposedRelationship.recipientPerson
    );

    if (person1 && person2) {
      console.log(
        `🔗 Starting Tier 1 inference for ${this.proposedRelationship.relationshipType} relationship`
      );

      // Delegate to comprehensive inference function
      await inferAllTier1RelationshipsForConnection(
        this.proposedRelationship.relationshipType,
        this.proposedRelationship.requesterPerson,
        this.proposedRelationship.recipientPerson,
        person1,
        person2,
        acceptingUserId
      );

      // TIER 2: DETECT AND SUGGEST RELATIONSHIPS (Require user confirmation)
      console.log(
        `🔔 Checking for Tier 2 suggestions for ${this.proposedRelationship.relationshipType} relationship`
      );
      await detectAndSuggestTier2RelationshipsForConnection(
        this.proposedRelationship.relationshipType,
        this.proposedRelationship.requesterPerson,
        this.proposedRelationship.recipientPerson,
        person1,
        person2,
        acceptingUserId
      );
    }
  } catch (error) {
    console.error(
      "Error inferring relationships during connection accept:",
      error
    );
    // Don't fail the whole operation
  }

  return relationship;
};

// Helper function to infer parent-child relationships for siblings
async function inferParentChildRelationshipsForSiblings(
  person1Id,
  person2Id,
  person1,
  person2,
  userId
) {
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    console.log(
      `🔗 Inferring parent-child relationships for siblings: ${person1.firstName} and ${person2.firstName}`
    );

    // Find all parents of person1
    const person1Parents = await Relationship.find({
      $or: [
        { person2: person1Id, relationshipType: "parent", isActive: true },
        { person1: person1Id, relationshipType: "child", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    // Find all parents of person2
    const person2Parents = await Relationship.find({
      $or: [
        { person2: person2Id, relationshipType: "parent", isActive: true },
        { person1: person2Id, relationshipType: "child", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    // Extract parent IDs for person1
    const person1ParentIds = new Set();
    person1Parents.forEach((rel) => {
      if (rel.relationshipType === "parent") {
        person1ParentIds.add(rel.person1._id.toString());
      } else if (rel.relationshipType === "child") {
        person1ParentIds.add(rel.person2._id.toString());
      }
    });

    // Extract parent IDs for person2
    const person2ParentIds = new Set();
    person2Parents.forEach((rel) => {
      if (rel.relationshipType === "parent") {
        person2ParentIds.add(rel.person1._id.toString());
      } else if (rel.relationshipType === "child") {
        person2ParentIds.add(rel.person2._id.toString());
      }
    });

    // For each parent of person1, if they're not already a parent of person2, create the relationship
    for (const parentId of person1ParentIds) {
      if (!person2ParentIds.has(parentId)) {
        const existingRel = await Relationship.findOne({
          $or: [
            { person1: parentId, person2: person2Id },
            { person1: person2Id, person2: parentId },
          ],
          isActive: true,
        });

        if (!existingRel) {
          const parent = await Person.findById(parentId);

          console.log(
            `✨ Creating parent-child relationship: ${parent.firstName} (parent) -> ${person2.firstName} (child)`
          );

          const newParentChildRel = new Relationship({
            person1: parentId,
            person2: person2Id,
            relationshipType: "parent",
            person1ToPerson2: `${parent.firstName} is parent of ${person2.firstName}`,
            person2ToPerson1: `${person2.firstName} is child of ${parent.firstName}`,
            addedBy: userId,
            lastUpdatedBy: userId,
          });

          await newParentChildRel.save();
          console.log(
            `✅ Successfully created relationship: ${parent.firstName} -> ${person2.firstName}`
          );
        }
      }
    }

    // For each parent of person2, if they're not already a parent of person1, create the relationship
    for (const parentId of person2ParentIds) {
      if (!person1ParentIds.has(parentId)) {
        const existingRel = await Relationship.findOne({
          $or: [
            { person1: parentId, person2: person1Id },
            { person1: person1Id, person2: parentId },
          ],
          isActive: true,
        });

        if (!existingRel) {
          const parent = await Person.findById(parentId);

          console.log(
            `✨ Creating parent-child relationship: ${parent.firstName} (parent) -> ${person1.firstName} (child)`
          );

          const newParentChildRel = new Relationship({
            person1: parentId,
            person2: person1Id,
            relationshipType: "parent",
            person1ToPerson2: `${parent.firstName} is parent of ${person1.firstName}`,
            person2ToPerson1: `${person1.firstName} is child of ${parent.firstName}`,
            addedBy: userId,
            lastUpdatedBy: userId,
          });

          await newParentChildRel.save();
          console.log(
            `✅ Successfully created relationship: ${parent.firstName} -> ${person1.firstName}`
          );
        }
      }
    }

    console.log("✅ Transitive relationship inference completed");
  } catch (error) {
    console.error("Error inferring parent-child relationships:", error);
    // Don't throw error, just log it
  }
}

// TIER 1: Comprehensive automatic relationship inference for connections
async function inferAllTier1RelationshipsForConnection(
  relationshipType,
  person1Id,
  person2Id,
  person1,
  person2,
  userId
) {
  try {
    console.log(
      `🔗 Starting Tier 1 inference for ${relationshipType} relationship between ${person1.firstName} and ${person2.firstName}`
    );

    // 1. SIBLING → PARENT
    if (relationshipType === "sibling") {
      await inferParentChildRelationshipsForSiblings(
        person1Id,
        person2Id,
        person1,
        person2,
        userId
      );
    }

    // 2. PARENT → GRANDPARENT
    if (relationshipType === "parent") {
      await inferGrandparentRelationshipsForConnection(
        person1Id, // parent
        person2Id, // child
        person1,
        person2,
        userId
      );
    }

    // 3. CHILD → PARENT (reciprocal, trigger parent logic)
    if (relationshipType === "child") {
      await inferGrandparentRelationshipsForConnection(
        person2Id, // parent (swapped)
        person1Id, // child (swapped)
        person2,
        person1,
        userId
      );
    }

    console.log("✅ Tier 1 inference completed successfully");
  } catch (error) {
    console.error("Error in Tier 1 inference:", error);
    // Don't throw
  }
}

// Helper: Infer grandparent relationships for connections
async function inferGrandparentRelationshipsForConnection(
  parentId,
  childId,
  parent,
  child,
  userId
) {
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    console.log(
      `👴 Inferring grandparent relationships: ${parent.firstName} (parent) → ${child.firstName} (child)`
    );

    // Find all parents of the parent (these are grandparents of the child)
    const grandparents = await Relationship.find({
      $or: [
        { person2: parentId, relationshipType: "parent", isActive: true },
        { person1: parentId, relationshipType: "child", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    const grandparentIds = new Set();
    grandparents.forEach((rel) => {
      if (rel.relationshipType === "parent") {
        grandparentIds.add(rel.person1._id.toString());
      } else if (rel.relationshipType === "child") {
        grandparentIds.add(rel.person2._id.toString());
      }
    });

    // Create grandparent → grandchild relationships
    for (const grandparentId of grandparentIds) {
      const existingRel = await Relationship.findOne({
        $or: [
          { person1: grandparentId, person2: childId },
          { person1: childId, person2: grandparentId },
        ],
        isActive: true,
      });

      if (!existingRel) {
        const grandparent = await Person.findById(grandparentId);

        console.log(
          `✨ Creating grandparent relationship: ${grandparent.firstName} (grandparent) → ${child.firstName} (grandchild)`
        );

        const newGrandparentRel = new Relationship({
          person1: grandparentId,
          person2: childId,
          relationshipType: "grandparent",
          person1ToPerson2: `${grandparent.firstName} is grandparent of ${child.firstName}`,
          person2ToPerson1: `${child.firstName} is grandchild of ${grandparent.firstName}`,
          addedBy: userId,
          lastUpdatedBy: userId,
        });

        await newGrandparentRel.save();
        console.log(
          `✅ Created grandparent relationship: ${grandparent.firstName} → ${child.firstName}`
        );
      }
    }

    // Also check: Find all children of the child (the parent is their grandparent too)
    const grandchildren = await Relationship.find({
      $or: [
        { person1: childId, relationshipType: "parent", isActive: true },
        { person2: childId, relationshipType: "child", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    const grandchildIds = new Set();
    grandchildren.forEach((rel) => {
      if (rel.relationshipType === "parent") {
        grandchildIds.add(rel.person2._id.toString());
      } else if (rel.relationshipType === "child") {
        grandchildIds.add(rel.person1._id.toString());
      }
    });

    // Create parent → grandparent relationships for existing children
    for (const grandchildId of grandchildIds) {
      const existingRel = await Relationship.findOne({
        $or: [
          { person1: parentId, person2: grandchildId },
          { person1: grandchildId, person2: parentId },
        ],
        isActive: true,
      });

      if (!existingRel) {
        const grandchild = await Person.findById(grandchildId);

        console.log(
          `✨ Creating grandparent relationship: ${parent.firstName} (grandparent) → ${grandchild.firstName} (grandchild)`
        );

        const newGrandparentRel = new Relationship({
          person1: parentId,
          person2: grandchildId,
          relationshipType: "grandparent",
          person1ToPerson2: `${parent.firstName} is grandparent of ${grandchild.firstName}`,
          person2ToPerson1: `${grandchild.firstName} is grandchild of ${parent.firstName}`,
          addedBy: userId,
          lastUpdatedBy: userId,
        });

        await newGrandparentRel.save();
        console.log(
          `✅ Created grandparent relationship: ${parent.firstName} → ${grandchild.firstName}`
        );
      }
    }
  } catch (error) {
    console.error("Error inferring grandparent relationships:", error);
  }
}

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

connectionRequestSchema.methods.getOppositeRelationship = function (
  relationshipType
) {
  // Map relationship types to their opposites
  const oppositeMap = {
    parent: "child",
    child: "parent",
    spouse: "spouse",
    sibling: "sibling",
    grandparent: "grandchild",
    grandchild: "grandparent",
    uncle: "nephew",
    aunt: "niece",
    nephew: "uncle",
    niece: "aunt",
    cousin: "cousin",
    great_grandparent: "great_grandchild",
    great_grandchild: "great_grandparent",
    great_uncle: "great_nephew",
    great_aunt: "great_niece",
    father_in_law: "son_in_law",
    mother_in_law: "daughter_in_law",
    son_in_law: "father_in_law",
    daughter_in_law: "mother_in_law",
    brother_in_law: "sister_in_law",
    sister_in_law: "brother_in_law",
    stepparent: "stepchild",
    stepchild: "stepparent",
    stepsibling: "stepsibling",
    adoptive_parent: "adoptive_child",
    adoptive_child: "adoptive_parent",
    same_person: "same_person",
  };

  return oppositeMap[relationshipType] || relationshipType;
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

// ============================================================
// TIER 2: RELATIONSHIP SUGGESTIONS (Require User Confirmation)
// ============================================================

// Detect and suggest Tier 2 relationships for connection requests
async function detectAndSuggestTier2RelationshipsForConnection(
  relationshipType,
  person1Id,
  person2Id,
  person1,
  person2,
  userId
) {
  // Import the controller's Tier 2 functions
  const relationshipController = require("../controllers/relationshipController");

  // The logic is the same as in the controller, so we'll call those functions
  // This ensures consistency between direct API and connection request paths

  // Note: Since the Tier 2 functions are not exported from controller,
  // we'll implement the same logic here for connection requests
  const RelationshipSuggestion = require("./RelationshipSuggestion");
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    console.log(
      `🔔 Tier 2 check for ${relationshipType}: ${person1.firstName} ↔ ${person2.firstName}`
    );

    // Same logic as controller's detectAndSuggestTier2Relationships
    if (relationshipType === "sibling") {
      await suggestUncleAuntForConnection(
        person1Id,
        person2Id,
        person1,
        person2,
        userId
      );
    }

    if (relationshipType === "parent") {
      await suggestUncleAuntFromParentSiblingsForConnection(
        person1Id,
        person2Id,
        person1,
        person2,
        userId
      );

      await suggestNieceNephewForConnection(
        person1Id,
        person2Id,
        person1,
        person2,
        userId
      );
    }

    if (relationshipType === "child") {
      await suggestNieceNephewForConnection(
        person2Id,
        person1Id,
        person2,
        person1,
        userId
      );
    }

    console.log("✅ Tier 2 suggestion check completed (connection)");
  } catch (error) {
    console.error("Error detecting Tier 2 relationships (connection):", error);
  }
}

// Helper: Suggest uncle/aunt when siblings are connected
async function suggestUncleAuntForConnection(
  person1Id,
  person2Id,
  person1,
  person2,
  userId
) {
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    // Find children of person1
    const person1Children = await Relationship.find({
      $or: [
        { person1: person1Id, relationshipType: "parent", isActive: true },
        { person2: person1Id, relationshipType: "child", isActive: true },
      ],
    });

    for (const rel of person1Children) {
      const childId =
        rel.relationshipType === "parent" ? rel.person2 : rel.person1;
      await createSuggestionForConnection({
        person1Id: person2Id,
        person2Id: childId,
        relationshipType: person2.gender === "female" ? "aunt" : "uncle",
        tier: 2,
        reason: `${person2.firstName} is sibling of ${person1.firstName}, who is parent of this person`,
        userId,
      });
    }

    // Find children of person2
    const person2Children = await Relationship.find({
      $or: [
        { person1: person2Id, relationshipType: "parent", isActive: true },
        { person2: person2Id, relationshipType: "child", isActive: true },
      ],
    });

    for (const rel of person2Children) {
      const childId =
        rel.relationshipType === "parent" ? rel.person2 : rel.person1;
      await createSuggestionForConnection({
        person1Id: person1Id,
        person2Id: childId,
        relationshipType: person1.gender === "female" ? "aunt" : "uncle",
        tier: 2,
        reason: `${person1.firstName} is sibling of ${person2.firstName}, who is parent of this person`,
        userId,
      });
    }
  } catch (error) {
    console.error("Error suggesting uncle/aunt (connection):", error);
  }
}

// Helper: Suggest uncle/aunt from parent's siblings
async function suggestUncleAuntFromParentSiblingsForConnection(
  parentId,
  childId,
  parent,
  child,
  userId
) {
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    const parentSiblings = await Relationship.find({
      $or: [
        { person1: parentId, relationshipType: "sibling", isActive: true },
        { person2: parentId, relationshipType: "sibling", isActive: true },
      ],
    });

    for (const rel of parentSiblings) {
      const siblingId =
        rel.person1._id.toString() === parentId.toString()
          ? rel.person2._id
          : rel.person1._id;
      const sibling = await Person.findById(siblingId);

      await createSuggestionForConnection({
        person1Id: siblingId,
        person2Id: childId,
        relationshipType: sibling.gender === "female" ? "aunt" : "uncle",
        tier: 2,
        reason: `${sibling.firstName} is sibling of ${parent.firstName}, who is parent of ${child.firstName}`,
        userId,
      });
    }
  } catch (error) {
    console.error(
      "Error suggesting uncle/aunt from parent siblings (connection):",
      error
    );
  }
}

// Helper: Suggest niece/nephew
async function suggestNieceNephewForConnection(
  parentId,
  childId,
  parent,
  child,
  userId
) {
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    const parentSiblings = await Relationship.find({
      $or: [
        { person1: parentId, relationshipType: "sibling", isActive: true },
        { person2: parentId, relationshipType: "sibling", isActive: true },
      ],
    });

    for (const rel of parentSiblings) {
      const siblingId =
        rel.person1._id.toString() === parentId.toString()
          ? rel.person2._id
          : rel.person1._id;
      const sibling = await Person.findById(siblingId);

      await createSuggestionForConnection({
        person1Id: childId,
        person2Id: siblingId,
        relationshipType: child.gender === "female" ? "niece" : "nephew",
        tier: 2,
        reason: `${child.firstName} is child of ${parent.firstName}, who is sibling of ${sibling.firstName}`,
        userId,
      });
    }
  } catch (error) {
    console.error("Error suggesting niece/nephew (connection):", error);
  }
}

// Helper: Create suggestion for connection
async function createSuggestionForConnection({
  person1Id,
  person2Id,
  relationshipType,
  tier,
  reason,
  userId,
}) {
  const RelationshipSuggestion = require("./RelationshipSuggestion");
  const Relationship = require("./Relationship");
  const Person = require("./Person");

  try {
    // Check if relationship already exists
    const existingRel = await Relationship.findOne({
      $or: [
        { person1: person1Id, person2: person2Id },
        { person1: person2Id, person2: person1Id },
      ],
      isActive: true,
    });

    if (existingRel) {
      return;
    }

    // Check if suggestion already exists
    const existingSuggestion = await RelationshipSuggestion.findOne({
      $or: [
        { person1: person1Id, person2: person2Id },
        { person1: person2Id, person2: person1Id },
      ],
      status: "pending",
    });

    if (existingSuggestion) {
      return;
    }

    // Create new suggestion
    const suggestion = new RelationshipSuggestion({
      person1: person1Id,
      person2: person2Id,
      relationshipType,
      tier,
      reason,
      suggestedTo: userId,
      status: "pending",
    });

    await suggestion.save();

    const person1 = await Person.findById(person1Id);
    const person2 = await Person.findById(person2Id);

    console.log(
      `💡 Created Tier ${tier} suggestion (connection): ${person1.firstName} (${relationshipType}) ↔ ${person2.firstName}`
    );
  } catch (error) {
    console.error("Error creating suggestion (connection):", error);
  }
}

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);
