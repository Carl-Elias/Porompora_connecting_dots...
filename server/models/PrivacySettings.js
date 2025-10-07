const mongoose = require("mongoose");

const privacySettingsSchema = new mongoose.Schema(
  {
    // User these settings belong to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Discovery settings
    discoverySettings: {
      allowNameSearch: {
        type: Boolean,
        default: true,
      },
      allowLocationSearch: {
        type: Boolean,
        default: true,
      },
      allowConnectionRequests: {
        type: Boolean,
        default: true,
      },
      searchableByEmail: {
        type: Boolean,
        default: false, // More private by default
      },
      searchableByPhone: {
        type: Boolean,
        default: false,
      },
    },

    // Family tree visibility
    familyTreeSettings: {
      // Who can see the family tree
      treeVisibility: {
        type: String,
        enum: ["public", "family", "close_family", "private"],
        default: "family",
      },

      // Who can see specific information
      personalInfoVisibility: {
        basicInfo: {
          type: String,
          enum: ["public", "family", "close_family", "private"],
          default: "family",
        },
        birthDate: {
          type: String,
          enum: ["public", "family", "close_family", "private"],
          default: "family",
        },
        contactInfo: {
          type: String,
          enum: ["public", "family", "close_family", "private"],
          default: "close_family",
        },
        location: {
          type: String,
          enum: ["public", "family", "close_family", "private"],
          default: "family",
        },
        photos: {
          type: String,
          enum: ["public", "family", "close_family", "private"],
          default: "family",
        },
        stories: {
          type: String,
          enum: ["public", "family", "close_family", "private"],
          default: "family",
        },
      },
    },

    // Relationship-specific privacy
    relationshipPrivacy: {
      // Who can see specific relationships
      spouseInfo: {
        type: String,
        enum: ["public", "family", "close_family", "private"],
        default: "family",
      },
      childrenInfo: {
        type: String,
        enum: ["public", "family", "close_family", "private"],
        default: "family",
      },
      parentInfo: {
        type: String,
        enum: ["public", "family", "close_family", "private"],
        default: "family",
      },
      extendedFamily: {
        type: String,
        enum: ["public", "family", "close_family", "private"],
        default: "family",
      },
    },

    // Who counts as "close family"
    closeFamilyDefinition: [
      {
        personId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Person",
        },
        relationship: String, // spouse, child, parent, sibling
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Notification preferences
    notifications: {
      connectionRequests: {
        type: Boolean,
        default: true,
      },
      familyUpdates: {
        type: Boolean,
        default: true,
      },
      newFamilyMembers: {
        type: Boolean,
        default: true,
      },
      anniversaries: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
    },

    // Data sharing preferences
    dataSharing: {
      allowFamilyEdits: {
        type: Boolean,
        default: false, // Family members can edit your info
      },
      allowFamilyAdditions: {
        type: Boolean,
        default: true, // Family members can add relatives to your tree
      },
      allowPhotoSharing: {
        type: Boolean,
        default: true,
      },
      allowStorySharing: {
        type: Boolean,
        default: true,
      },
    },

    // Blocked users (for privacy)
    blockedUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        blockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Special privacy rules
    customRules: [
      {
        rule: String, // Description of the rule
        condition: String, // When this rule applies
        action: String, // What to do
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
privacySettingsSchema.index({ userId: 1 });

// Methods to check permissions
privacySettingsSchema.methods.canUserSeeInfo = function (
  viewerUserId,
  infoType,
  targetPersonId
) {
  // Complex logic to determine if viewerUserId can see infoType about targetPersonId
  // based on their relationship and privacy settings

  if (!viewerUserId) {
    // Public viewer
    const publicSettings =
      this.familyTreeSettings.personalInfoVisibility[infoType];
    return publicSettings === "public";
  }

  // Check if user is blocked
  const isBlocked = this.blockedUsers.some(
    (blocked) => blocked.userId.toString() === viewerUserId.toString()
  );
  if (isBlocked) return false;

  // Get privacy level for this info type
  const privacyLevel =
    this.familyTreeSettings.personalInfoVisibility[infoType] || "family";

  switch (privacyLevel) {
    case "public":
      return true;
    case "family":
      // Check if viewer is family member (has any relationship)
      return this.isUserFamilyMember(viewerUserId);
    case "close_family":
      // Check if viewer is in close family list
      return this.isUserCloseFamilyMember(viewerUserId);
    case "private":
      // Only the owner can see
      return viewerUserId.toString() === this.userId.toString();
    default:
      return false;
  }
};

privacySettingsSchema.methods.isUserFamilyMember = async function (
  viewerUserId
) {
  const Relationship = require("./Relationship");
  const User = require("./User");

  // Get the viewer's person record
  const viewerUser = await User.findById(viewerUserId);
  if (!viewerUser) return false;

  // Check if there's any relationship between the trees
  const relationship = await Relationship.findOne({
    $or: [
      {
        person1: viewerUser.personId,
        // person2: any person owned by this.userId
      },
      {
        person2: viewerUser.personId,
        // person1: any person owned by this.userId
      },
    ],
    isActive: true,
  });

  return !!relationship;
};

privacySettingsSchema.methods.isUserCloseFamilyMember = function (
  viewerUserId
) {
  // Check if user is in the close family definition
  return this.closeFamilyDefinition.some(
    (family) =>
      family.personId && family.personId.toString() === viewerUserId.toString()
  );
};

// Static method to get default privacy settings
privacySettingsSchema.statics.createDefaultSettings = function (userId) {
  return new this({
    userId: userId,
    // All other fields will use their default values
  });
};

// Static method to check if user can send connection request
privacySettingsSchema.statics.canSendConnectionRequest = async function (
  fromUserId,
  toUserId
) {
  const toUserSettings = await this.findOne({ userId: toUserId });

  if (!toUserSettings) {
    // If no settings exist, assume default (allow)
    return true;
  }

  // Check if user is blocked
  const isBlocked = toUserSettings.blockedUsers.some(
    (blocked) => blocked.userId.toString() === fromUserId.toString()
  );

  if (isBlocked) return false;

  return toUserSettings.discoverySettings.allowConnectionRequests;
};

module.exports = mongoose.model("PrivacySettings", privacySettingsSchema);
