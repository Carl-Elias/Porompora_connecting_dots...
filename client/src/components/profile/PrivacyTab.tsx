import React, { useState } from "react";
import { profileAPI } from "../../services/api";
import { Shield, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";

interface PrivacyTabProps {
  profile: any;
  onUpdate: () => void;
}

const PrivacyTab: React.FC<PrivacyTabProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    defaultPrivacyLevel: profile.defaultPrivacyLevel || "family",
    allowDiscovery: profile.allowDiscovery !== false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await profileAPI.updatePrivacySettings(formData);
      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      alert("Failed to update privacy settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
          <p className="text-sm text-gray-600">
            Control who can see your family tree information
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">
            Privacy settings updated successfully!
          </p>
        </div>
      )}

      {/* Default Privacy Level */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <Eye className="w-5 h-5 text-indigo-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">
              Default Privacy Level
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This sets the default visibility for new family members, photos,
              and stories you add
            </p>

            <select
              value={formData.defaultPrivacyLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultPrivacyLevel: e.target.value,
                })
              }
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="public">Public - Anyone can see</option>
              <option value="family">
                Family - Only family network can see
              </option>
              <option value="close_family">
                Close Family - Only close relatives
              </option>
              <option value="private">Private - Only you can see</option>
            </select>
          </div>
        </div>

        {/* Privacy Level Descriptions */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
            <div>
              <span className="font-semibold text-gray-900">Public:</span>
              <span className="text-gray-600">
                {" "}
                Visible to everyone, including non-registered users
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
            <div>
              <span className="font-semibold text-gray-900">Family:</span>
              <span className="text-gray-600">
                {" "}
                Visible to all members of your extended family network
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
            <div>
              <span className="font-semibold text-gray-900">Close Family:</span>
              <span className="text-gray-600">
                {" "}
                Only immediate family members (parents, siblings, children)
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
            <div>
              <span className="font-semibold text-gray-900">Private:</span>
              <span className="text-gray-600">
                {" "}
                Only visible to you, hidden from everyone else
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-start gap-3">
          {formData.allowDiscovery ? (
            <Eye className="w-5 h-5 text-indigo-600 mt-1" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400 mt-1" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">Allow Discovery</h3>
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    allowDiscovery: !formData.allowDiscovery,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.allowDiscovery ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.allowDiscovery ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {formData.allowDiscovery
                ? "Other users can find and send connection requests to you"
                : "Your profile is hidden from user search and discovery"}
            </p>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 mb-1">
              Important Privacy Note
            </p>
            <p className="text-amber-800">
              These settings apply to new content you add. You can change the
              privacy level of individual family members, photos, and stories
              after creating them in their respective sections.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Save Privacy Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PrivacyTab;
