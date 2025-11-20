import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gender: string;
    dateOfBirth?: string;
  }) => api.post("/auth/register", userData),

  login: (credentials: { email: string; password: string }) =>
    api.post("/auth/login", credentials),

  getProfile: () => api.get("/auth/profile"),

  updateProfile: (userData: any) => api.put("/auth/profile", userData),

  logout: () => api.post("/auth/logout"),
};

// Family API
export const familyAPI = {
  getMembers: () => api.get("/family/members"),

  getMember: (id: string) => api.get(`/family/members/${id}`),

  getStats: () => api.get("/family/stats"),

  addMember: (memberData: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    birthPlace?: string;
    occupation?: string;
    education?: string;
    notes?: string;
  }) => api.post("/family/members", memberData),

  updateMember: (id: string, memberData: any) =>
    api.put(`/family/members/${id}`, memberData),

  deleteMember: (id: string) => api.delete(`/family/members/${id}`),

  addPhoto: (id: string, photoData: any) =>
    api.post(`/family/members/${id}/photos`, photoData),

  addStory: (id: string, storyData: any) =>
    api.post(`/family/members/${id}/stories`, storyData),
};

// Relationships API
export const relationshipsAPI = {
  getRelationships: () => api.get("/relationships"),

  getRelationship: (id: string) => api.get(`/relationships/${id}`),

  createRelationship: (relationshipData: {
    person1Id: string;
    person2Id: string;
    relationshipType: string;
    startDate?: string;
    notes?: string;
  }) => api.post("/relationships", relationshipData),

  updateRelationship: (id: string, relationshipData: any) =>
    api.put(`/relationships/${id}`, relationshipData),

  deleteRelationship: (id: string) => api.delete(`/relationships/${id}`),

  getFamilyTree: () => api.get("/relationships/tree"),
};

// Users API
export const usersAPI = {
  searchUsers: (query: string, page = 1, limit = 10) =>
    api.get(
      `/users/search?query=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    ),

  getPrivacySettings: () => api.get("/users/privacy-settings"),

  updatePrivacySettings: (settings: any) =>
    api.put("/users/privacy-settings", settings),
};

// Connections API
export const connectionsAPI = {
  sendConnectionRequest: (data: {
    recipientId: string;
    proposedRelationship: any;
    message?: string;
    evidence?: any[];
    discoveryMethod?: string;
  }) => api.post("/connections/send", data),

  getReceivedRequests: (status = "pending", page = 1, limit = 10) =>
    api.get(
      `/connections/received?status=${status}&page=${page}&limit=${limit}`
    ),

  getSentRequests: (status = "pending", page = 1, limit = 10) =>
    api.get(`/connections/sent?status=${status}&page=${page}&limit=${limit}`),

  acceptConnectionRequest: (
    requestId: string,
    data: {
      recipientPersonId: string;
      confirmedRelationship?: any;
    }
  ) => api.post(`/connections/${requestId}/accept`, data),

  rejectConnectionRequest: (requestId: string, reason?: string) =>
    api.post(`/connections/${requestId}/reject`, { reason }),

  cancelConnectionRequest: (requestId: string) =>
    api.delete(`/connections/${requestId}/cancel`),

  getConnectionSuggestions: (personId: string) =>
    api.get(`/connections/suggestions?personId=${personId}`),
};

// Suggestions API (Tier 2 & 3)
export const suggestionAPI = {
  getAll: (status = "pending") => api.get(`/suggestions?status=${status}`),

  getByTier: (status = "pending") =>
    api.get(`/suggestions/by-tier?status=${status}`),

  getStats: () => api.get("/suggestions/stats/summary"),

  accept: (suggestionId: string) =>
    api.post(`/suggestions/${suggestionId}/accept`),

  dismiss: (suggestionId: string, reason?: string) =>
    api.post(`/suggestions/${suggestionId}/dismiss`, { reason }),

  bulkAccept: (suggestionIds: string[]) =>
    api.post("/suggestions/bulk/accept", { suggestionIds }),

  bulkDismiss: (suggestionIds: string[], reason?: string) =>
    api.post("/suggestions/bulk/dismiss", { suggestionIds, reason }),
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get("/profile"),

  getUserProfile: (userId: string) => api.get(`/profile/${userId}`),

  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    bio?: string;
    location?: string;
    dateOfBirth?: string;
    gender?: string;
  }) => api.put("/profile", profileData),

  uploadProfilePicture: (url: string) => api.post("/profile/picture", { url }),

  updatePrivacySettings: (settings: {
    defaultPrivacyLevel?: string;
    allowDiscovery?: boolean;
  }) => api.put("/profile/privacy", settings),

  updateNotificationPreferences: (preferences: {
    connectionRequests?: boolean;
    relationshipSuggestions?: boolean;
    familyAdditions?: boolean;
    storyComments?: boolean;
  }) => api.put("/profile/notifications", preferences),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/profile/password", data),

  getUserStats: () => api.get("/profile/stats"),
};

// Life Story API
export const lifeStoryAPI = {
  getLifeStories: (userId?: string) =>
    userId ? api.get(`/life-story/user/${userId}`) : api.get("/life-story"),

  addLifeStory: (storyData: {
    title: string;
    description?: string;
    date?: string;
    category?: string;
    location?: string;
    photos?: Array<{ url: string; caption?: string }>;
    isPublic?: boolean;
  }) => api.post("/life-story", storyData),

  updateLifeStory: (
    storyId: string,
    storyData: {
      title?: string;
      description?: string;
      date?: string;
      category?: string;
      location?: string;
      photos?: Array<{ url: string; caption?: string }>;
      isPublic?: boolean;
    }
  ) => api.put(`/life-story/${storyId}`, storyData),

  deleteLifeStory: (storyId: string) => api.delete(`/life-story/${storyId}`),
};

export default api;
