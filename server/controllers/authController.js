const User = require("../models/User");
const Person = require("../models/Person");
const PrivacySettings = require("../models/PrivacySettings");
const mongoose = require("mongoose");
const { generateToken } = require("../middleware/auth");
const {
  validateRegistrationData,
  validateLoginData,
  sanitizeUserInput,
} = require("../utils/validation");

// Register new user
const register = async (req, res) => {
  try {
    // Sanitize input
    const sanitizedData = sanitizeUserInput(req.body);

    // Validate input
    const validation = validateRegistrationData(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      gender = "prefer_not_to_say",
      dateOfBirth,
      birthPlace,
      occupation,
      education,
      notes,
    } = sanitizedData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if phone number already exists (if provided)
    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "User with this phone number already exists",
        });
      }
    }

    // Create the user's Person record first
    // Create user account first
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    });

    const savedUser = await user.save();

    // Create person profile with user reference
    const person = new Person({
      firstName,
      lastName,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      birthPlace,
      occupation,
      education,
      notes,
      addedBy: savedUser._id,
      associatedUserId: savedUser._id,
    });

    const savedPerson = await person.save();

    // Update user with person reference
    savedUser.personId = savedPerson._id;
    await savedUser.save();

    // Create default privacy settings
    const privacySettings = await PrivacySettings.createDefaultSettings(
      savedUser._id
    );
    await privacySettings.save();

    // Generate JWT token
    const token = generateToken(savedUser._id);

    // Update last login
    savedUser.lastLoginAt = new Date();
    await savedUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          phoneNumber: savedUser.phoneNumber,
          isEmailVerified: savedUser.isEmailVerified,
          personId: savedUser.personId,
          profilePicture: savedUser.profilePicture,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Sanitize input
    const sanitizedData = sanitizeUserInput(req.body);

    // Validate input
    const validation = validateLoginData(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const { email, password } = sanitizedData;

    // Find user by email
    const user = await User.findOne({ email }).populate("personId");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
          personId: user.personId,
          profilePicture: user.profilePicture,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("personId")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = sanitizeUserInput(req.body);
    const userId = req.user._id;

    // Validate names if provided
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phoneNumber !== undefined) {
      // Check if phone number is already taken by another user
      if (phoneNumber) {
        const existingPhone = await User.findOne({
          phoneNumber,
          _id: { $ne: userId },
        });
        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: "Phone number is already taken",
          });
        }
      }
      updates.phoneNumber = phoneNumber || null;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    // Also update the associated Person record
    if (firstName || lastName) {
      const personUpdates = {};
      if (firstName) personUpdates.firstName = firstName;
      if (lastName) personUpdates.lastName = lastName;

      await Person.findByIdAndUpdate(updatedUser.personId, personUpdates);
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get user with password
    const user = await User.findById(userId);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Validate new password
    const { validatePassword } = require("../utils/validation");
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
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
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
};

// Logout (mainly for client-side token removal, but we can track it)
const logout = async (req, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
