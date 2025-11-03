import React, { useEffect, useState } from "react";
import { suggestionAPI } from "../services/api";
import SuggestionCard from "../components/suggestions/SuggestionCard";
import { RelationshipSuggestion, SuggestionStatsResponse } from "../types";

const Suggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "tier2" | "tier3">("all");
  const [stats, setStats] = useState<SuggestionStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
    fetchStats();
  }, [filter]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (filter === "all") {
        response = await suggestionAPI.getAll();
        // Backend returns: { success: true, data: { suggestions: [...], count: N } }
        setSuggestions(response.data?.data?.suggestions || []);
      } else {
        const tier = filter === "tier2" ? 2 : 3;
        const byTierResponse = await suggestionAPI.getByTier();
        // Backend returns: { success: true, data: { tier2: {...}, tier3: {...} } }
        const tierData =
          tier === 2
            ? byTierResponse.data?.data?.tier2
            : byTierResponse.data?.data?.tier3;
        setSuggestions(tierData?.suggestions || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load suggestions");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await suggestionAPI.getStats();
      // Backend returns: { success: true, data: { tier2: {...}, tier3: {...} } }
      setStats(response.data?.data || null);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await suggestionAPI.accept(id);
      await fetchSuggestions();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to accept suggestion");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await suggestionAPI.dismiss(id);
      await fetchSuggestions();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to dismiss suggestion");
    }
  };

  const handleBulkAccept = async () => {
    if (suggestions.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to accept all ${suggestions.length} suggestions?`
      )
    ) {
      return;
    }

    try {
      const ids = suggestions.map((s) => s._id);
      await suggestionAPI.bulkAccept(ids);
      await fetchSuggestions();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to accept suggestions");
    }
  };

  const handleBulkDismiss = async () => {
    if (suggestions.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to dismiss all ${suggestions.length} suggestions?`
      )
    ) {
      return;
    }

    try {
      const ids = suggestions.map((s) => s._id);
      await suggestionAPI.bulkDismiss(ids);
      await fetchSuggestions();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to dismiss suggestions");
    }
  };

  const getFilteredCount = () => {
    if (!stats) return 0;
    if (filter === "tier2") return stats.tier2.pending;
    if (filter === "tier3") return stats.tier3.pending;
    return stats.tier2.pending + stats.tier3.pending;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Relationship Suggestions
        </h1>
        <p className="text-gray-600">
          Review and manage suggested family relationships based on existing
          connections
        </p>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Tier 2 (Confirmation Required)
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {stats.tier2.pending}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {stats.tier2.accepted} accepted, {stats.tier2.dismissed} dismissed
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-medium text-purple-800 mb-1">
              Tier 3 (Suggestions)
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats.tier3.pending}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {stats.tier3.accepted} accepted, {stats.tier3.dismissed} dismissed
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              Total Pending
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {stats.tier2.pending + stats.tier3.pending}
            </p>
            <p className="text-xs text-green-600 mt-1">Requires your review</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "all"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          All ({stats ? stats.tier2.pending + stats.tier3.pending : 0})
        </button>
        <button
          onClick={() => setFilter("tier2")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "tier2"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Tier 2 ({stats?.tier2.pending || 0})
        </button>
        <button
          onClick={() => setFilter("tier3")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "tier3"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Tier 3 ({stats?.tier3.pending || 0})
        </button>
      </div>

      {/* Bulk Actions */}
      {suggestions.length > 0 && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleBulkAccept}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Accept All ({suggestions.length})
          </button>
          <button
            onClick={handleBulkDismiss}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Dismiss All ({suggestions.length})
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading suggestions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && suggestions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No pending suggestions
          </h3>
          <p className="mt-1 text-gray-500">
            {filter === "all"
              ? "You're all caught up! New suggestions will appear here."
              : `No ${filter} suggestions at the moment.`}
          </p>
        </div>
      )}

      {/* Suggestions Grid */}
      {!loading && suggestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion._id}
              suggestion={suggestion}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Suggestions;
