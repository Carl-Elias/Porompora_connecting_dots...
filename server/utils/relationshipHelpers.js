/**
 * Relationship Helpers - Improved Relationship Representation
 *
 * This module provides utilities for handling relationships in a more convenient
 * and maintainable way by:
 * - Normalizing relationship types with clear directionality
 * - Computing relationship descriptions dynamically
 * - Handling gender-specific relationships properly
 * - Providing query helpers for efficient relationship lookups
 */

// Define relationship metadata with semantic information
const RELATIONSHIP_METADATA = {
  // Symmetric relationships (same in both directions)
  spouse: {
    symmetric: true,
    displayName: "Spouse",
    icon: "💑",
    category: "immediate",
    inverseFor: { male: "spouse", female: "spouse" },
  },
  sibling: {
    symmetric: true,
    displayName: "Sibling",
    icon: "👫",
    category: "immediate",
    inverseFor: { male: "brother", female: "sister" },
    genderSpecific: {
      male: { type: "brother", displayName: "Brother" },
      female: { type: "sister", displayName: "Sister" },
    },
  },
  cousin: {
    symmetric: true,
    displayName: "Cousin",
    icon: "👥",
    category: "extended",
    inverseFor: { male: "cousin", female: "cousin" },
  },
  ex_spouse: {
    symmetric: true,
    displayName: "Ex-Spouse",
    icon: "💔",
    category: "historical",
    inverseFor: { male: "ex_spouse", female: "ex_spouse" },
  },

  // Asymmetric relationships (directional)
  parent: {
    symmetric: false,
    displayName: "Parent",
    icon: "👨‍👩‍👧",
    category: "immediate",
    inverse: "child",
    genderSpecific: {
      male: { type: "father", displayName: "Father", inverse: "son" },
      female: { type: "mother", displayName: "Mother", inverse: "daughter" },
    },
    inverseGenderSpecific: {
      male: { type: "son", displayName: "Son" },
      female: { type: "daughter", displayName: "Daughter" },
    },
  },
  child: {
    symmetric: false,
    displayName: "Child",
    icon: "👶",
    category: "immediate",
    inverse: "parent",
    genderSpecific: {
      male: { type: "son", displayName: "Son" },
      female: { type: "daughter", displayName: "Daughter" },
    },
  },
  grandparent: {
    symmetric: false,
    displayName: "Grandparent",
    icon: "👴👵",
    category: "extended",
    inverse: "grandchild",
    genderSpecific: {
      male: { type: "grandfather", displayName: "Grandfather" },
      female: { type: "grandmother", displayName: "Grandmother" },
    },
  },
  grandchild: {
    symmetric: false,
    displayName: "Grandchild",
    icon: "👶",
    category: "extended",
    inverse: "grandparent",
    genderSpecific: {
      male: { type: "grandson", displayName: "Grandson" },
      female: { type: "granddaughter", displayName: "Granddaughter" },
    },
  },
  uncle: {
    symmetric: false,
    displayName: "Uncle",
    icon: "👨",
    category: "extended",
    inverse: "nephew",
    genderFor: "male",
    inverseFor: { male: "nephew", female: "niece" },
  },
  aunt: {
    symmetric: false,
    displayName: "Aunt",
    icon: "👩",
    category: "extended",
    inverse: "niece",
    genderFor: "female",
    inverseFor: { male: "nephew", female: "niece" },
  },
  nephew: {
    symmetric: false,
    displayName: "Nephew",
    icon: "👦",
    category: "extended",
    genderFor: "male",
    inverseFor: { male: "uncle", female: "aunt" },
  },
  niece: {
    symmetric: false,
    displayName: "Niece",
    icon: "👧",
    category: "extended",
    genderFor: "female",
    inverseFor: { male: "uncle", female: "aunt" },
  },

  // In-law relationships
  father_in_law: {
    symmetric: false,
    displayName: "Father-in-law",
    icon: "👨",
    category: "in_law",
    inverseFor: { male: "son_in_law", female: "daughter_in_law" },
  },
  mother_in_law: {
    symmetric: false,
    displayName: "Mother-in-law",
    icon: "👩",
    category: "in_law",
    inverseFor: { male: "son_in_law", female: "daughter_in_law" },
  },
  son_in_law: {
    symmetric: false,
    displayName: "Son-in-law",
    icon: "👨",
    category: "in_law",
    genderFor: "male",
    inverseFor: { male: "father_in_law", female: "mother_in_law" },
  },
  daughter_in_law: {
    symmetric: false,
    displayName: "Daughter-in-law",
    icon: "👩",
    category: "in_law",
    genderFor: "female",
    inverseFor: { male: "father_in_law", female: "mother_in_law" },
  },
  brother_in_law: {
    symmetric: false,
    displayName: "Brother-in-law",
    icon: "👨",
    category: "in_law",
    genderFor: "male",
    inverseFor: { male: "brother_in_law", female: "sister_in_law" },
  },
  sister_in_law: {
    symmetric: false,
    displayName: "Sister-in-law",
    icon: "👩",
    category: "in_law",
    genderFor: "female",
    inverseFor: { male: "brother_in_law", female: "sister_in_law" },
  },

  // Step relationships
  stepparent: {
    symmetric: false,
    displayName: "Stepparent",
    icon: "👨‍👩",
    category: "step",
    inverse: "stepchild",
    genderSpecific: {
      male: { type: "stepfather", displayName: "Stepfather" },
      female: { type: "stepmother", displayName: "Stepmother" },
    },
  },
  stepchild: {
    symmetric: false,
    displayName: "Stepchild",
    icon: "👶",
    category: "step",
    inverse: "stepparent",
    genderSpecific: {
      male: { type: "stepson", displayName: "Stepson" },
      female: { type: "stepdaughter", displayName: "Stepdaughter" },
    },
  },
  stepsibling: {
    symmetric: true,
    displayName: "Stepsibling",
    icon: "👫",
    category: "step",
    genderSpecific: {
      male: { type: "stepbrother", displayName: "Stepbrother" },
      female: { type: "stepsister", displayName: "Stepsister" },
    },
  },

  // Adoptive relationships
  adoptive_parent: {
    symmetric: false,
    displayName: "Adoptive Parent",
    icon: "👨‍👩‍👧",
    category: "adoptive",
    inverse: "adoptive_child",
    genderSpecific: {
      male: { type: "adoptive_father", displayName: "Adoptive Father" },
      female: { type: "adoptive_mother", displayName: "Adoptive Mother" },
    },
  },
  adoptive_child: {
    symmetric: false,
    displayName: "Adoptive Child",
    icon: "👶",
    category: "adoptive",
    inverse: "adoptive_parent",
    genderSpecific: {
      male: { type: "adoptive_son", displayName: "Adoptive Son" },
      female: { type: "adoptive_daughter", displayName: "Adoptive Daughter" },
    },
  },

  // Great relationships
  great_grandparent: {
    symmetric: false,
    displayName: "Great-Grandparent",
    icon: "👴👵",
    category: "extended",
    inverse: "great_grandchild",
  },
  great_grandchild: {
    symmetric: false,
    displayName: "Great-Grandchild",
    icon: "👶",
    category: "extended",
    inverse: "great_grandparent",
  },
  great_uncle: {
    symmetric: false,
    displayName: "Great-Uncle",
    icon: "👨",
    category: "extended",
    genderFor: "male",
  },
  great_aunt: {
    symmetric: false,
    displayName: "Great-Aunt",
    icon: "👩",
    category: "extended",
    genderFor: "female",
  },
};

/**
 * Get the inverse relationship type considering gender
 * @param {string} relationshipType - The original relationship type
 * @param {string} targetGender - Gender of the target person
 * @returns {string} The inverse relationship type
 */
function getInverseRelationship(
  relationshipType,
  sourceGender = null,
  targetGender = null
) {
  const metadata = RELATIONSHIP_METADATA[relationshipType];

  if (!metadata) {
    console.warn(`Unknown relationship type: ${relationshipType}`);
    return "related";
  }

  // If symmetric, return the same or gender-specific variant
  if (metadata.symmetric) {
    if (targetGender && metadata.genderSpecific?.[targetGender]) {
      return metadata.genderSpecific[targetGender].type;
    }
    return relationshipType;
  }

  // For asymmetric relationships, check for gender-specific inverse
  if (targetGender && metadata.inverseFor?.[targetGender]) {
    return metadata.inverseFor[targetGender];
  }

  // Check if there's a gender-specific variant for the inverse
  if (targetGender && metadata.inverseGenderSpecific?.[targetGender]) {
    return metadata.inverseGenderSpecific[targetGender].type;
  }

  // Return the basic inverse
  return metadata.inverse || relationshipType;
}

/**
 * Get the display name for a relationship considering gender
 * @param {string} relationshipType - The relationship type
 * @param {string} gender - Gender of the person
 * @returns {string} Display name
 */
function getRelationshipDisplayName(relationshipType, gender = null) {
  const metadata = RELATIONSHIP_METADATA[relationshipType];

  if (!metadata) {
    return relationshipType.replace(/_/g, " ");
  }

  if (gender && metadata.genderSpecific?.[gender]) {
    return metadata.genderSpecific[gender].displayName;
  }

  return metadata.displayName;
}

/**
 * Format a relationship description dynamically
 * @param {Object} person1 - First person object
 * @param {string} relationshipType - The relationship type
 * @param {Object} person2 - Second person object
 * @returns {Object} Formatted relationship descriptions
 */
function formatRelationshipDescription(person1, relationshipType, person2) {
  const displayName1 = getRelationshipDisplayName(
    relationshipType,
    person1.gender
  );
  const inverseType = getInverseRelationship(
    relationshipType,
    person1.gender,
    person2.gender
  );
  const displayName2 = getRelationshipDisplayName(inverseType, person2.gender);

  return {
    person1ToPerson2: `${
      person1.firstName
    } is ${displayName1.toLowerCase()} of ${person2.firstName}`,
    person2ToPerson1: `${
      person2.firstName
    } is ${displayName2.toLowerCase()} of ${person1.firstName}`,
    displayName1,
    displayName2,
    inverseType,
  };
}

/**
 * Get relationship from perspective of a specific person
 * @param {Object} relationship - The relationship document
 * @param {string} personId - The person's ID we're getting perspective for
 * @returns {Object} Relationship from that person's perspective
 */
function getRelationshipPerspective(relationship, personId) {
  const isPerson1 = relationship.person1._id.toString() === personId.toString();
  const person = isPerson1 ? relationship.person1 : relationship.person2;
  const otherPerson = isPerson1 ? relationship.person2 : relationship.person1;

  let relationType;
  if (isPerson1) {
    relationType = relationship.relationshipType;
  } else {
    // Get inverse relationship
    relationType = getInverseRelationship(
      relationship.relationshipType,
      relationship.person1.gender,
      relationship.person2.gender
    );
  }

  const displayName = getRelationshipDisplayName(
    relationType,
    otherPerson.gender
  );

  return {
    relatedPerson: otherPerson,
    relationshipType: relationType,
    displayName,
    description: `${otherPerson.firstName} ${otherPerson.lastName}`,
    fullDescription: `${displayName} - ${otherPerson.firstName} ${otherPerson.lastName}`,
    metadata: RELATIONSHIP_METADATA[relationType],
  };
}

/**
 * Get all relationships for a person grouped by category
 * @param {Array} relationships - Array of relationship documents
 * @param {string} personId - The person's ID
 * @returns {Object} Relationships grouped by category
 */
function getRelationshipsByCategory(relationships, personId) {
  const grouped = {
    immediate: [],
    extended: [],
    in_law: [],
    step: [],
    adoptive: [],
    historical: [],
    other: [],
  };

  relationships.forEach((rel) => {
    const perspective = getRelationshipPerspective(rel, personId);
    const category = perspective.metadata?.category || "other";

    grouped[category].push({
      ...perspective,
      relationshipId: rel._id,
      isActive: rel.isActive,
      confidence: rel.confidence,
      notes: rel.notes,
    });
  });

  return grouped;
}

/**
 * Validate if a relationship type is valid
 * @param {string} relationshipType - The relationship type to validate
 * @returns {boolean} Whether the type is valid
 */
function isValidRelationshipType(relationshipType) {
  return !!RELATIONSHIP_METADATA[relationshipType];
}

/**
 * Get relationship metadata
 * @param {string} relationshipType - The relationship type
 * @returns {Object} Metadata for the relationship
 */
function getRelationshipMetadata(relationshipType) {
  return RELATIONSHIP_METADATA[relationshipType] || null;
}

/**
 * Get all relationship types for a category
 * @param {string} category - The category (immediate, extended, etc.)
 * @returns {Array} Array of relationship types in that category
 */
function getRelationshipTypesByCategory(category) {
  return Object.entries(RELATIONSHIP_METADATA)
    .filter(([_, meta]) => meta.category === category)
    .map(([type, meta]) => ({
      type,
      displayName: meta.displayName,
      icon: meta.icon,
      symmetric: meta.symmetric,
    }));
}

/**
 * Check if relationship type requires gender consideration
 * @param {string} relationshipType - The relationship type
 * @returns {boolean} Whether gender matters for this type
 */
function isGenderSpecific(relationshipType) {
  const metadata = RELATIONSHIP_METADATA[relationshipType];
  return !!(metadata?.genderSpecific || metadata?.genderFor);
}

/**
 * Get the appropriate relationship type based on gender
 * @param {string} baseType - The base relationship type
 * @param {string} gender - The gender to consider
 * @returns {string} The gender-specific type if applicable
 */
function getGenderSpecificType(baseType, gender) {
  const metadata = RELATIONSHIP_METADATA[baseType];

  if (gender && metadata?.genderSpecific?.[gender]) {
    return metadata.genderSpecific[gender].type;
  }

  return baseType;
}

module.exports = {
  RELATIONSHIP_METADATA,
  getInverseRelationship,
  getRelationshipDisplayName,
  formatRelationshipDescription,
  getRelationshipPerspective,
  getRelationshipsByCategory,
  isValidRelationshipType,
  getRelationshipMetadata,
  getRelationshipTypesByCategory,
  isGenderSpecific,
  getGenderSpecificType,
};
