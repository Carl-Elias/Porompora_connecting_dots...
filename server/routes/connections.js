const express = require("express");
const router = express.Router();
const ConnectionRequest = require("../models/ConnectionRequest");
const PrivacySettings = require("../models/PrivacySettings");
const User = require("../models/User");
const Person = require("../models/Person");
const { authenticateToken } = require("../middleware/auth");

// Send a connection request
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const requesterId = req.user._id;
    const {
      recipientId,
      proposedRelationship,
      message,
      evidence = [],
      discoveryMethod = "search",
    } = req.body;

    // Validation
    if (!recipientId || !proposedRelationship) {
      return res.status(400).json({
        error: "Recipient ID and proposed relationship are required",
      });
    }

    if (requesterId.toString() === recipientId) {
      return res.status(400).json({
        error: "Cannot send connection request to yourself",
      });
    }

    // Check if recipient exists and allows connection requests
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.allowDiscovery) {
      return res.status(404).json({
        error: "User not found or not accepting connection requests",
      });
    }

    // Check recipient's privacy settings
    const canSend = await PrivacySettings.canSendConnectionRequest(
      requesterId,
      recipientId
    );
    if (!canSend) {
      return res.status(403).json({
        error: "User does not allow connection requests",
      });
    }

    // Check for existing connection request
    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
      status: { $in: ["pending", "accepted"] },
    });

    if (existingRequest) {
      return res.status(409).json({
        error: "Connection request already exists between these users",
      });
    }

    // Validate proposed relationship structure
    if (
      !proposedRelationship.requesterPerson ||
      !proposedRelationship.relationshipType
    ) {
      return res.status(400).json({
        error:
          "Invalid proposed relationship structure - requesterPerson and relationshipType are required",
      });
    }

    // Verify that requester owns the person they're proposing
    const requesterPerson = await Person.findOne({
      _id: proposedRelationship.requesterPerson,
      addedBy: requesterId,
    });

    if (!requesterPerson) {
      return res.status(400).json({
        error:
          "You can only propose relationships for people in your family tree",
      });
    }

    // Create connection request
    const connectionRequest = new ConnectionRequest({
      requester: requesterId,
      recipient: recipientId,
      proposedRelationship,
      message,
      evidence,
      discoveryMethod,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await connectionRequest.save();

    // Populate for response
    await connectionRequest.populate([
      {
        path: "requester",
        select: "firstName lastName username profilePicture",
      },
      {
        path: "recipient",
        select: "firstName lastName username profilePicture",
      },
      {
        path: "proposedRelationship.requesterPerson",
        select: "firstName lastName",
      },
    ]);

    res.status(201).json({
      message: "Connection request sent successfully",
      connectionRequest,
    });
  } catch (error) {
    console.error("Error sending connection request:", error);
    res.status(500).json({ error: "Failed to send connection request" });
  }
});

// Get received connection requests
router.get("/received", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = "pending", page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const requests = await ConnectionRequest.find({
      recipient: userId,
      status,
      expiresAt: { $gt: new Date() },
    })
      .populate("requester", "firstName lastName username profilePicture")
      .populate("proposedRelationship.requesterPerson", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRequests = await ConnectionRequest.countDocuments({
      recipient: userId,
      status,
      expiresAt: { $gt: new Date() },
    });

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / limit),
        totalRequests,
        hasNextPage: skip + requests.length < totalRequests,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching received requests:", error);
    res.status(500).json({ error: "Failed to fetch connection requests" });
  }
});

// Get sent connection requests
router.get("/sent", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = "pending", page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const requests = await ConnectionRequest.find({
      requester: userId,
      status,
      expiresAt: { $gt: new Date() },
    })
      .populate("recipient", "firstName lastName username profilePicture")
      .populate("proposedRelationship.requesterPerson", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRequests = await ConnectionRequest.countDocuments({
      requester: userId,
      status,
      expiresAt: { $gt: new Date() },
    });

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / limit),
        totalRequests,
        hasNextPage: skip + requests.length < totalRequests,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res.status(500).json({ error: "Failed to fetch connection requests" });
  }
});

// Accept a connection request
router.post("/:requestId/accept", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const { recipientPersonId, confirmedRelationship } = req.body;

    const connectionRequest = await ConnectionRequest.findById(requestId);

    if (!connectionRequest) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    if (connectionRequest.recipient.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only accept requests sent to you" });
    }

    if (connectionRequest.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Request has already been processed" });
    }

    if (connectionRequest.expiresAt < new Date()) {
      return res.status(400).json({ error: "Connection request has expired" });
    }

    // Verify recipient person belongs to the user
    const recipientPerson = await Person.findOne({
      _id: recipientPersonId,
      addedBy: userId,
    });

    if (!recipientPerson) {
      return res.status(400).json({
        error:
          "You can only create relationships for people in your family tree",
      });
    }

    // Set the recipient person in the proposed relationship
    connectionRequest.proposedRelationship.recipientPerson = recipientPersonId;

    console.log("=== ACCEPT CONNECTION DEBUG ===");
    console.log(
      "Connection Request:",
      JSON.stringify(connectionRequest.proposedRelationship, null, 2)
    );
    console.log("Accepting User ID:", userId);
    console.log("===========================");

    // Accept the request (creates the actual relationship)
    const result = await connectionRequest.accept(
      userId,
      confirmedRelationship
    );

    res.json({
      message: "Connection request accepted successfully",
      relationship: result,
    });
  } catch (error) {
    console.error("Error accepting connection request:", error);
    res.status(500).json({ error: "Failed to accept connection request" });
  }
});

// Reject a connection request
router.post("/:requestId/reject", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;

    const connectionRequest = await ConnectionRequest.findById(requestId);

    if (!connectionRequest) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    if (connectionRequest.recipient.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only reject requests sent to you" });
    }

    if (connectionRequest.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Request has already been processed" });
    }

    // Reject the request
    await connectionRequest.reject(reason);

    res.json({ message: "Connection request rejected" });
  } catch (error) {
    console.error("Error rejecting connection request:", error);
    res.status(500).json({ error: "Failed to reject connection request" });
  }
});

// Cancel a sent connection request
router.delete("/:requestId/cancel", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const connectionRequest = await ConnectionRequest.findById(requestId);

    if (!connectionRequest) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    if (connectionRequest.requester.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only cancel requests you sent" });
    }

    if (connectionRequest.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Request has already been processed" });
    }

    await ConnectionRequest.findByIdAndDelete(requestId);

    res.json({ message: "Connection request cancelled" });
  } catch (error) {
    console.error("Error cancelling connection request:", error);
    res.status(500).json({ error: "Failed to cancel connection request" });
  }
});

// Get potential matches for connection suggestions
router.get("/suggestions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { personId } = req.query;

    if (!personId) {
      return res.status(400).json({ error: "Person ID is required" });
    }

    // Verify person belongs to user
    const person = await Person.findOne({ _id: personId, addedBy: userId });
    if (!person) {
      return res
        .status(400)
        .json({ error: "Person not found in your family tree" });
    }

    const suggestions = await ConnectionRequest.findPotentialMatches(
      userId,
      person
    );

    res.json({ suggestions });
  } catch (error) {
    console.error("Error fetching connection suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

module.exports = router;
