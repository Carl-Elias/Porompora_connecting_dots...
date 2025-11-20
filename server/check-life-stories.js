const mongoose = require("mongoose");
const User = require("./models/User");
const Person = require("./models/Person");

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/porompora";

async function checkLifeStories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected\n");

    // Find Marzia's user record
    const marziaUser = await User.findOne({ email: "marzia@gmail.com" });
    if (!marziaUser) {
      console.log("Marzia's user not found!");
      return;
    }

    console.log("=== MARZIA'S USER INFO ===");
    console.log("User ID:", marziaUser._id);
    console.log("Email:", marziaUser.email);
    console.log("Name:", marziaUser.firstName, marziaUser.lastName);

    // Find Marzia's person record
    const marziaPerson = await Person.findOne({
      associatedUserId: marziaUser._id.toString(),
    });

    if (!marziaPerson) {
      console.log("\nMarzia's person record not found!");
      console.log("Looking for associatedUserId:", marziaUser._id.toString());

      // Try to find any person with Marzia's name
      const personByName = await Person.findOne({
        firstName: "Marzia",
        lastName: "Jannat",
      });

      if (personByName) {
        console.log("\nFound person by name:");
        console.log("Person ID:", personByName._id);
        console.log("Associated User ID:", personByName.associatedUserId);
        console.log(
          "Life Stories Count:",
          personByName.lifeStories?.length || 0
        );

        if (personByName.lifeStories && personByName.lifeStories.length > 0) {
          console.log("\n=== LIFE STORIES ===");
          personByName.lifeStories.forEach((story, index) => {
            console.log(`\nStory ${index + 1}:`);
            console.log("  Title:", story.title);
            console.log("  Date:", story.date);
            console.log("  Category:", story.category);
            console.log("  Is Public:", story.isPublic);
            console.log(
              "  Description:",
              story.description?.substring(0, 50) + "..."
            );
          });
        }
      }
      return;
    }

    console.log("\n=== MARZIA'S PERSON INFO ===");
    console.log("Person ID:", marziaPerson._id);
    console.log("Associated User ID:", marziaPerson.associatedUserId);
    console.log("Life Stories Count:", marziaPerson.lifeStories?.length || 0);

    if (marziaPerson.lifeStories && marziaPerson.lifeStories.length > 0) {
      console.log("\n=== LIFE STORIES ===");
      marziaPerson.lifeStories.forEach((story, index) => {
        console.log(`\nStory ${index + 1}:`);
        console.log("  Title:", story.title);
        console.log("  Date:", story.date);
        console.log("  Category:", story.category);
        console.log("  Is Public:", story.isPublic);
        console.log(
          "  Description:",
          story.description?.substring(0, 50) + "..."
        );
      });
    } else {
      console.log("\nNo life stories found for Marzia!");
    }

    // Check all persons with life stories
    console.log("\n=== ALL PERSONS WITH LIFE STORIES ===");
    const personsWithStories = await Person.find({
      "lifeStories.0": { $exists: true },
    }).select("firstName lastName associatedUserId lifeStories");

    personsWithStories.forEach((person) => {
      console.log(
        `\n${person.firstName} ${person.lastName} (UserID: ${person.associatedUserId}): ${person.lifeStories.length} stories`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
  }
}

checkLifeStories();
