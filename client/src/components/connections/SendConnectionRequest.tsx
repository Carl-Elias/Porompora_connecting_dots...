import React, { useState, useEffect } from "react";
import { User, Send, Heart, FileText, Plus, X } from "lucide-react";
import { connectionsAPI, familyAPI } from "../../services/api";

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  profilePicture?: string;
  location?: string;
}

interface Person {
  _id: string;
  firstName: string;
  lastName: string;
}

interface SendConnectionRequestProps {
  selectedUser: User | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const SendConnectionRequest: React.FC<SendConnectionRequestProps> = ({
  selectedUser,
  onClose,
  onSuccess,
}) => {
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [newEvidence, setNewEvidence] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relationshipTypes = [
    "parent",
    "child",
    "sibling",
    "spouse",
    "grandparent",
    "grandchild",
    "aunt",
    "uncle",
    "niece",
    "nephew",
    "cousin",
    "in-law",
  ];

  useEffect(() => {
    if (selectedUser) {
      loadFamilyMembers();
    }
  }, [selectedUser]);

  const loadFamilyMembers = async () => {
    try {
      console.log("Loading family members..."); // Debug log
      const response = await familyAPI.getMembers();
      console.log("Family members response:", response.data); // Debug log

      if (response.data.success && response.data.data.familyMembers) {
        setFamilyMembers(response.data.data.familyMembers);
        console.log(
          "Family members loaded:",
          response.data.data.familyMembers.length
        ); // Debug log
      } else {
        console.warn("No family members found or invalid response structure");
        setFamilyMembers([]);
      }
    } catch (err: any) {
      console.error("Error loading family members:", err);
      console.error("Error response:", err.response?.data); // Debug log
      setError(
        "Failed to load family members. Please make sure you have added family members to your tree."
      );
    }
  };

  const handleAddEvidence = () => {
    if (newEvidence.trim()) {
      setEvidence([...evidence, newEvidence.trim()]);
      setNewEvidence("");
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !selectedPerson || !relationshipType) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const proposedRelationship = {
        requesterPerson: selectedPerson,
        relationshipType,
        description: `${
          familyMembers.find((p) => p._id === selectedPerson)?.firstName
        } ${
          familyMembers.find((p) => p._id === selectedPerson)?.lastName
        } is the ${relationshipType} of someone in ${
          selectedUser.firstName || selectedUser.username
        }'s family`,
      };

      const requestData = {
        recipientId: selectedUser._id,
        proposedRelationship,
        message: message.trim() || undefined,
        evidence: evidence.map((item) => ({ type: "text", content: item })),
        discoveryMethod: "name_search",
      };

      await connectionsAPI.sendConnectionRequest(requestData);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error sending connection request:", err);
      setError(
        err.response?.data?.error || "Failed to send connection request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Send className="w-6 h-6 mr-2" />
              Send Connection Request
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Selected User Info */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                {selectedUser.profilePicture ? (
                  <img
                    src={selectedUser.profilePicture}
                    alt={selectedUser.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {(
                      selectedUser.firstName?.[0] || selectedUser.username[0]
                    ).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-white font-medium">
                  {selectedUser.firstName && selectedUser.lastName
                    ? `${selectedUser.firstName} ${selectedUser.lastName}`
                    : selectedUser.username}
                </h3>
                <p className="text-white/60 text-sm">
                  @{selectedUser.username}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Family Member */}
            <div>
              <label className="block text-white font-medium mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Select Family Member *
              </label>
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
                disabled={familyMembers.length === 0}
              >
                <option value="">
                  {familyMembers.length === 0
                    ? "No family members available"
                    : "Choose a family member..."}
                </option>
                {familyMembers.map((member) => (
                  <option
                    key={member._id}
                    value={member._id}
                    className="bg-gray-800"
                  >
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
              <p className="text-white/60 text-sm mt-1">
                {familyMembers.length === 0 ? (
                  <span className="text-amber-300">
                    You need to add family members to your tree before sending
                    connection requests.{" "}
                    <button
                      onClick={() => {
                        window.location.href = "/dashboard";
                      }}
                      className="text-amber-200 underline hover:text-amber-100 transition-colors"
                    >
                      Go to dashboard to add family members
                    </button>
                  </span>
                ) : (
                  "Select who from your family tree you want to connect with this user"
                )}
              </p>
            </div>

            {/* Relationship Type */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Heart className="w-4 h-4 inline mr-1" />
                Relationship Type *
              </label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              >
                <option value="">Select relationship type...</option>
                {relationshipTypes.map((type) => (
                  <option key={type} value={type} className="bg-gray-800">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-white/60 text-sm mt-1">
                How is your selected family member related to someone in their
                family?
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-white font-medium mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                placeholder="Add a personal message explaining the connection or providing more context..."
              />
            </div>

            {/* Evidence */}
            <div>
              <label className="block text-white font-medium mb-2">
                Evidence (Optional)
              </label>

              {/* Existing Evidence */}
              {evidence.length > 0 && (
                <div className="space-y-2 mb-3">
                  {evidence.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
                    >
                      <span className="text-white/80 text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Evidence */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Add evidence (photos, documents, stories, etc.)"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddEvidence())
                  }
                />
                <button
                  type="button"
                  onClick={handleAddEvidence}
                  disabled={!newEvidence.trim()}
                  className="px-4 py-3 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/60 text-sm mt-1">
                Add any evidence that supports this family connection
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || !selectedPerson || !relationshipType}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendConnectionRequest;
