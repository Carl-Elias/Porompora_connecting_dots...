const express = require("express");
const router = express.Router();
const User = require("../models/User");
const PrivacySettings = require("../models/PrivacySettings");
const { authenticateToken } = require("../middleware/auth");

// Search for users
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }

    const searchQuery = query.trim();
    const skip = (page - 1) * limit;

    // Build search criteria
    const searchCriteria = {
      _id: { $ne: currentUserId }, // Exclude current user
      allowDiscovery: true, // Only discoverable users
      $or: [
        { firstName: { $regex: searchQuery, $options: "i" } },
        { lastName: { $regex: searchQuery, $options: "i" } },
        { username: { $regex: searchQuery, $options: "i" } },
      ],
    };

    // Find users with privacy settings
    const users = await User.find(searchCriteria)
      .select(
        "firstName lastName username email profilePicture location dateOfBirth"
      )
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ firstName: 1, lastName: 1 });

    // Filter based on privacy settings
    const filteredUsers = [];

    for (const user of users) {
      const privacySettings = await PrivacySettings.findOne({
        userId: user._id,
      });

      if (!privacySettings) {
        // Default privacy settings - allow basic discovery
        filteredUsers.push({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profilePicture: user.profilePicture,
          location: user.location,
        });
        continue;
      }

      // Check if user allows connection requests
      if (!privacySettings.discoverySettings.allowConnectionRequests) {
        continue;
      }

      const publicInfo = {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      };

      // Add information based on privacy settings
      if (privacySettings.discoverySettings.allowNameSearch) {
        publicInfo.firstName = user.firstName;
        publicInfo.lastName = user.lastName;
      }

      if (
        privacySettings.discoverySettings.allowLocationSearch &&
        user.location
      ) {
        publicInfo.location = user.location;
      }

      filteredUsers.push(publicInfo);
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchCriteria);

    res.json({
      users: filteredUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: skip + filteredUsers.length < totalUsers,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Get user profile (public view)
router.get("/:userId/profile", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res
        .status(400)
        .json({ error: "Cannot view your own profile through this endpoint" });
    }

    const user = await User.findById(userId).select(
      "firstName lastName username email profilePicture location dateOfBirth bio"
    );

    if (!user || !user.allowDiscovery) {
      return res
        .status(404)
        .json({ error: "User not found or not discoverable" });
    }

    const privacySettings = await PrivacySettings.findOne({ userId });

    if (
      !privacySettings ||
      !privacySettings.discoverySettings.allowConnectionRequests
    ) {
      return res
        .status(403)
        .json({ error: "User does not allow connection requests" });
    }

    // Build public profile based on privacy settings
    const publicProfile = {
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
    };

    if (privacySettings.discoverySettings.allowNameSearch) {
      publicProfile.firstName = user.firstName;
      publicProfile.lastName = user.lastName;
    }

    if (
      privacySettings.discoverySettings.allowLocationSearch &&
      user.location
    ) {
      publicProfile.location = user.location;
    }

    // Add bio if available
    if (user.bio) {
      publicProfile.bio = user.bio;
    }

    res.json({ user: publicProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Get current user's privacy settings
router.get("/privacy-settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    let privacySettings = await PrivacySettings.findOne({ userId });

    if (!privacySettings) {
      // Create default privacy settings
      privacySettings = new PrivacySettings({ userId });
      await privacySettings.save();
    }

    res.json({ privacySettings });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    res.status(500).json({ error: "Failed to fetch privacy settings" });
  }
});

// Update current user's privacy settings
router.put("/privacy-settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    let privacySettings = await PrivacySettings.findOne({ userId });

    if (!privacySettings) {
      privacySettings = new PrivacySettings({ userId, ...updates });
    } else {
      Object.assign(privacySettings, updates);
    }

    await privacySettings.save();

    // Update user's allowDiscovery based on privacy settings
    const allowDiscovery =
      privacySettings.discoverySettings.allowConnectionRequests;
    await User.findByIdAndUpdate(userId, { allowDiscovery });

    res.json({
      message: "Privacy settings updated successfully",
      privacySettings,
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({ error: "Failed to update privacy settings" });
  }
});

module.exports = router;
