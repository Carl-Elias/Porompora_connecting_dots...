const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get("/", profileController.getProfile);
router.put("/", profileController.updateProfile);
router.post("/picture", profileController.uploadProfilePicture);

// Privacy settings
router.put("/privacy", profileController.updatePrivacySettings);

// Notification preferences
router.put("/notifications", profileController.updateNotificationPreferences);

// Password change
router.put("/password", profileController.changePassword);

// User stats (must be before :userId route to avoid conflict)
router.get("/stats", profileController.getUserStats);

// Get another user's profile (must be last among GET routes)
router.get("/:userId", profileController.getUserProfile);

module.exports = router;
