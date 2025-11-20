const express = require("express");
const router = express.Router();
const personController = require("../controllers/personController");
const { authenticateToken } = require("../middleware/auth");
const { Person } = require("../models");

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

// Get dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total family members created by this user
    const totalMembers = await Person.countDocuments({
      addedBy: userId,
    });

    // Get family members created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAdditions = await Person.countDocuments({
      addedBy: userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate generations by finding the maximum generation depth
    const members = await Person.find(
      { addedBy: userId },
      "generationLevel dateOfBirth"
    );

    // Find min and max generation levels
    let minGen = 0;
    let maxGen = 0;

    members.forEach((member) => {
      if (
        member.generationLevel !== null &&
        member.generationLevel !== undefined
      ) {
        if (member.generationLevel < minGen) minGen = member.generationLevel;
        if (member.generationLevel > maxGen) maxGen = member.generationLevel;
      }
    });

    let generations = Math.abs(maxGen - minGen) + (members.length > 0 ? 1 : 0);

    // Fallback: Calculate from birth years if generation levels aren't set
    if (generations === 1 && members.length > 1) {
      const birthYears = members
        .filter((m) => m.dateOfBirth)
        .map((m) => new Date(m.dateOfBirth).getFullYear());

      if (birthYears.length > 0) {
        const minYear = Math.min(...birthYears);
        const maxYear = Math.max(...birthYears);
        generations = Math.max(
          generations,
          Math.ceil((maxYear - minYear) / 25)
        );
      }
    }

    res.json({
      totalMembers,
      generations,
      recentAdditions,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
});

module.exports = router;
