import React, { useEffect, useState } from "react";
import { suggestionAPI } from "../../services/api";

const SuggestionBadge: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await suggestionAPI.getStats();
      // Backend returns: { success: true, data: { tier2: {...}, tier3: {...} } }
      if (response.data?.data) {
        const tier2Pending = response.data.data.tier2?.pending || 0;
        const tier3Pending = response.data.data.tier3?.pending || 0;
        setPendingCount(tier2Pending + tier3Pending);
      }
    } catch (error) {
      console.error("Error fetching suggestion count:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {pendingCount > 9 ? "9+" : pendingCount}
    </span>
  );
};

export default SuggestionBadge;
