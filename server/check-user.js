const mongoose = require("mongoose");
const User = require("./models/User");
const Person = require("./models/Person");

// MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/porompora";

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected\n");

    // Find user by email
    const user = await User.findOne({ email: "marzia@gmail.com" })
      .select("-password")
      .populate("personId");

    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("=== USER RECORD ===");
    console.log("ID:", user._id);
    console.log("Email:", user.email);
    console.log("Name:", user.firstName, user.lastName);
    console.log("Phone:", user.phoneNumber || "Not set");
    console.log("Gender:", user.gender || "Not set");
    console.log("Date of Birth:", user.dateOfBirth || "Not set");
    console.log("Location:", user.location || "Not set");
    console.log("Bio:", user.bio || "Not set");
    console.log("Profile Picture:", user.profilePicture?.url || "Not set");
    console.log("Person ID:", user.personId?._id || "Not linked");

    if (user.personId) {
      console.log("\n=== PERSON RECORD ===");
      console.log("ID:", user.personId._id);
      console.log("Name:", user.personId.firstName, user.personId.lastName);
      console.log("Gender:", user.personId.gender || "Not set");
      console.log("Date of Birth:", user.personId.dateOfBirth || "Not set");
      console.log("Birth Place:", user.personId.birthPlace || "Not set");
      console.log("Occupation:", user.personId.occupation || "Not set");
      console.log("Is Alive:", user.personId.isAlive);
      console.log("Photos count:", user.personId.photos?.length || 0);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
}

checkUser();
