const Person = require("../models/Person");
const Relationship = require("../models/Relationship");
const { authenticateToken } = require("../middleware/auth");

// Get all family members for the authenticated user
const getFamilyMembers = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all people added by this user
    const familyMembers = await Person.find({
      addedBy: userId,
    })
      .populate("addedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        familyMembers,
        count: familyMembers.length,
      },
    });
  } catch (error) {
    console.error("Get family members error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching family members",
    });
  }
};

// Get a specific family member by ID
const getFamilyMember = async (req, res) => {
  try {
    const { personId } = req.params;
    const userId = req.user._id;

    const person = await Person.findOne({
      _id: personId,
      addedBy: userId, // Ensure user can only access their own family members
    })
      .populate("addedBy", "firstName lastName")
      .populate("verifiedBy.userId", "firstName lastName");

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    // Get relationships for this person
    const relationships = await Relationship.find({
      $or: [{ person1: personId }, { person2: personId }],
      isActive: true,
    }).populate("person1 person2", "firstName lastName");

    res.json({
      success: true,
      data: {
        person,
        relationships,
      },
    });
  } catch (error) {
    console.error("Get family member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching family member",
    });
  }
};

// Add a new family member
const addFamilyMember = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      firstName,
      lastName,
      middleName,
      maidenName,
      gender,
      dateOfBirth,
      dateOfDeath,
      isAlive,
      birthPlace,
      currentLocation,
      occupation,
      education,
      notes,
      visibility,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !gender) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and gender are required",
      });
    }

    // Create new family member
    const newPerson = new Person({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName?.trim(),
      maidenName: maidenName?.trim(),
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      dateOfDeath: dateOfDeath ? new Date(dateOfDeath) : undefined,
      isAlive: isAlive !== undefined ? isAlive : true,
      birthPlace,
      currentLocation,
      occupation: occupation?.trim(),
      education: education?.trim(),
      notes: notes?.trim(),
      visibility: visibility || "family",
      addedBy: userId,
      lastUpdatedBy: userId,
    });

    const savedPerson = await newPerson.save();

    // Populate the addedBy field for response
    await savedPerson.populate("addedBy", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Family member added successfully",
      data: {
        person: savedPerson,
      },
    });
  } catch (error) {
    console.error("Add family member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding family member",
    });
  }
};

// Update a family member
const updateFamilyMember = async (req, res) => {
  try {
    const { personId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.addedBy;
    delete updates.associatedUserId;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Add lastUpdatedBy
    updates.lastUpdatedBy = userId;

    // Ensure the user owns this family member
    const person = await Person.findOne({
      _id: personId,
      addedBy: userId,
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        message:
          "Family member not found or you do not have permission to update",
      });
    }

    // Update the person
    const updatedPerson = await Person.findByIdAndUpdate(personId, updates, {
      new: true,
      runValidators: true,
    }).populate("addedBy", "firstName lastName");

    res.json({
      success: true,
      message: "Family member updated successfully",
      data: {
        person: updatedPerson,
      },
    });
  } catch (error) {
    console.error("Update family member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating family member",
    });
  }
};

// Delete a family member
const deleteFamilyMember = async (req, res) => {
  try {
    const { personId } = req.params;
    const userId = req.user._id;

    // Ensure the user owns this family member
    const person = await Person.findOne({
      _id: personId,
      addedBy: userId,
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        message:
          "Family member not found or you do not have permission to delete",
      });
    }

    // Check if this person has any relationships
    const relationships = await Relationship.find({
      $or: [{ person1: personId }, { person2: personId }],
      isActive: true,
    });

    if (relationships.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete family member with existing relationships. Please remove relationships first.",
        data: {
          relationshipCount: relationships.length,
        },
      });
    }

    // Delete the person
    await Person.findByIdAndDelete(personId);

    res.json({
      success: true,
      message: "Family member deleted successfully",
    });
  } catch (error) {
    console.error("Delete family member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting family member",
    });
  }
};

// Add photo to family member
const addPhoto = async (req, res) => {
  try {
    const { personId } = req.params;
    const userId = req.user._id;
    const { url, caption } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Photo URL is required",
      });
    }

    const person = await Person.findOne({
      _id: personId,
      addedBy: userId,
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    // Add photo
    person.photos.push({
      url,
      caption: caption?.trim(),
      uploadedBy: userId,
    });

    await person.save();

    res.json({
      success: true,
      message: "Photo added successfully",
      data: {
        photo: person.photos[person.photos.length - 1],
      },
    });
  } catch (error) {
    console.error("Add photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding photo",
    });
  }
};

// Add story to family member
const addStory = async (req, res) => {
  try {
    const { personId } = req.params;
    const userId = req.user._id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Story title and content are required",
      });
    }

    const person = await Person.findOne({
      _id: personId,
      addedBy: userId,
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    // Add story
    person.stories.push({
      title: title.trim(),
      content: content.trim(),
      authorId: userId,
    });

    await person.save();

    res.json({
      success: true,
      message: "Story added successfully",
      data: {
        story: person.stories[person.stories.length - 1],
      },
    });
  } catch (error) {
    console.error("Add story error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding story",
    });
  }
};

// Update a photo
const updatePhoto = async (req, res) => {
  try {
    const { personId, photoId } = req.params;
    const userId = req.user._id;
    const { caption, description } = req.body;

    const person = await Person.findOne({ _id: personId, addedBy: userId });
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    const photo = person.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    if (caption !== undefined) photo.caption = caption;
    if (description !== undefined) photo.description = description;

    await person.save();

    res.json({
      success: true,
      message: "Photo updated successfully",
      data: { photo },
    });
  } catch (error) {
    console.error("Update photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating photo",
    });
  }
};

// Delete a photo
const deletePhoto = async (req, res) => {
  try {
    const { personId, photoId } = req.params;
    const userId = req.user._id;

    const person = await Person.findOne({ _id: personId, addedBy: userId });
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    person.photos.id(photoId).remove();
    await person.save();

    res.json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting photo",
    });
  }
};

// Update a story
const updateStory = async (req, res) => {
  try {
    const { personId, storyId } = req.params;
    const userId = req.user._id;
    const { title, content, dateOfEvent } = req.body;

    const person = await Person.findOne({ _id: personId, addedBy: userId });
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    const story = person.stories.id(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (title !== undefined) story.title = title;
    if (content !== undefined) story.content = content;
    if (dateOfEvent !== undefined)
      story.dateOfEvent = dateOfEvent ? new Date(dateOfEvent) : null;

    await person.save();

    res.json({
      success: true,
      message: "Story updated successfully",
      data: { story },
    });
  } catch (error) {
    console.error("Update story error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating story",
    });
  }
};

// Delete a story
const deleteStory = async (req, res) => {
  try {
    const { personId, storyId } = req.params;
    const userId = req.user._id;

    const person = await Person.findOne({ _id: personId, addedBy: userId });
    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    person.stories.id(storyId).remove();
    await person.save();

    res.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting story",
    });
  }
};

module.exports = {
  getFamilyMembers,
  getFamilyMember,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  addPhoto,
  updatePhoto,
  deletePhoto,
  addStory,
  updateStory,
  deleteStory,
};
