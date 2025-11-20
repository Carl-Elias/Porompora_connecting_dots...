const User = require("../models/User");
const Person = require("../models/Person");
const bcrypt = require("bcryptjs");

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select("-password")
      .populate("personId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If user doesn't have gender but their Person record does, sync it
    let needsSave = false;

    if (!user.gender && user.personId?.gender) {
      user.gender = user.personId.gender;
      needsSave = true;
    }

    // If user doesn't have dateOfBirth but their Person record does, sync it
    if (!user.dateOfBirth && user.personId?.dateOfBirth) {
      user.dateOfBirth = user.personId.dateOfBirth;
      needsSave = true;
    }

    // Save if we synced any data
    if (needsSave) {
      await user.save();
    }

    // Calculate profile completeness
    let completeness = 0;
    if (user.firstName) completeness += 10;
    if (user.lastName) completeness += 10;
    if (user.email) completeness += 10;
    if (user.isEmailVerified) completeness += 15;
    if (user.phoneNumber) completeness += 10;
    if (user.isPhoneVerified) completeness += 10;
    if (user.profilePicture?.url) completeness += 15;
    if (user.bio) completeness += 10;
    if (user.location) completeness += 5;
    if (user.personId) completeness += 15;

    // Update completeness if changed
    if (user.profileCompleteness !== completeness) {
      user.profileCompleteness = completeness;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        user,
        profileCompleteness: completeness,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// Get another user's profile by userId
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select(
        "-password -isEmailVerified -isPhoneVerified -notificationPreferences"
      )
      .populate("personId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate profile completeness
    let completeness = 0;
    if (user.firstName) completeness += 10;
    if (user.lastName) completeness += 10;
    if (user.email) completeness += 10;
    if (user.phoneNumber) completeness += 10;
    if (user.profilePicture?.url) completeness += 15;
    if (user.bio) completeness += 10;
    if (user.location) completeness += 5;
    if (user.personId) completeness += 30;

    res.json({
      success: true,
      data: {
        user,
        profileCompleteness: completeness,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      firstName,
      lastName,
      phoneNumber,
      bio,
      location,
      dateOfBirth,
      gender,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) {
      // Check if phone number is already used by another user
      if (phoneNumber && phoneNumber !== user.phoneNumber) {
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser && existingUser._id.toString() !== userId.toString()) {
          return res.status(400).json({
            success: false,
            message: "Phone number already in use",
          });
        }
      }
      user.phoneNumber = phoneNumber;
    }
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    // Only update gender if it's not an empty string
    if (gender !== undefined && gender !== "") user.gender = gender;

    await user.save();

    // If user has a linked Person record, update that too
    if (user.personId) {
      const person = await Person.findById(user.personId);
      if (person) {
        if (firstName !== undefined) person.firstName = firstName;
        if (lastName !== undefined) person.lastName = lastName;
        if (dateOfBirth !== undefined) person.dateOfBirth = dateOfBirth;
        // Only update gender if it's not an empty string
        if (gender !== undefined && gender !== "") person.gender = gender;
        await person.save();
      }
    }

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("personId");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.profilePicture = {
      url,
      uploadedAt: new Date(),
    };

    await user.save();

    // Also update the Person record's profile picture if linked
    if (user.personId) {
      const person = await Person.findById(user.personId);
      if (person) {
        // Check if this photo already exists
        const photoExists = person.photos.some((photo) => photo.url === url);

        if (!photoExists) {
          // Set all existing photos as non-profile
          person.photos.forEach((photo) => {
            photo.isProfilePicture = false;
          });

          // Add new photo as profile picture
          person.photos.push({
            url,
            isProfilePicture: true,
            dateUploaded: new Date(),
          });
        } else {
          // Set this photo as profile picture
          person.photos.forEach((photo) => {
            photo.isProfilePicture = photo.url === url;
          });
        }

        await person.save();
      }
    }

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("personId");

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading profile picture",
      error: error.message,
    });
  }
};

// Update privacy settings
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { defaultPrivacyLevel, allowDiscovery } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (defaultPrivacyLevel !== undefined) {
      const validLevels = ["public", "family", "close_family", "private"];
      if (!validLevels.includes(defaultPrivacyLevel)) {
        return res.status(400).json({
          success: false,
          message: "Invalid privacy level",
        });
      }
      user.defaultPrivacyLevel = defaultPrivacyLevel;
    }

    if (allowDiscovery !== undefined) {
      user.allowDiscovery = allowDiscovery;
    }

    await user.save();

    const updatedUser = await User.findById(userId).select("-password");

    res.json({
      success: true,
      message: "Privacy settings updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating privacy settings",
      error: error.message,
    });
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      connectionRequests,
      relationshipSuggestions,
      familyAdditions,
      storyComments,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (connectionRequests !== undefined) {
      user.notificationPreferences.connectionRequests = connectionRequests;
    }
    if (relationshipSuggestions !== undefined) {
      user.notificationPreferences.relationshipSuggestions =
        relationshipSuggestions;
    }
    if (familyAdditions !== undefined) {
      user.notificationPreferences.familyAdditions = familyAdditions;
    }
    if (storyComments !== undefined) {
      user.notificationPreferences.storyComments = storyComments;
    }

    await user.save();

    const updatedUser = await User.findById(userId).select("-password");

    res.json({
      success: true,
      message: "Notification preferences updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification preferences",
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};

// Get user activity stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count family members added by user
    const totalMembersAdded = await Person.countDocuments({ addedBy: userId });

    // Count relationships created
    const Relationship = require("../models/Relationship");
    const totalRelationshipsCreated = await Relationship.countDocuments({
      addedBy: userId,
    });

    // Count photos uploaded
    const membersWithPhotos = await Person.find({ addedBy: userId }, "photos");
    const totalPhotosUploaded = membersWithPhotos.reduce(
      (sum, member) => sum + (member.photos?.length || 0),
      0
    );

    // Count stories written
    const membersWithStories = await Person.find(
      { addedBy: userId },
      "stories"
    );
    const totalStoriesWritten = membersWithStories.reduce(
      (sum, member) => sum + (member.stories?.length || 0),
      0
    );

    // Count connections
    const ConnectionRequest = require("../models/ConnectionRequest");
    const totalConnections = await ConnectionRequest.countDocuments({
      $or: [{ senderId: userId }, { recipientId: userId }],
      status: "accepted",
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalMembersAdded,
          totalRelationshipsCreated,
          totalPhotosUploaded,
          totalStoriesWritten,
          totalConnections,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user stats",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  updatePrivacySettings,
  updateNotificationPreferences,
  changePassword,
  getUserStats,
};
