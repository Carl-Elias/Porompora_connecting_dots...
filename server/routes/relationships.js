const express = require("express");
const router = express.Router();
const relationshipController = require("../controllers/relationshipController");
const { authenticateToken } = require("../middleware/auth");

// All routes require authentication
router.use(authenticateToken);

// Relationship routes
router.get("/", relationshipController.getRelationships);
router.get("/tree", relationshipController.getFamilyTree);
router.get("/:relationshipId", relationshipController.getRelationship);
router.post("/", relationshipController.createRelationship);
router.put("/:relationshipId", relationshipController.updateRelationship);
router.delete("/:relationshipId", relationshipController.deleteRelationship);

module.exports = router;
