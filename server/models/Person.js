const mongoose = require("mongoose");

const personSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    maidenName: {
      type: String,
      trim: true, // For married individuals
    },

    // Personal Details
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    dateOfDeath: {
      type: Date,
    },
    isAlive: {
      type: Boolean,
      default: true,
    },

    // Location Information
    birthPlace: {
      city: String,
      state: String,
      country: String,
    },
    currentLocation: {
      city: String,
      state: String,
      country: String,
    },

    // Contact Information (if they are a registered user)
    associatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true, // Not all family members will be users
    },

    // Family Tree Ownership
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Temporarily disabled for testing
    },

    // Verification Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        relationship: String, // How the verifier is related
        verifiedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Rich Content
    photos: [
      {
        url: String,
        caption: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    stories: [
      {
        title: String,
        content: String,
        authorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Life Story - Important moments and memories
    lifeStories: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        date: Date, // When the event happened
        category: {
          type: String,
          enum: [
            "birth",
            "education",
            "career",
            "marriage",
            "children",
            "achievement",
            "travel",
            "milestone",
            "memory",
            "other",
          ],
          default: "memory",
        },
        location: String,
        photos: [
          {
            url: String,
            caption: String,
          },
        ],
        isPublic: {
          type: Boolean,
          default: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Professional Information
    occupation: String,
    education: String,

    // Privacy Settings
    visibility: {
      type: String,
      enum: ["public", "family", "close_family", "private"],
      default: "family",
    },

    // Family Tree Position (for visualization)
    treePosition: {
      generation: Number, // Relative to the tree owner
      branch: String, // Paternal, maternal, etc.
    },

    // Additional Notes
    notes: String,

    // Metadata
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching
personSchema.index({ firstName: 1, lastName: 1 });
personSchema.index({ addedBy: 1 });
personSchema.index({ associatedUserId: 1 });
personSchema.index({ "birthPlace.country": 1, "birthPlace.state": 1 });

// Methods
personSchema.methods.getFullName = function () {
  const names = [this.firstName, this.middleName, this.lastName].filter(
    Boolean
  );
  return names.join(" ");
};

personSchema.methods.getAge = function () {
  if (!this.dateOfBirth) return null;

  const endDate = this.isAlive ? new Date() : this.dateOfDeath;
  const age = endDate.getFullYear() - this.dateOfBirth.getFullYear();
  const monthDiff = endDate.getMonth() - this.dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && endDate.getDate() < this.dateOfBirth.getDate())
  ) {
    return age - 1;
  }
  return age;
};

// Static method to find public persons for discovery
personSchema.statics.findPublicPersons = function (searchQuery) {
  return this.find({
    $and: [
      { visibility: { $in: ["public", "family"] } },
      {
        $or: [
          { firstName: new RegExp(searchQuery, "i") },
          { lastName: new RegExp(searchQuery, "i") },
          { maidenName: new RegExp(searchQuery, "i") },
        ],
      },
    ],
  }).populate("addedBy", "firstName lastName");
};

module.exports = mongoose.model("Person", personSchema);




