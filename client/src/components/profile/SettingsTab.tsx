import React, { useState } from "react";
import { profileAPI } from "../../services/api";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SettingsTabProps {
  profile: any;
  onUpdate: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ profile, onUpdate }) => {
  const [notificationPrefs, setNotificationPrefs] = useState(
    profile.notificationPreferences || {
      connectionRequests: true,
      relationshipSuggestions: true,
      familyAdditions: true,
      storyComments: false,
    }
  );
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notificationsSuccess, setNotificationsSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleNotificationsSave = async () => {
    try {
      setSavingNotifications(true);
      await profileAPI.updateNotificationPreferences(notificationPrefs);
      setNotificationsSuccess(true);
      onUpdate();
      setTimeout(() => setNotificationsSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      alert("Failed to update notification preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    try {
      setSavingPassword(true);
      await profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError(
        error.response?.data?.error || "Failed to change password"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-600">
            Manage your notifications and security
          </p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">Notification Preferences</h3>
        </div>

        {notificationsSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Notification preferences updated successfully!
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Choose which notifications you want to receive
        </p>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={notificationPrefs.connectionRequests}
              onChange={(e) =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  connectionRequests: e.target.checked,
                })
              }
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                Connection Requests
              </div>
              <div className="text-sm text-gray-600">
                Get notified when someone sends you a connection request
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={notificationPrefs.relationshipSuggestions}
              onChange={(e) =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  relationshipSuggestions: e.target.checked,
                })
              }
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                Relationship Suggestions
              </div>
              <div className="text-sm text-gray-600">
                Receive suggestions for potential family relationships
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={notificationPrefs.familyAdditions}
              onChange={(e) =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  familyAdditions: e.target.checked,
                })
              }
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                Family Additions
              </div>
              <div className="text-sm text-gray-600">
                Get notified when new members are added to your family tree
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={notificationPrefs.storyComments}
              onChange={(e) =>
                setNotificationPrefs({
                  ...notificationPrefs,
                  storyComments: e.target.checked,
                })
              }
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                Story Comments
              </div>
              <div className="text-sm text-gray-600">
                Receive notifications for comments on your stories
              </div>
            </div>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNotificationsSave}
            disabled={savingNotifications}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {savingNotifications ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900">Change Password</h3>
        </div>

        {passwordSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Password changed successfully!
            </p>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">{passwordError}</p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Ensure your account is using a strong password to stay secure
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your new password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Confirm your new password"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={
              savingPassword ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword
            }
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {savingPassword ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
