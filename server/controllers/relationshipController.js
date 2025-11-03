const Relationship = require("../models/Relationship");
const Person = require("../models/Person");

// Get all relationships for the authenticated user's family
const getRelationships = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all people added by this user
    const userPersons = await Person.find({ addedBy: userId }).select("_id");
    const personIds = userPersons.map((p) => p._id);

    // Find relationships involving these people
    const relationships = await Relationship.find({
      $or: [{ person1: { $in: personIds } }, { person2: { $in: personIds } }],
      isActive: true,
    })
      .populate("person1 person2", "firstName lastName gender")
      .populate("addedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        relationships,
        count: relationships.length,
      },
    });
  } catch (error) {
    console.error("Get relationships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching relationships",
    });
  }
};

// Get a specific relationship
const getRelationship = async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user._id;

    const relationship = await Relationship.findOne({
      _id: relationshipId,
      addedBy: userId,
    })
      .populate("person1 person2", "firstName lastName gender dateOfBirth")
      .populate("addedBy", "firstName lastName");

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Relationship not found",
      });
    }

    res.json({
      success: true,
      data: {
        relationship,
      },
    });
  } catch (error) {
    console.error("Get relationship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching relationship",
    });
  }
};

// Create a new relationship
const createRelationship = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      person1Id,
      person2Id,
      relationshipType,
      marriageDetails,
      startDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!person1Id || !person2Id || !relationshipType) {
      return res.status(400).json({
        success: false,
        message: "Person1, Person2, and relationship type are required",
      });
    }

    // Ensure both people exist and belong to the user
    const person1 = await Person.findOne({ _id: person1Id, addedBy: userId });
    const person2 = await Person.findOne({ _id: person2Id, addedBy: userId });

    if (!person1 || !person2) {
      return res.status(404).json({
        success: false,
        message: "One or both people not found in your family tree",
      });
    }

    // Check if relationship already exists
    const existingRelationship = await Relationship.findOne({
      $or: [
        { person1: person1Id, person2: person2Id },
        { person1: person2Id, person2: person1Id },
      ],
      isActive: true,
    });

    if (existingRelationship) {
      return res.status(400).json({
        success: false,
        message: "Relationship already exists between these people",
      });
    }

    // Calculate the opposite relationship direction
    const oppositeRelationship = getOppositeRelationship(
      relationshipType,
      person1.gender,
      person2.gender
    );

    // Create the relationship
    const newRelationship = new Relationship({
      person1: person1Id,
      person2: person2Id,
      relationshipType,
      person1ToPerson2: `${person1.firstName} is ${relationshipType} of ${person2.firstName}`,
      person2ToPerson1: `${person2.firstName} is ${oppositeRelationship} of ${person1.firstName}`,
      marriageDetails:
        relationshipType === "spouse" ? marriageDetails : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      notes: notes?.trim(),
      addedBy: userId,
      lastUpdatedBy: userId,
    });

    const savedRelationship = await newRelationship.save();

    // Populate for response
    await savedRelationship.populate(
      "person1 person2",
      "firstName lastName gender"
    );
    await savedRelationship.populate("addedBy", "firstName lastName");

    // AUTOMATIC TRANSITIVE RELATIONSHIP INFERENCE - TIER 1
    // Automatically infer critical relationships (parent, child, sibling, grandparent)
    console.log(`🔍 Relationship type: "${relationshipType}"`);
    await inferAllTier1Relationships(
      relationshipType,
      person1Id,
      person2Id,
      person1,
      person2,
      userId
    );

    // TIER 2: DETECT AND SUGGEST RELATIONSHIPS (Require user confirmation)
    // Suggest uncle/aunt, niece/nephew relationships
    await detectAndSuggestTier2Relationships(
      relationshipType,
      person1Id,
      person2Id,
      person1,
      person2,
      userId
    );

    res.status(201).json({
      success: true,
      message: "Relationship created successfully",
      data: {
        relationship: savedRelationship,
      },
    });
  } catch (error) {
    console.error("Create relationship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating relationship",
    });
  }
};

// Update a relationship
const updateRelationship = async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.person1;
    delete updates.person2;
    delete updates.addedBy;
    delete updates.createdAt;
    delete updates.updatedAt;

    updates.lastUpdatedBy = userId;

    const relationship = await Relationship.findOne({
      _id: relationshipId,
      addedBy: userId,
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message:
          "Relationship not found or you do not have permission to update",
      });
    }

    // Handle divorce/marriage status changes
    if (updates.marriageDetails && relationship.relationshipType === "spouse") {
      if (updates.marriageDetails.divorceDate) {
        updates.relationshipType = "ex_spouse";
        updates.isActive = false;
        updates.endDate = new Date(updates.marriageDetails.divorceDate);
      }
    }

    const updatedRelationship = await Relationship.findByIdAndUpdate(
      relationshipId,
      updates,
      { new: true, runValidators: true }
    )
      .populate("person1 person2", "firstName lastName gender")
      .populate("addedBy", "firstName lastName");

    res.json({
      success: true,
      message: "Relationship updated successfully",
      data: {
        relationship: updatedRelationship,
      },
    });
  } catch (error) {
    console.error("Update relationship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating relationship",
    });
  }
};

// Delete a relationship
const deleteRelationship = async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user._id;

    const relationship = await Relationship.findOne({
      _id: relationshipId,
      addedBy: userId,
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message:
          "Relationship not found or you do not have permission to delete",
      });
    }

    await Relationship.findByIdAndDelete(relationshipId);

    res.json({
      success: true,
      message: "Relationship deleted successfully",
    });
  } catch (error) {
    console.error("Delete relationship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting relationship",
    });
  }
};

// Get family tree structure
const getFamilyTree = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rootPersonId } = req.query;

    // Get all family members added by this user
    const familyMembers = await Person.find({ addedBy: userId });

    // Get all relationships involving the user's family members
    // This includes cross-user relationships where one person belongs to this user
    // and the other person belongs to a different user
    const relationships = await Relationship.find({
      $or: [
        { person1: { $in: familyMembers.map((p) => p._id) } },
        { person2: { $in: familyMembers.map((p) => p._id) } },
      ],
      isActive: true,
    }).populate(
      "person1 person2",
      "firstName lastName gender dateOfBirth addedBy"
    );

    // Get all connected family members (including those from other users)
    const allConnectedPersonIds = new Set();
    familyMembers.forEach((p) => allConnectedPersonIds.add(p._id.toString()));

    relationships.forEach((rel) => {
      allConnectedPersonIds.add(rel.person1._id.toString());
      allConnectedPersonIds.add(rel.person2._id.toString());
    });

    // Fetch all connected persons (including cross-user ones)
    const allConnectedPersons = await Person.find({
      _id: { $in: Array.from(allConnectedPersonIds) },
    });

    // Determine the central node (prefer rootPersonId or user's first family member)
    let centralPersonId = rootPersonId;
    if (!centralPersonId && familyMembers.length > 0) {
      centralPersonId = familyMembers[0]._id.toString();
    }

    // Build tree structure with all connected persons
    const treeData = buildFamilyTree(
      allConnectedPersons,
      relationships,
      centralPersonId,
      userId
    );

    res.json({
      success: true,
      data: {
        familyMembers: allConnectedPersons, // Include all connected persons
        relationships,
        treeStructure: treeData,
        currentUserId: userId, // Send current user ID for frontend highlighting
        centralPersonId: centralPersonId, // Send central person ID
        stats: {
          totalMembers: allConnectedPersons.length,
          totalRelationships: relationships.length,
          ownMembers: familyMembers.length, // Track user's own family members
          connectedMembers: allConnectedPersons.length - familyMembers.length, // Cross-user connections
        },
      },
    });
  } catch (error) {
    console.error("Get family tree error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching family tree",
    });
  }
};

// Helper function to get opposite relationship
function getOppositeRelationship(
  relationshipType,
  person1Gender,
  person2Gender
) {
  const opposites = {
    parent: "child",
    child: "parent",
    spouse: "spouse",
    sibling: "sibling",
    grandparent: "grandchild",
    grandchild: "grandparent",
    uncle: person2Gender === "female" ? "niece" : "nephew",
    aunt: person2Gender === "female" ? "niece" : "nephew",
    nephew: person1Gender === "female" ? "aunt" : "uncle",
    niece: person1Gender === "female" ? "aunt" : "uncle",
    cousin: "cousin",
    stepparent: "stepchild",
    stepchild: "stepparent",
    stepsibling: "stepsibling",
  };

  return opposites[relationshipType] || "related";
}

// Helper function to automatically infer parent-child relationships when siblings are added
async function inferParentChildRelationshipsForSiblings(
  person1Id,
  person2Id,
  person1,
  person2,
  userId
) {
  try {
    console.log(
      `Inferring parent-child relationships for siblings: ${person1.firstName} and ${person2.firstName}`
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
        // Check if relationship doesn't already exist
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
            `Creating parent-child relationship: ${parent.firstName} (parent) -> ${person2.firstName} (child)`
          );

          // Create parent -> child relationship
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
            `✓ Successfully created relationship: ${parent.firstName} -> ${person2.firstName}`
          );
        }
      }
    }

    // For each parent of person2, if they're not already a parent of person1, create the relationship
    for (const parentId of person2ParentIds) {
      if (!person1ParentIds.has(parentId)) {
        // Check if relationship doesn't already exist
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
            `Creating parent-child relationship: ${parent.firstName} (parent) -> ${person1.firstName} (child)`
          );

          // Create parent -> child relationship
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
            `✓ Successfully created relationship: ${parent.firstName} -> ${person1.firstName}`
          );
        }
      }
    }

    console.log("✓ Transitive relationship inference completed");
  } catch (error) {
    console.error("Error inferring parent-child relationships:", error);
    // Don't throw error, just log it - we don't want to fail the main operation
  }
}

// TIER 1: Comprehensive automatic relationship inference
async function inferAllTier1Relationships(
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

    // 1. SIBLING → PARENT (already implemented above)
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
      await inferGrandparentRelationships(
        person1Id, // parent
        person2Id, // child
        person1,
        person2,
        userId
      );
    }

    // 3. CHILD → PARENT (reciprocal, trigger parent logic)
    if (relationshipType === "child") {
      await inferGrandparentRelationships(
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
    // Don't throw - we don't want to fail the main operation
  }
}

// Helper: Infer grandparent relationships when parent relationship is created
async function inferGrandparentRelationships(
  parentId,
  childId,
  parent,
  child,
  userId
) {
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

// ============================================================
// TIER 2: RELATIONSHIP SUGGESTIONS (Require User Confirmation)
// ============================================================

// Master function to detect and suggest Tier 2 relationships
async function detectAndSuggestTier2Relationships(
  relationshipType,
  person1Id,
  person2Id,
  person1,
  person2,
  userId
) {
  const RelationshipSuggestion = require("../models/RelationshipSuggestion");

  try {
    console.log(
      `🔔 Checking for Tier 2 suggestions: ${relationshipType} between ${person1.firstName} and ${person2.firstName}`
    );

    // 1. SIBLING → UNCLE/AUNT (parent's sibling becomes uncle/aunt)
    if (relationshipType === "sibling") {
      await suggestUncleAuntRelationships(
        person1Id,
        person2Id,
        person1,
        person2,
        userId
      );
    }

    // 2. PARENT → UNCLE/AUNT (when adding parent, their siblings are uncles/aunts to children)
    if (relationshipType === "parent") {
      await suggestUncleAuntFromParentSiblings(
        person1Id, // parent
        person2Id, // child
        person1,
        person2,
        userId
      );
    }

    // 3. CHILD → NIECE/NEPHEW (sibling's child becomes niece/nephew)
    if (relationshipType === "parent" || relationshipType === "child") {
      await suggestNieceNephewRelationships(
        relationshipType === "parent" ? person1Id : person2Id, // parent
        relationshipType === "parent" ? person2Id : person1Id, // child
        relationshipType === "parent" ? person1 : person2,
        relationshipType === "parent" ? person2 : person1,
        userId
      );
    }

    console.log("✅ Tier 2 suggestion check completed");
  } catch (error) {
    console.error("Error detecting Tier 2 relationships:", error);
  }
}

// Suggest uncle/aunt relationships when siblings are added
async function suggestUncleAuntRelationships(
  person1Id,
  person2Id,
  person1,
  person2,
  userId
) {
  const RelationshipSuggestion = require("../models/RelationshipSuggestion");

  try {
    // Find children of person1
    const person1Children = await Relationship.find({
      $or: [
        { person1: person1Id, relationshipType: "parent", isActive: true },
        { person2: person1Id, relationshipType: "child", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    const person1ChildIds = new Set();
    person1Children.forEach((rel) => {
      if (rel.relationshipType === "parent") {
        person1ChildIds.add(rel.person2._id.toString());
      } else {
        person1ChildIds.add(rel.person1._id.toString());
      }
    });

    // Find children of person2
    const person2Children = await Relationship.find({
      $or: [
        { person2: person2Id, relationshipType: "parent", isActive: true },
        { person1: person2Id, relationshipType: "child", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    const person2ChildIds = new Set();
    person2Children.forEach((rel) => {
      if (rel.relationshipType === "parent") {
        person2ChildIds.add(rel.person2._id.toString());
      } else {
        person2ChildIds.add(rel.person1._id.toString());
      }
    });

    // Person2 is uncle/aunt to person1's children
    for (const childId of person1ChildIds) {
      await createSuggestion({
        person1Id: person2Id,
        person2Id: childId,
        relationshipType: person2.gender === "female" ? "aunt" : "uncle",
        tier: 2,
        reason: `${person2.firstName} is sibling of ${person1.firstName}, who is parent of this person`,
        userId,
      });
    }

    // Person1 is uncle/aunt to person2's children
    for (const childId of person2ChildIds) {
      await createSuggestion({
        person1Id: person1Id,
        person2Id: childId,
        relationshipType: person1.gender === "female" ? "aunt" : "uncle",
        tier: 2,
        reason: `${person1.firstName} is sibling of ${person2.firstName}, who is parent of this person`,
        userId,
      });
    }
  } catch (error) {
    console.error("Error suggesting uncle/aunt relationships:", error);
  }
}

// Suggest uncle/aunt when adding a parent (their siblings are uncles/aunts)
async function suggestUncleAuntFromParentSiblings(
  parentId,
  childId,
  parent,
  child,
  userId
) {
  const RelationshipSuggestion = require("../models/RelationshipSuggestion");

  try {
    // Find siblings of the parent
    const parentSiblings = await Relationship.find({
      $or: [
        { person1: parentId, relationshipType: "sibling", isActive: true },
        { person2: parentId, relationshipType: "sibling", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    const siblingsSet = new Set();
    parentSiblings.forEach((rel) => {
      const siblingId =
        rel.person1._id.toString() === parentId.toString()
          ? rel.person2._id
          : rel.person1._id;
      siblingsSet.add(siblingId.toString());
    });

    // Each sibling of the parent is uncle/aunt to the child
    for (const siblingId of siblingsSet) {
      const sibling = await Person.findById(siblingId);

      await createSuggestion({
        person1Id: siblingId,
        person2Id: childId,
        relationshipType: sibling.gender === "female" ? "aunt" : "uncle",
        tier: 2,
        reason: `${sibling.firstName} is sibling of ${parent.firstName}, who is parent of ${child.firstName}`,
        userId,
      });
    }
  } catch (error) {
    console.error("Error suggesting uncle/aunt from parent siblings:", error);
  }
}

// Suggest niece/nephew relationships
async function suggestNieceNephewRelationships(
  parentId,
  childId,
  parent,
  child,
  userId
) {
  const RelationshipSuggestion = require("../models/RelationshipSuggestion");

  try {
    // Find siblings of the parent
    const parentSiblings = await Relationship.find({
      $or: [
        { person1: parentId, relationshipType: "sibling", isActive: true },
        { person2: parentId, relationshipType: "sibling", isActive: true },
      ],
    }).populate("person1 person2", "firstName lastName gender");

    const siblingsSet = new Set();
    parentSiblings.forEach((rel) => {
      const siblingId =
        rel.person1._id.toString() === parentId.toString()
          ? rel.person2._id
          : rel.person1._id;
      siblingsSet.add(siblingId.toString());
    });

    // Child is niece/nephew to each sibling of the parent
    for (const siblingId of siblingsSet) {
      const sibling = await Person.findById(siblingId);

      await createSuggestion({
        person1Id: childId,
        person2Id: siblingId,
        relationshipType: child.gender === "female" ? "niece" : "nephew",
        tier: 2,
        reason: `${child.firstName} is child of ${parent.firstName}, who is sibling of ${sibling.firstName}`,
        userId,
      });
    }
  } catch (error) {
    console.error("Error suggesting niece/nephew relationships:", error);
  }
}

// Helper function to create a suggestion (avoid duplicates)
async function createSuggestion({
  person1Id,
  person2Id,
  relationshipType,
  tier,
  reason,
  userId,
}) {
  const RelationshipSuggestion = require("../models/RelationshipSuggestion");

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
      console.log(`⏭️  Relationship already exists, skipping suggestion`);
      return;
    }

    // Get both people to find their associated users
    const person1 = await Person.findById(person1Id);
    const person2 = await Person.findById(person2Id);

    // Collect all users who should receive this suggestion
    const usersToNotify = new Set();

    // Add the user who triggered this suggestion
    usersToNotify.add(userId.toString());

    // Add user associated with person1 (if they have an associatedUserId)
    if (person1.associatedUserId) {
      usersToNotify.add(person1.associatedUserId.toString());
    }
    // Also add the user who added person1
    if (person1.addedBy) {
      usersToNotify.add(person1.addedBy.toString());
    }

    // Add user associated with person2 (if they have an associatedUserId)
    if (person2.associatedUserId) {
      usersToNotify.add(person2.associatedUserId.toString());
    }
    // Also add the user who added person2
    if (person2.addedBy) {
      usersToNotify.add(person2.addedBy.toString());
    }

    // Create suggestions for each user
    for (const suggestedToUserId of usersToNotify) {
      // Check if suggestion already exists for this user
      const existingSuggestion = await RelationshipSuggestion.findOne({
        $or: [
          { person1: person1Id, person2: person2Id },
          { person1: person2Id, person2: person1Id },
        ],
        suggestedTo: suggestedToUserId,
        status: "pending",
      });

      if (existingSuggestion) {
        console.log(
          `⏭️  Suggestion already exists for user ${suggestedToUserId}, skipping`
        );
        continue;
      }

      // Create new suggestion for this user
      const suggestion = new RelationshipSuggestion({
        person1: person1Id,
        person2: person2Id,
        relationshipType,
        tier,
        reason,
        suggestedTo: suggestedToUserId,
        status: "pending",
      });

      await suggestion.save();

      console.log(
        `💡 Created Tier ${tier} suggestion for user ${suggestedToUserId}: ${person1.firstName} (${relationshipType}) ↔ ${person2.firstName}`
      );
    }
  } catch (error) {
    console.error("Error creating suggestion:", error);
  }
}

// Helper function to build family tree structure with hierarchical layout
function buildFamilyTree(
  familyMembers,
  relationships,
  rootPersonId,
  currentUserId
) {
  // Create a map for quick person lookup
  const personMap = new Map();
  familyMembers.forEach((person) => {
    personMap.set(person._id.toString(), person);
  });

  // Create adjacency list for relationships
  const adjacencyList = new Map();
  const relationshipMap = new Map();

  familyMembers.forEach((person) => {
    adjacencyList.set(person._id.toString(), []);
  });

  relationships.forEach((rel) => {
    const person1Id = rel.person1._id.toString();
    const person2Id = rel.person2._id.toString();

    // Add bidirectional connections
    if (adjacencyList.has(person1Id)) {
      adjacencyList.get(person1Id).push(person2Id);
    }
    if (adjacencyList.has(person2Id)) {
      adjacencyList.get(person2Id).push(person1Id);
    }

    // Store relationship info
    relationshipMap.set(`${person1Id}-${person2Id}`, rel);
    relationshipMap.set(`${person2Id}-${person1Id}`, rel);
  });

  // Calculate hierarchical positions with improved layout
  const positions = calculateImprovedHierarchicalPositions(
    familyMembers,
    relationships,
    rootPersonId || familyMembers[0]?._id?.toString(),
    currentUserId
  );

  // Create nodes with calculated positions and highlighting
  const nodes = familyMembers.map((person) => {
    const personId = person._id.toString();
    const position = positions[personId] || {
      x: Math.random() * 800,
      y: Math.random() * 600,
    };

    // Check if this person belongs to the current user
    const isCurrentUserFamily =
      person.addedBy.toString() === currentUserId.toString();
    const isCentralNode = personId === rootPersonId;

    return {
      id: personId,
      data: {
        label: `${person.firstName} ${person.lastName}`,
        person: person,
        isCurrentUserFamily: isCurrentUserFamily,
        isCentralNode: isCentralNode,
      },
      position: position,
    };
  });

  // Create edges with classic family tree styling
  const edges = relationships.map((rel) => {
    const relationshipType = rel.relationshipType;
    let edgeStyle = {};
    let edgeType = "straight"; // Use straight lines for classic family tree look

    // Style edges based on relationship type for classic family tree
    switch (relationshipType) {
      case "parent":
      case "child":
        edgeStyle = {
          stroke: "#2563EB", // Blue for parent-child relationships
          strokeWidth: 3,
        };
        break;
      case "spouse":
        edgeStyle = {
          stroke: "#DC2626", // Red for spouse relationships
          strokeWidth: 3,
        };
        edgeType = "straight"; // Horizontal line for spouses
        break;
      case "sibling":
        edgeStyle = {
          stroke: "#7C3AED", // Purple for siblings
          strokeWidth: 2,
          strokeDasharray: "8,4", // Dashed line for siblings
        };
        break;
      default:
        edgeStyle = {
          stroke: "#6B7280",
          strokeWidth: 2,
        };
    }

    return {
      id: rel._id.toString(),
      source: rel.person1._id.toString(),
      target: rel.person2._id.toString(),
      label: relationshipType,
      style: edgeStyle,
      type: edgeType,
      animated: false, // No animation for classic look
      data: {
        relationship: rel,
      },
    };
  });

  return {
    nodes,
    edges,
  };
}

// Calculate structured family tree positions (classic tree layout)
function calculateImprovedHierarchicalPositions(
  familyMembers,
  relationships,
  rootPersonId,
  currentUserId
) {
  const positions = {};
  const graph = new Map();

  // Initialize graph with all people
  familyMembers.forEach((person) => {
    graph.set(person._id.toString(), {
      person,
      parents: [],
      children: [],
      spouses: [],
      siblings: [],
      generation: 0,
    });
  });

  // Build relationship graph
  relationships.forEach((rel) => {
    const person1Id = rel.person1._id.toString();
    const person2Id = rel.person2._id.toString();

    if (graph.has(person1Id) && graph.has(person2Id)) {
      switch (rel.relationshipType) {
        case "parent":
          graph.get(person1Id).children.push(person2Id);
          graph.get(person2Id).parents.push(person1Id);
          break;
        case "child":
          graph.get(person1Id).parents.push(person2Id);
          graph.get(person2Id).children.push(person1Id);
          break;
        case "spouse":
          graph.get(person1Id).spouses.push(person2Id);
          graph.get(person2Id).spouses.push(person1Id);
          break;
        case "sibling":
          graph.get(person1Id).siblings.push(person2Id);
          graph.get(person2Id).siblings.push(person1Id);
          break;
      }
    }
  });

  // Find the central person (root or first user family member)
  const centralPersonId =
    rootPersonId ||
    familyMembers
      .find((p) => p.addedBy.toString() === currentUserId.toString())
      ?._id?.toString() ||
    familyMembers[0]?._id?.toString();

  if (!centralPersonId) return positions;

  // Calculate generations relative to central person
  const visited = new Set();
  const queue = [{ personId: centralPersonId, generation: 0 }];
  graph.get(centralPersonId).generation = 0;
  visited.add(centralPersonId);

  while (queue.length > 0) {
    const { personId, generation } = queue.shift();
    const person = graph.get(personId);

    if (person) {
      // Parents go up one generation
      person.parents.forEach((parentId) => {
        if (!visited.has(parentId)) {
          graph.get(parentId).generation = generation - 1;
          visited.add(parentId);
          queue.push({ personId: parentId, generation: generation - 1 });
        }
      });

      // Children go down one generation
      person.children.forEach((childId) => {
        if (!visited.has(childId)) {
          graph.get(childId).generation = generation + 1;
          visited.add(childId);
          queue.push({ personId: childId, generation: generation + 1 });
        }
      });

      // Spouses stay in same generation
      person.spouses.forEach((spouseId) => {
        if (!visited.has(spouseId)) {
          graph.get(spouseId).generation = generation;
          visited.add(spouseId);
          queue.push({ personId: spouseId, generation });
        }
      });

      // Siblings stay in same generation
      person.siblings.forEach((siblingId) => {
        if (!visited.has(siblingId)) {
          graph.get(siblingId).generation = generation;
          visited.add(siblingId);
          queue.push({ personId: siblingId, generation });
        }
      });
    }
  }

  // Group people by generation
  const generations = new Map();
  graph.forEach((person, personId) => {
    const gen = person.generation;
    if (!generations.has(gen)) {
      generations.set(gen, []);
    }
    generations.get(gen).push(personId);
  });

  // Layout configuration
  const generationHeight = 400; // Vertical spacing between generations - increased for better separation
  const personWidth = 320; // Horizontal spacing between people
  const centerX = 800; // Center point of the tree
  const centerY = 400; // Center point of the tree

  // Position each generation
  generations.forEach((peopleInGeneration, generation) => {
    const y = centerY + generation * generationHeight;

    // Group spouses together and arrange families
    const familyGroups = groupIntoFamilies(peopleInGeneration, graph);

    // Calculate total width needed for this generation
    const totalFamilies = familyGroups.length;
    const totalWidth = (totalFamilies - 1) * personWidth * 2; // Extra spacing between families
    const startX = centerX - totalWidth / 2;

    let currentX = startX;

    familyGroups.forEach((family, familyIndex) => {
      // Calculate width needed for this family (spouses + spacing)
      const familyWidth = (family.length - 1) * (personWidth * 0.7); // Closer spacing within family
      const familyStartX = currentX - familyWidth / 2;

      // Position each person in the family
      family.forEach((personId, personIndex) => {
        positions[personId] = {
          x: familyStartX + personIndex * (personWidth * 0.7),
          y: y,
        };
      });

      // Move to next family position
      currentX += personWidth * 2;
    });
  });

  return positions;
}

// Helper function to group people into families (spouses together)
function groupIntoFamilies(peopleInGeneration, graph) {
  const visited = new Set();
  const families = [];

  peopleInGeneration.forEach((personId) => {
    if (!visited.has(personId)) {
      const family = [personId];
      visited.add(personId);

      // Add spouses to the same family group
      const person = graph.get(personId);
      person.spouses.forEach((spouseId) => {
        if (peopleInGeneration.includes(spouseId) && !visited.has(spouseId)) {
          family.push(spouseId);
          visited.add(spouseId);
        }
      });

      families.push(family);
    }
  });

  return families;
}

// Fix existing relationships by inferring all missing Tier 1 relationships
const fixExistingSiblingRelationships = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all people added by this user
    const userPersons = await Person.find({ addedBy: userId });
    const personIds = userPersons.map((p) => p._id);

    // Find all Tier 1 relationships (sibling, parent, child)
    const tier1Relationships = await Relationship.find({
      $or: [{ person1: { $in: personIds } }, { person2: { $in: personIds } }],
      relationshipType: { $in: ["sibling", "parent", "child"] },
      isActive: true,
    }).populate("person1 person2", "firstName lastName gender");

    console.log(
      `🔧 Found ${tier1Relationships.length} Tier 1 relationships to process`
    );

    let siblingCount = 0;
    let parentCount = 0;
    let childCount = 0;

    // Process each relationship and infer missing relationships
    for (const rel of tier1Relationships) {
      const person1 = rel.person1;
      const person2 = rel.person2;
      const relType = rel.relationshipType;

      console.log(
        `📝 Processing ${relType}: ${person1.firstName} ↔ ${person2.firstName}`
      );

      // Use the comprehensive Tier 1 inference function
      await inferAllTier1Relationships(
        relType,
        person1._id,
        person2._id,
        person1,
        person2,
        userId
      );

      // Track counts
      if (relType === "sibling") siblingCount++;
      else if (relType === "parent") parentCount++;
      else if (relType === "child") childCount++;
    }

    res.json({
      success: true,
      message: `Successfully processed ${tier1Relationships.length} Tier 1 relationships`,
      data: {
        totalProcessed: tier1Relationships.length,
        siblingRelationships: siblingCount,
        parentRelationships: parentCount,
        childRelationships: childCount,
      },
    });
  } catch (error) {
    console.error("Fix Tier 1 relationships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fixing Tier 1 relationships",
      error: error.message,
    });
  }
};

module.exports = {
  getRelationships,
  getRelationship,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getFamilyTree,
  fixExistingSiblingRelationships,
};
