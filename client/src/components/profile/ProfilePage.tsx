import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { profileAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { User, CircleCheckBig, Loader2 } from "lucide-react";
import PersonalInfoTab from "./PersonalInfoTab";
import MyPersonTab from "./MyPersonTab";
import PrivacyTab from "./PrivacyTab";
import SettingsTab from "./SettingsTab";
import LifeStoryTab from "./LifeStoryTab";

interface UserProfile {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: {
    url: string;
    uploadedAt: string;
  };
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  defaultPrivacyLevel: string;
  allowDiscovery: boolean;
  notificationPreferences: {
    connectionRequests: boolean;
    relationshipSuggestions: boolean;
    familyAdditions: boolean;
    storyComments: boolean;
  };
  personId?: any;
  profileCompleteness: number;
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "personal" | "person" | "lifestory" | "privacy" | "settings"
  >("personal");
  const isOwnProfile = !userId || userId === user?.id;

  // Reset to personal tab when viewing another user's profile
  React.useEffect(() => {
    if (
      !isOwnProfile &&
      (activeTab === "person" ||
        activeTab === "privacy" ||
        activeTab === "settings")
    ) {
      setActiveTab("personal");
    }
  }, [isOwnProfile, activeTab]);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      let response;

      if (userId && userId !== user?.id) {
        // Viewing another user's profile
        response = await profileAPI.getUserProfile(userId);
      } else {
        // Viewing own profile
        response = await profileAPI.getProfile();
      }

      const userData = response.data.data.user;
      setProfile(userData);

      // Only update AuthContext if viewing own profile
      if (isOwnProfile) {
        updateUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePicture: userData.profilePicture,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (completeness: number) => {
    if (completeness < 30) return "text-red-600 bg-red-100";
    if (completeness < 70) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="relative">
              {profile.profilePicture?.url ? (
                <img
                  src={profile.profilePicture.url}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-4 border-white shadow-xl">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.firstName} {profile.lastName}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <p className="text-gray-600">{profile.email}</p>
                {profile.isEmailVerified && (
                  <CircleCheckBig className="w-5 h-5 text-green-500" />
                )}
              </div>
              {profile.bio && (
                <p className="text-gray-700 max-w-2xl mb-3">{profile.bio}</p>
              )}
              <p className="text-sm text-gray-500">
                Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Profile Completeness */}
            <div className="text-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getCompletionColor(
                  profile.profileCompleteness
                )} font-semibold mb-2`}
              >
                {profile.profileCompleteness}% Complete
              </div>
              <p className="text-xs text-gray-600">Profile Completion</p>
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${profile.profileCompleteness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === "personal"
                      ? "bg-indigo-100 text-indigo-700 shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Personal Info
                </button>
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab("person")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                      activeTab === "person"
                        ? "bg-purple-100 text-purple-700 shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    My Family Person
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("lifestory")}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === "lifestory"
                      ? "bg-teal-100 text-teal-700 shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Life Story
                </button>
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => setActiveTab("privacy")}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                        activeTab === "privacy"
                          ? "bg-blue-100 text-blue-700 shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Privacy & Security
                    </button>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                        activeTab === "settings"
                          ? "bg-green-100 text-green-700 shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Settings
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6">
              {activeTab === "personal" && (
                <PersonalInfoTab
                  profile={profile}
                  onUpdate={loadProfile}
                  isOwnProfile={isOwnProfile}
                />
              )}
              {activeTab === "person" && isOwnProfile && (
                <MyPersonTab profile={profile} onUpdate={loadProfile} />
              )}
              {activeTab === "lifestory" && (
                <LifeStoryTab
                  profile={profile}
                  onUpdate={loadProfile}
                  isOwnProfile={isOwnProfile}
                />
              )}
              {activeTab === "privacy" && isOwnProfile && (
                <PrivacyTab profile={profile} onUpdate={loadProfile} />
              )}
              {activeTab === "settings" && isOwnProfile && (
                <SettingsTab profile={profile} onUpdate={loadProfile} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
