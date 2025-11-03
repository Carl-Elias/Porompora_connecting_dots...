import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { familyAPI } from "../../services/api";
import { Person } from "../../types";
import {
  User,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Camera,
  X,
  Save,
  ArrowLeft,
} from "lucide-react";

interface AddFamilyMemberProps {
  onClose?: () => void;
  onSuccess?: (member: Person) => void;
}

const AddFamilyMember: React.FC<AddFamilyMemberProps> = ({
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    maidenName: "",
    gender: "prefer_not_to_say" as
      | "male"
      | "female"
      | "other"
      | "prefer_not_to_say",
    dateOfBirth: "",
    dateOfDeath: "",
    isAlive: true,
    birthPlace: "",
    occupation: "",
    education: "",
    notes: "",
    visibility: "family" as "public" | "family" | "private",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    if (
      formData.dateOfBirth &&
      formData.dateOfDeath &&
      new Date(formData.dateOfBirth) > new Date(formData.dateOfDeath)
    ) {
      setError("Date of birth cannot be after date of death");
      return;
    }

    try {
      setLoading(true);
      const response = await familyAPI.addMember(formData);
      const newMember = response.data.data;

      if (onSuccess) {
        onSuccess(newMember);
      }

      if (onClose) {
        onClose();
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add family member");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <User className="h-6 w-6 text-indigo-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">
                Add Family Member
              </h1>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label
                  htmlFor="maidenName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Maiden Name
                </label>
                <input
                  type="text"
                  id="maidenName"
                  name="maidenName"
                  value={formData.maidenName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter maiden name (if applicable)"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Life Dates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Life Dates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="isAlive"
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <input
                    type="checkbox"
                    id="isAlive"
                    name="isAlive"
                    checked={formData.isAlive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Currently Alive</span>
                </label>
              </div>

              {!formData.isAlive && (
                <div>
                  <label
                    htmlFor="dateOfDeath"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Date of Death
                  </label>
                  <input
                    type="date"
                    id="dateOfDeath"
                    name="dateOfDeath"
                    value={formData.dateOfDeath}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="birthPlace"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Birth Place
                </label>
                <input
                  type="text"
                  id="birthPlace"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="City, State/Province, Country"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Professional & Education
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="occupation"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Occupation
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Job title or profession"
                />
              </div>

              <div>
                <label
                  htmlFor="education"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <GraduationCap className="h-4 w-4 inline mr-1" />
                  Education
                </label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Highest education level"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Additional Information
            </h2>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notes & Stories
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Add any notes, stories, or additional information about this family member..."
                />
              </div>

              <div>
                <label
                  htmlFor="visibility"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Privacy Settings
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="private">Private (Only you can see)</option>
                  <option value="family">
                    Family (Family members can see)
                  </option>
                  <option value="public">Public (Anyone can see)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose who can view this family member's information
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 py-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? "Adding..." : "Add Family Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFamilyMember;
