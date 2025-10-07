const express = require("express");
const router = express.Router();
const personController = require("../controllers/personController");
const { authenticateToken } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

// Family member routes
router.get("/members", personController.getFamilyMembers);
router.get("/members/:personId", personController.getFamilyMember);
router.post("/members", personController.addFamilyMember);
router.put("/members/:personId", personController.updateFamilyMember);
router.delete("/members/:personId", personController.deleteFamilyMember);

// Photo routes
router.post("/members/:personId/photos", personController.addPhoto);
router.put("/members/:personId/photos/:photoId", personController.updatePhoto);
router.delete(
  "/members/:personId/photos/:photoId",
  personController.deletePhoto
);

// Story routes
router.post("/members/:personId/stories", personController.addStory);
router.put("/members/:personId/stories/:storyId", personController.updateStory);
router.delete(
  "/members/:personId/stories/:storyId",
  personController.deleteStory
);

module.exports = router;
