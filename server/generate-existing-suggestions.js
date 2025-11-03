#!/usr/bin/env node

/**
 * Script to generate Tier 2 suggestions for existing relationships
 * This scans all existing relationships and creates suggestions for uncle/aunt and niece/nephew relationships
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Person = require("./models/Person");
const Relationship = require("./models/Relationship");
const RelationshipSuggestion = require("./models/RelationshipSuggestion");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/porompora")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Helper function to create suggestion for multiple users
async function createSuggestionForAllUsers({
  person1Id,
  person2Id,
  relationshipType,
  tier,
  reason,
}) {
  try {
    // Check if relationship already exists
    const existingRel = await Relationship.findOne({
      $or: [
        { person1: person1Id, person2: person2Id },
        { person1: person2Id, person2: person1Id },
      ],
      isActive: true,
    });

    if (existingRel) {
      console.log(`⏭️  Relationship already exists, skipping suggestion`);
      return 0;
    }

    // Get both people to find their associated users
    const person1 = await Person.findById(person1Id);
    const person2 = await Person.findById(person2Id);

    if (!person1 || !person2) {
      console.log(`⚠️  Person not found, skipping`);
      return 0;
    }

    // Collect all users who should receive this suggestion
    const usersToNotify = new Set();

    // Add user associated with person1
    if (person1.associatedUserId) {
      usersToNotify.add(person1.associatedUserId.toString());
    }
    if (person1.addedBy) {
      usersToNotify.add(person1.addedBy.toString());
    }

    // Add user associated with person2
    if (person2.associatedUserId) {
      usersToNotify.add(person2.associatedUserId.toString());
    }
    if (person2.addedBy) {
      usersToNotify.add(person2.addedBy.toString());
    }

    let createdCount = 0;

    // Create suggestions for each user
    for (const suggestedToUserId of usersToNotify) {
      // Check if suggestion already exists for this user
      const existingSuggestion = await RelationshipSuggestion.findOne({
        $or: [
          { person1: person1Id, person2: person2Id },
          { person1: person2Id, person2: person1Id },
        ],
        suggestedTo: suggestedToUserId,
        status: "pending",
      });

      if (existingSuggestion) {
        console.log(
          `⏭️  Suggestion already exists for user ${suggestedToUserId}, skipping`
        );
        continue;
      }

      // Create new suggestion for this user
      const suggestion = new RelationshipSuggestion({
        person1: person1Id,
        person2: person2Id,
        relationshipType,
        tier,
        reason,
        suggestedTo: suggestedToUserId,
        status: "pending",
      });

      await suggestion.save();
      createdCount++;

      console.log(
        `💡 Created Tier ${tier} suggestion for user ${suggestedToUserId}: ${person1.firstName} ${person1.lastName} (${relationshipType}) ↔ ${person2.firstName} ${person2.lastName}`
      );
    }

    return createdCount;
  } catch (error) {
    console.error("Error creating suggestion:", error);
    return 0;
  }
}

// Helper to get parent relationships for a person
async function getParents(personId) {
  const parentRels = await Relationship.find({
    $or: [
      { person1: personId, relationshipType: "child" }, // This person is child of person2
      { person2: personId, relationshipType: "parent" }, // person1 is parent of this person
    ],
    isActive: true,
  }).populate("person1 person2");

  return parentRels.map((rel) => {
    if (rel.person1._id.toString() === personId.toString()) {
      // relationshipType is "child", so person2 is the parent
      return rel.person2;
    } else {
      // relationshipType is "parent", so person1 is the parent
      return rel.person1;
    }
  });
}

// Helper to get siblings for a person
async function getSiblings(personId) {
  const siblingRels = await Relationship.find({
    $or: [
      { person1: personId, relationshipType: "sibling" },
      { person2: personId, relationshipType: "sibling" },
    ],
    isActive: true,
  }).populate("person1 person2");

  return siblingRels.map((rel) => {
    if (rel.person1._id.toString() === personId.toString()) {
      return rel.person2;
    } else {
      return rel.person1;
    }
  });
}

// Helper to get children for a person
async function getChildren(personId) {
  const childRels = await Relationship.find({
    $or: [
      { person1: personId, relationshipType: "parent" }, // This person is parent of person2
      { person2: personId, relationshipType: "child" }, // person1 is child of this person
    ],
    isActive: true,
  }).populate("person1 person2");

  return childRels.map((rel) => {
    if (rel.person1._id.toString() === personId.toString()) {
      // relationshipType is "parent", so person2 is the child
      return rel.person2;
    } else {
      // relationshipType is "child", so person1 is the child
      return rel.person1;
    }
  });
}

async function generateTier2Suggestions() {
  console.log(
    "\n🔍 Scanning existing relationships for Tier 2 suggestions...\n"
  );

  let totalSuggestions = 0;

  // Get all people
  const allPeople = await Person.find({});
  console.log(`Found ${allPeople.length} people in the database\n`);

  for (const person of allPeople) {
    console.log(
      `\n📋 Processing: ${person.firstName} ${person.lastName} (${person._id})`
    );

    // 1. UNCLE/AUNT SUGGESTIONS
    // If this person has parents, suggest their parent's siblings as uncle/aunt
    const parents = await getParents(person._id);

    for (const parent of parents) {
      const parentSiblings = await getSiblings(parent._id);

      for (const sibling of parentSiblings) {
        // Determine relationship type based on gender
        let relationshipType;
        if (sibling.gender === "male") {
          relationshipType = "uncle";
        } else if (sibling.gender === "female") {
          relationshipType = "aunt";
        } else {
          // If gender is unknown/other, default to uncle
          relationshipType = "uncle";
        }

        const reason = `${sibling.firstName} is ${parent.firstName}'s sibling, making them ${person.firstName}'s ${relationshipType}`;

        const count = await createSuggestionForAllUsers({
          person1Id: sibling._id,
          person2Id: person._id,
          relationshipType,
          tier: 2,
          reason,
        });

        totalSuggestions += count;
      }
    }

    // 2. NIECE/NEPHEW SUGGESTIONS
    // If this person has siblings, suggest their sibling's children as niece/nephew
    const siblings = await getSiblings(person._id);

    for (const sibling of siblings) {
      const siblingChildren = await getChildren(sibling._id);

      for (const child of siblingChildren) {
        // Determine relationship type based on gender
        let relationshipType;
        if (child.gender === "male") {
          relationshipType = "nephew";
        } else if (child.gender === "female") {
          relationshipType = "niece";
        } else {
          // If gender is unknown/other, default to nephew
          relationshipType = "nephew";
        }

        const reason = `${child.firstName} is ${sibling.firstName}'s child, and ${sibling.firstName} is ${person.firstName}'s sibling, making ${child.firstName} their ${relationshipType}`;

        const count = await createSuggestionForAllUsers({
          person1Id: person._id,
          person2Id: child._id,
          relationshipType,
          tier: 2,
          reason,
        });

        totalSuggestions += count;
      }
    }
  }

  console.log(
    `\n✨ Generation complete! Created ${totalSuggestions} suggestions\n`
  );

  // Show summary by user
  const suggestionsByUser = await RelationshipSuggestion.aggregate([
    { $match: { status: "pending", tier: 2 } },
    { $group: { _id: "$suggestedTo", count: { $sum: 1 } } },
  ]);

  console.log("📊 Suggestions by user:");
  for (const userStat of suggestionsByUser) {
    console.log(`   User ${userStat._id}: ${userStat.count} suggestions`);
  }

  mongoose.connection.close();
  console.log("\n✅ Done!\n");
}

// Run the script
generateTier2Suggestions().catch((error) => {
  console.error("❌ Error:", error);
  mongoose.connection.close();
  process.exit(1);
});
