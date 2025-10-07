const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Authentication fields
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Basic profile
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
    },

    // User's own person record in the family tree
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: false, // Temporarily disabled for testing
    },

    // Account settings
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Privacy preferences
    defaultPrivacyLevel: {
      type: String,
      enum: ["public", "family", "close_family", "private"],
      default: "family",
    },

    // Family tree settings
    allowDiscovery: {
      type: Boolean,
      default: true, // Allow others to find this user
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    lastLoginAt: Date,
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for search functionality
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ firstName: 1, lastName: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

module.exports = mongoose.model("User", userSchema);
