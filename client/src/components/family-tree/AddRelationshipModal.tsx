import React, { useState, useEffect } from "react";
import { X, Heart, Users, Crown, Baby } from "lucide-react";
import { Person } from "../../types";
import { relationshipsAPI, familyAPI } from "../../services/api";

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRelationshipAdded: () => void;
}

const AddRelationshipModal: React.FC<AddRelationshipModalProps> = ({
  isOpen,
  onClose,
  onRelationshipAdded,
}) => {
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [selectedPerson1, setSelectedPerson1] = useState<string>("");
  const [selectedPerson2, setSelectedPerson2] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const relationshipTypes = [
    { value: "parent", label: "Parent", icon: Crown, color: "text-purple-600" },
    { value: "child", label: "Child", icon: Baby, color: "text-blue-600" },
    { value: "spouse", label: "Spouse", icon: Heart, color: "text-red-600" },
    {
      value: "sibling",
      label: "Sibling",
      icon: Users,
      color: "text-green-600",
    },
    {
      value: "grandparent",
      label: "Grandparent",
      icon: Crown,
      color: "text-indigo-600",
    },
    {
      value: "grandchild",
      label: "Grandchild",
      icon: Baby,
      color: "text-cyan-600",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      loadFamilyMembers();
    }
  }, [isOpen]);

  const loadFamilyMembers = async () => {
    try {
      // First try the family tree endpoint which we know works
      const response = await relationshipsAPI.getFamilyTree();
      console.log("Family tree response:", response.data); // Debug log

      // Extract family members from the tree data
      const data = response.data.data;
      const members = data?.familyMembers || data?.members || [];

      console.log("Extracted members:", members); // Debug log

      if (Array.isArray(members)) {
        setFamilyMembers(members);
        setError(""); // Clear any previous errors
      } else {
        // Fallback to direct family members endpoint
        console.log("Trying direct family members endpoint...");
        const fallbackResponse = await familyAPI.getMembers();
        console.log("Fallback response:", fallbackResponse.data);

        const fallbackMembers =
          fallbackResponse.data.data || fallbackResponse.data || [];

        if (Array.isArray(fallbackMembers)) {
          setFamilyMembers(fallbackMembers);
          setError(""); // Clear any previous errors
        } else {
          console.error("No valid family members found in either endpoint");
          setFamilyMembers([]);
          setError("No family members found. Please add family members first.");
        }
      }
    } catch (error) {
      console.error("Error loading family members:", error);
      setError("Failed to load family members");
      setFamilyMembers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPerson1 || !selectedPerson2 || !relationshipType) {
      setError("Please fill in all fields");
      return;
    }

    if (selectedPerson1 === selectedPerson2) {
      setError("Please select two different people");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        person1Id: selectedPerson1,
        person2Id: selectedPerson2,
        relationshipType,
      };

      console.log("Creating relationship with payload:", payload); // Debug log

      await relationshipsAPI.createRelationship(payload);

      onRelationshipAdded();
      onClose();

      // Reset form
      setSelectedPerson1("");
      setSelectedPerson2("");
      setRelationshipType("");
    } catch (error: any) {
      console.error("Relationship creation error:", error); // Debug log
      console.error("Error response:", error.response); // Debug log
      console.error("Error status:", error.response?.status); // Debug log
      console.error("Error data:", error.response?.data); // Debug log

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else {
        setError(
          error.response?.data?.message || "Failed to create relationship"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Add Relationship
              </h2>
              <p className="text-sm text-gray-600">Connect family members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Person 1 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Person
            </label>
            <select
              value={selectedPerson1}
              onChange={(e) => setSelectedPerson1(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="">Select a family member</option>
              {Array.isArray(familyMembers) &&
                familyMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
            </select>
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {relationshipTypes.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRelationshipType(value)}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border-2 transition-all
                    ${
                      relationshipType === value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      relationshipType === value ? "text-emerald-600" : color
                    }`}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Person 2 Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Person
            </label>
            <select
              value={selectedPerson2}
              onChange={(e) => setSelectedPerson2(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="">Select a family member</option>
              {Array.isArray(familyMembers) &&
                familyMembers
                  .filter((member) => member._id !== selectedPerson1)
                  .map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
            </select>
          </div>

          {/* Relationship Preview */}
          {selectedPerson1 && selectedPerson2 && relationshipType && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">
                  {
                    familyMembers.find((m) => m._id === selectedPerson1)
                      ?.firstName
                  }
                </span>
                {" is the "}
                <span className="font-medium">{relationshipType}</span>
                {" of "}
                <span className="font-medium">
                  {
                    familyMembers.find((m) => m._id === selectedPerson2)
                      ?.firstName
                  }
                </span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !selectedPerson1 ||
                !selectedPerson2 ||
                !relationshipType
              }
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Creating..." : "Create Relationship"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRelationshipModal;
