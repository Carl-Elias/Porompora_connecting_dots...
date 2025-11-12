export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  lastLoginAt: string;
  personId?: string;
}

export interface Person {
  _id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
  dateOfDeath?: string;
  isAlive: boolean;
  birthPlace?: string;
  occupation?: string;
  education?: string;
  notes?: string;
  addedBy: User | string;
  associatedUserId?: string;
  isVerified: boolean;
  visibility: "public" | "family" | "private";
  photos: Photo[];
  stories: Story[];
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  _id: string;
  url: string;
  caption?: string;
  description?: string;
  dateUploaded: string;
  isProfilePicture: boolean;
}

export interface Story {
  _id: string;
  title: string;
  content: string;
  dateOfEvent?: string;
  createdAt: string;
}

export interface Relationship {
  _id: string;
  person1: Person;
  person2: Person;
  relationshipType:
    | "parent"
    | "child"
    | "spouse"
    | "sibling"
    | "grandparent"
    | "grandchild"
    | "uncle"
    | "aunt"
    | "nephew"
    | "niece"
    | "cousin"
    | "stepparent"
    | "stepchild"
    | "stepsibling"
    | "ex_spouse";
  person1ToPerson2: string;
  person2ToPerson1: string;
  marriageDetails?: {
    marriageDate?: string;
    marriagePlace?: string;
    divorceDate?: string;
    divorcePlace?: string;
  };
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  addedBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyTreeNode {
  id: string;
  data: {
    label: string;
    person: Person;
    isCurrentUserFamily?: boolean;
    isCentralNode?: boolean;
    generation?: number; // Generation relative to central person (0 = central, -1 = parents, +1 = children)
    relationshipToCentral?: string | null; // Relationship type to central person
    relationshipDisplayName?: string | null; // Display name like "Your Father", "Your Son"
  };
  position: { x: number; y: number };
  type?: string;
}

export interface FamilyTreeEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  data: {
    relationship: Relationship;
  };
  type?: string;
}

export interface FamilyTreeData {
  familyMembers: Person[];
  relationships: Relationship[];
  treeStructure: {
    nodes: FamilyTreeNode[];
    edges: FamilyTreeEdge[];
  };
  currentUserId?: string;
  centralPersonId?: string;
  stats: {
    totalMembers: number;
    totalRelationships: number;
    ownMembers?: number;
    connectedMembers?: number;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: string;
  dateOfBirth?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Relationship Suggestion types (Tier 2 & 3)
export interface RelationshipSuggestion {
  _id: string;
  person1: Person;
  person2: Person;
  relationshipType: string;
  tier: number;
  reason: string;
  triggerRelationships?: string[];
  status: "pending" | "accepted" | "dismissed";
  suggestedTo: string;
  respondedAt?: string;
  createdRelationship?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionsResponse {
  suggestions: RelationshipSuggestion[];
  count: number;
}

export interface SuggestionsByTierResponse {
  tier2: {
    suggestions: RelationshipSuggestion[];
    count: number;
  };
  tier3: {
    suggestions: RelationshipSuggestion[];
    count: number;
  };
  totalCount: number;
}

export interface SuggestionStatsResponse {
  tier2: {
    pending: number;
    accepted: number;
    dismissed: number;
  };
  tier3: {
    pending: number;
    accepted: number;
    dismissed: number;
  };
}
