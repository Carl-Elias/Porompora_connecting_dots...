const express = require("express");
const router = express.Router();
const lifeStoryController = require("../controllers/lifeStoryController");
const { authenticateToken } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

// Get life stories for a specific user (must be before /:storyId route)
router.get("/user/:userId", lifeStoryController.getLifeStoriesByUserId);

// Get all life stories
router.get("/", lifeStoryController.getLifeStories);

// Add a new life story
router.post("/", lifeStoryController.addLifeStory);

// Update a life story
router.put("/:storyId", lifeStoryController.updateLifeStory);

// Delete a life story
router.delete("/:storyId", lifeStoryController.deleteLifeStory);

module.exports = router;
