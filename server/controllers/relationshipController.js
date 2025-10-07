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

    // Get all family members
    const familyMembers = await Person.find({ addedBy: userId });

    // Get all relationships
    const relationships = await Relationship.find({
      $or: [
        { person1: { $in: familyMembers.map((p) => p._id) } },
        { person2: { $in: familyMembers.map((p) => p._id) } },
      ],
      isActive: true,
    }).populate("person1 person2", "firstName lastName gender dateOfBirth");

    // Build tree structure
    const treeData = buildFamilyTree(
      familyMembers,
      relationships,
      rootPersonId
    );

    res.json({
      success: true,
      data: {
        familyMembers,
        relationships,
        treeStructure: treeData,
        stats: {
          totalMembers: familyMembers.length,
          totalRelationships: relationships.length,
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

// Helper function to build family tree structure
function buildFamilyTree(familyMembers, relationships, rootPersonId) {
  // This is a simplified version - we'll enhance this later
  const tree = {
    nodes: familyMembers.map((person) => ({
      id: person._id.toString(),
      data: {
        label: `${person.firstName} ${person.lastName}`,
        person: person,
      },
      position: { x: 0, y: 0 }, // We'll calculate positions later
    })),
    edges: relationships.map((rel) => ({
      id: rel._id.toString(),
      source: rel.person1._id.toString(),
      target: rel.person2._id.toString(),
      label: rel.relationshipType,
      data: {
        relationship: rel,
      },
    })),
  };

  return tree;
}

module.exports = {
  getRelationships,
  getRelationship,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  getFamilyTree,
};
