import React, { useState } from "react";
import { RelationshipSuggestion } from "../../types";

interface SuggestionCardProps {
  suggestion: RelationshipSuggestion;
  onAccept: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onDismiss,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(suggestion._id);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setLoading(true);
    try {
      await onDismiss(suggestion._id);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: number) => {
    const colors = {
      2: "bg-blue-100 text-blue-800",
      3: "bg-purple-100 text-purple-800",
    };
    const labels = {
      2: "Tier 2",
      3: "Tier 3",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[tier as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[tier as keyof typeof labels] || `Tier ${tier}`}
      </span>
    );
  };

  const formatRelationship = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {suggestion.person1.firstName} {suggestion.person1.lastName} &{" "}
              {suggestion.person2.firstName} {suggestion.person2.lastName}
            </h3>
            {getTierBadge(suggestion.tier)}
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Suggested relationship:{" "}
            <span className="font-medium text-blue-600">
              {formatRelationship(suggestion.relationshipType)}
            </span>
          </p>
          <p className="text-xs text-gray-500 italic">{suggestion.reason}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded p-3 mb-4">
        <p className="text-xs text-gray-600 mb-1 font-medium">
          People involved:
        </p>
        <div className="space-y-1">
          <p className="text-sm text-gray-700">
            • {suggestion.person1.firstName} {suggestion.person1.lastName} (
            {suggestion.person1.gender || "Unknown"})
          </p>
          <p className="text-sm text-gray-700">
            • {suggestion.person2.firstName} {suggestion.person2.lastName} (
            {suggestion.person2.gender || "Unknown"})
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing..." : "Accept"}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing..." : "Dismiss"}
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-center">
        Suggested on {new Date(suggestion.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default SuggestionCard;
