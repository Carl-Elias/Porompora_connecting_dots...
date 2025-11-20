const Person = require("../models/Person");

// Get all life stories for the authenticated user's person
exports.getLifeStories = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the person associated with this user
    const person = await Person.findOne({ associatedUserId: userId }).select(
      "lifeStories"
    );

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person record not found",
      });
    }

    // Sort life stories by date (newest first)
    const sortedStories = person.lifeStories.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({
      success: true,
      data: {
        lifeStories: sortedStories,
      },
    });
  } catch (error) {
    console.error("Error fetching life stories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch life stories",
      error: error.message,
    });
  }
};

// Add a new life story
exports.addLifeStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description, date, category, location, photos, isPublic } =
      req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Find the person associated with this user
    const person = await Person.findOne({ associatedUserId: userId });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person record not found",
      });
    }

    // Create new life story
    const newStory = {
      title,
      description,
      date: date ? new Date(date) : new Date(),
      category: category || "memory",
      location,
      photos: photos || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      addedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to lifeStories array
    person.lifeStories.push(newStory);
    await person.save();

    res.status(201).json({
      success: true,
      message: "Life story added successfully",
      data: {
        lifeStory: person.lifeStories[person.lifeStories.length - 1],
      },
    });
  } catch (error) {
    console.error("Error adding life story:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add life story",
      error: error.message,
    });
  }
};

// Update a life story
exports.updateLifeStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { storyId } = req.params;
    const { title, description, date, category, location, photos, isPublic } =
      req.body;

    // Find the person associated with this user
    const person = await Person.findOne({ associatedUserId: userId });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person record not found",
      });
    }

    // Find the life story
    const story = person.lifeStories.id(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Life story not found",
      });
    }

    // Update fields
    if (title !== undefined) story.title = title;
    if (description !== undefined) story.description = description;
    if (date !== undefined) story.date = new Date(date);
    if (category !== undefined) story.category = category;
    if (location !== undefined) story.location = location;
    if (photos !== undefined) story.photos = photos;
    if (isPublic !== undefined) story.isPublic = isPublic;
    story.updatedAt = new Date();

    await person.save();

    res.json({
      success: true,
      message: "Life story updated successfully",
      data: {
        lifeStory: story,
      },
    });
  } catch (error) {
    console.error("Error updating life story:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update life story",
      error: error.message,
    });
  }
};

// Delete a life story
exports.deleteLifeStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { storyId } = req.params;

    // Find the person associated with this user
    const person = await Person.findOne({ associatedUserId: userId });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person record not found",
      });
    }

    // Find and remove the life story
    const story = person.lifeStories.id(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Life story not found",
      });
    }

    story.deleteOne();
    await person.save();

    res.json({
      success: true,
      message: "Life story deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting life story:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete life story",
      error: error.message,
    });
  }
};

// Get life stories for a specific user by their user ID
exports.getLifeStoriesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the person associated with this user
    const person = await Person.findOne({ associatedUserId: userId }).select(
      "lifeStories"
    );

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person record not found",
      });
    }

    // Filter only public stories when viewing another user's profile
    const isOwnProfile = req.user._id.toString() === userId;
    const stories = isOwnProfile
      ? person.lifeStories
      : person.lifeStories.filter((story) => story.isPublic);

    // Sort life stories by date (newest first)
    const sortedStories = stories.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({
      success: true,
      data: {
        lifeStories: sortedStories,
      },
    });
  } catch (error) {
    console.error("Error fetching life stories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch life stories",
      error: error.message,
    });
  }
};
