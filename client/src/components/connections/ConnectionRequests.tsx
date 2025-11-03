import React, { useState, useEffect } from "react";
import { Send, Clock, Check, X, Eye, Calendar, User } from "lucide-react";
import { connectionsAPI, familyAPI } from "../../services/api";

interface ConnectionRequest {
  _id: string;
  requester: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
    profilePicture?: string;
  };
  recipient: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
    profilePicture?: string;
  };
  proposedRelationship: {
    requesterPerson: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    recipientPersonId?: string;
    relationshipType: string;
    description?: string;
  };
  message?: string;
  evidence: any[];
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  expiresAt: string;
}

interface Person {
  _id: string;
  firstName: string;
  lastName: string;
}

const ConnectionRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>(
    []
  );
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<ConnectionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
    loadFamilyMembers();
  }, [activeTab]);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === "received") {
        const response = await connectionsAPI.getReceivedRequests();
        setReceivedRequests(response.data.requests);
      } else {
        const response = await connectionsAPI.getSentRequests();
        setSentRequests(response.data.requests);
      }
    } catch (err) {
      setError("Failed to load connection requests");
      console.error("Error loading requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const response = await familyAPI.getMembers();
      console.log("Family members response:", response.data); // Debug log
      setFamilyMembers(response.data.data.familyMembers || []);
    } catch (err) {
      console.error("Error loading family members:", err);
    }
  };

  const handleAcceptRequest = async (request: ConnectionRequest) => {
    if (!selectedPerson) {
      setError("Please select a family member to connect with");
      return;
    }

    setIsProcessing(true);
    try {
      await connectionsAPI.acceptConnectionRequest(request._id, {
        recipientPersonId: selectedPerson,
      });

      setIsModalOpen(false);
      setSelectedRequest(null);
      setSelectedPerson("");
      loadRequests();
    } catch (err) {
      setError("Failed to accept connection request");
      console.error("Error accepting request:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason?: string) => {
    setIsProcessing(true);
    try {
      await connectionsAPI.rejectConnectionRequest(requestId, reason);
      loadRequests();
    } catch (err) {
      setError("Failed to reject connection request");
      console.error("Error rejecting request:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setIsProcessing(true);
    try {
      await connectionsAPI.cancelConnectionRequest(requestId);
      loadRequests();
    } catch (err) {
      setError("Failed to cancel connection request");
      console.error("Error cancelling request:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "accepted":
        return <Check className="w-4 h-4 text-green-400" />;
      case "rejected":
        return <X className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "accepted":
        return "text-green-400";
      case "rejected":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  const RequestCard: React.FC<{
    request: ConnectionRequest;
    type: "received" | "sent";
  }> = ({ request, type }) => {
    const otherUser =
      type === "received" ? request.requester : request.recipient;
    const isExpired = new Date(request.expiresAt) < new Date();

    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
              {otherUser.profilePicture ? (
                <img
                  src={otherUser.profilePicture}
                  alt={otherUser.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>
                  {(
                    otherUser.firstName?.[0] || otherUser.username[0]
                  ).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-white font-medium">
                {otherUser.firstName && otherUser.lastName
                  ? `${otherUser.firstName} ${otherUser.lastName}`
                  : otherUser.username}
              </h3>
              <p className="text-white/60 text-sm">@{otherUser.username}</p>
            </div>
          </div>

          <div
            className={`flex items-center space-x-2 ${getStatusColor(
              request.status
            )}`}
          >
            {getStatusIcon(request.status)}
            <span className="text-sm font-medium capitalize">
              {request.status}
            </span>
          </div>
        </div>

        {/* Proposed Relationship */}
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-2">Proposed Relationship</h4>
          <div className="text-white/80 text-sm">
            <div className="flex items-center space-x-2 mb-1">
              <User className="w-4 h-4" />
              <span>
                {request.proposedRelationship.requesterPerson.firstName}{" "}
                {request.proposedRelationship.requesterPerson.lastName}
              </span>
              <span className="text-white/60">is</span>
              <span className="font-medium text-purple-300">
                {request.proposedRelationship.relationshipType}
              </span>
              <span className="text-white/60">of someone in your family</span>
            </div>
          </div>
        </div>

        {/* Message */}
        {request.message && (
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <h5 className="text-white font-medium text-sm mb-1">Message</h5>
            <p className="text-white/80 text-sm">{request.message}</p>
          </div>
        )}

        {/* Evidence */}
        {request.evidence && request.evidence.length > 0 && (
          <div className="mb-4">
            <h5 className="text-white font-medium text-sm mb-2">
              Evidence Attached
            </h5>
            <div className="text-white/60 text-sm">
              {request.evidence.length} file(s) attached
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex justify-between text-white/60 text-xs mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Sent: {formatDate(request.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span className={isExpired ? "text-red-400" : ""}>
              Expires: {formatDate(request.expiresAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {request.status === "pending" && !isExpired && (
          <div className="flex space-x-3">
            {type === "received" ? (
              <>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectRequest(request._id)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            ) : (
              <button
                onClick={() => handleCancelRequest(request._id)}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            <button
              onClick={() => {
                setSelectedRequest(request);
                setIsModalOpen(true);
              }}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const AcceptRequestModal: React.FC = () => {
    if (!selectedRequest || !isModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Accept Connection Request
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-white/80 mb-4">
              <span className="font-medium">
                {selectedRequest.proposedRelationship.requesterPerson.firstName}{" "}
                {selectedRequest.proposedRelationship.requesterPerson.lastName}
              </span>{" "}
              is proposed to be the{" "}
              <span className="font-medium text-purple-300">
                {selectedRequest.proposedRelationship.relationshipType}
              </span>{" "}
              of someone in your family.
            </p>

            <p className="text-white/60 text-sm mb-4">
              Please select which family member they should be connected to:
            </p>

            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">Select a family member...</option>
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
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2 px-4 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => handleAcceptRequest(selectedRequest)}
              disabled={!selectedPerson || isProcessing}
              className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? "Accepting..." : "Accept Request"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentRequests =
    activeTab === "received" ? receivedRequests : sentRequests;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "received"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "sent"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-center">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mx-auto mb-4"></div>
          <p className="text-white/60">Loading requests...</p>
        </div>
      ) : currentRequests.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <Send className="w-16 h-16 mx-auto mb-4 text-white/40" />
          <h3 className="text-lg font-medium mb-2">No {activeTab} requests</h3>
          <p>
            {activeTab === "received"
              ? "You haven't received any connection requests yet"
              : "You haven't sent any connection requests yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentRequests.map((request) => (
            <RequestCard key={request._id} request={request} type={activeTab} />
          ))}
        </div>
      )}

      <AcceptRequestModal />
    </div>
  );
};

export default ConnectionRequests;
