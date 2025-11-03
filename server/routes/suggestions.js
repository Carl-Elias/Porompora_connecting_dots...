const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const RelationshipSuggestion = require("../models/RelationshipSuggestion");
const Person = require("../models/Person");

// Get all pending suggestions for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const suggestions = await RelationshipSuggestion.find({
      suggestedTo: userId,
      status: "pending",
    })
      .populate("person1 person2", "firstName lastName gender dateOfBirth")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching suggestions",
    });
  }
});

// Get suggestions grouped by tier
router.get("/by-tier", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const tier2Suggestions = await RelationshipSuggestion.find({
      suggestedTo: userId,
      status: "pending",
      tier: 2,
    })
      .populate("person1 person2", "firstName lastName gender dateOfBirth")
      .sort({ createdAt: -1 });

    const tier3Suggestions = await RelationshipSuggestion.find({
      suggestedTo: userId,
      status: "pending",
      tier: 3,
    })
      .populate("person1 person2", "firstName lastName gender dateOfBirth")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        tier2: {
          suggestions: tier2Suggestions,
          count: tier2Suggestions.length,
        },
        tier3: {
          suggestions: tier3Suggestions,
          count: tier3Suggestions.length,
        },
        totalCount: tier2Suggestions.length + tier3Suggestions.length,
      },
    });
  } catch (error) {
    console.error("Get suggestions by tier error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching suggestions",
    });
  }
});

// Get a specific suggestion
router.get("/:suggestionId", authenticateToken, async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.user._id;

    const suggestion = await RelationshipSuggestion.findOne({
      _id: suggestionId,
      suggestedTo: userId,
    }).populate("person1 person2", "firstName lastName gender dateOfBirth");

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    res.json({
      success: true,
      data: {
        suggestion,
      },
    });
  } catch (error) {
    console.error("Get suggestion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching suggestion",
    });
  }
});

// Accept a suggestion and create the relationship
router.post("/:suggestionId/accept", authenticateToken, async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.user._id;

    const suggestion = await RelationshipSuggestion.findOne({
      _id: suggestionId,
      suggestedTo: userId,
      status: "pending",
    });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found or already processed",
      });
    }

    // Accept the suggestion (this creates the relationship)
    const relationship = await suggestion.accept();

    // Populate the relationship for response
    await relationship.populate("person1 person2", "firstName lastName gender");

    res.json({
      success: true,
      message: "Suggestion accepted and relationship created",
      data: {
        relationship,
        suggestion,
      },
    });
  } catch (error) {
    console.error("Accept suggestion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while accepting suggestion",
      error: error.message,
    });
  }
});

// Dismiss a suggestion
router.post("/:suggestionId/dismiss", authenticateToken, async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.user._id;

    const suggestion = await RelationshipSuggestion.findOne({
      _id: suggestionId,
      suggestedTo: userId,
      status: "pending",
    });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found or already processed",
      });
    }

    // Dismiss the suggestion
    await suggestion.dismiss();

    res.json({
      success: true,
      message: "Suggestion dismissed",
      data: {
        suggestion,
      },
    });
  } catch (error) {
    console.error("Dismiss suggestion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while dismissing suggestion",
    });
  }
});

// Bulk accept multiple suggestions
router.post("/bulk/accept", authenticateToken, async (req, res) => {
  try {
    const { suggestionIds } = req.body;
    const userId = req.user._id;

    if (!suggestionIds || !Array.isArray(suggestionIds)) {
      return res.status(400).json({
        success: false,
        message: "suggestionIds array is required",
      });
    }

    const results = {
      accepted: [],
      failed: [],
    };

    for (const suggestionId of suggestionIds) {
      try {
        const suggestion = await RelationshipSuggestion.findOne({
          _id: suggestionId,
          suggestedTo: userId,
          status: "pending",
        });

        if (suggestion) {
          const relationship = await suggestion.accept();
          results.accepted.push({
            suggestionId,
            relationshipId: relationship._id,
          });
        } else {
          results.failed.push({
            suggestionId,
            reason: "Not found or already processed",
          });
        }
      } catch (error) {
        results.failed.push({
          suggestionId,
          reason: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Accepted ${results.accepted.length} suggestions, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk accept error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while accepting suggestions",
    });
  }
});

// Bulk dismiss multiple suggestions
router.post("/bulk/dismiss", authenticateToken, async (req, res) => {
  try {
    const { suggestionIds } = req.body;
    const userId = req.user._id;

    if (!suggestionIds || !Array.isArray(suggestionIds)) {
      return res.status(400).json({
        success: false,
        message: "suggestionIds array is required",
      });
    }

    const results = {
      dismissed: [],
      failed: [],
    };

    for (const suggestionId of suggestionIds) {
      try {
        const suggestion = await RelationshipSuggestion.findOne({
          _id: suggestionId,
          suggestedTo: userId,
          status: "pending",
        });

        if (suggestion) {
          await suggestion.dismiss();
          results.dismissed.push(suggestionId);
        } else {
          results.failed.push({
            suggestionId,
            reason: "Not found or already processed",
          });
        }
      } catch (error) {
        results.failed.push({
          suggestionId,
          reason: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Dismissed ${results.dismissed.length} suggestions, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk dismiss error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while dismissing suggestions",
    });
  }
});

// Get suggestion statistics
router.get("/stats/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await RelationshipSuggestion.aggregate([
      { $match: { suggestedTo: userId } },
      {
        $group: {
          _id: { tier: "$tier", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      tier2: {
        pending: 0,
        accepted: 0,
        dismissed: 0,
      },
      tier3: {
        pending: 0,
        accepted: 0,
        dismissed: 0,
      },
    };

    stats.forEach((stat) => {
      const tierKey = `tier${stat._id.tier}`;
      const statusKey = stat._id.status;
      if (formattedStats[tierKey]) {
        formattedStats[tierKey][statusKey] = stat.count;
      }
    });

    res.json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    console.error("Get suggestion stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
    });
  }
});

module.exports = router;
