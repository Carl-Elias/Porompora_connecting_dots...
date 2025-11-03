import React, { useState } from "react";
import { Users, Search, Bell, Settings } from "lucide-react";
import UserSearch from "./UserSearch";
import ConnectionRequests from "./ConnectionRequests";
import SendConnectionRequest from "./SendConnectionRequest";

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  profilePicture?: string;
  location?: string;
}

const ConnectionsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"search" | "requests">("search");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSendRequest, setShowSendRequest] = useState(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowSendRequest(true);
  };

  const handleRequestSent = () => {
    setShowSendRequest(false);
    setSelectedUser(null);
    // Switch to requests tab to see the sent request
    setActiveTab("requests");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Connections Hub
          </h1>
          <p className="text-blue-100 text-lg">
            Discover and connect with other family historians to build
            collaborative family trees
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/20 backdrop-blur-sm rounded-xl p-1 mb-8 border border-white/10">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-4 px-6 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
              activeTab === "search"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                : "text-blue-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Search Users</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-4 px-6 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
              activeTab === "requests"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                : "text-blue-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Connection Requests</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          {activeTab === "search" ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Search for Family Members
                </h2>
                <p className="text-blue-100">
                  Find other users who might have connections to your family
                  tree. You can search by name or username and send connection
                  requests.
                </p>
              </div>

              <UserSearch
                onUserSelect={handleUserSelect}
                showConnectionButton={true}
              />
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Connection Requests
                </h2>
                <p className="text-blue-100">
                  Manage connection requests you've sent and received. Accept
                  requests to link your family trees together.
                </p>
              </div>

              <ConnectionRequests />
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mt-12 bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            How Connections Work
          </h3>

          <div className="grid md:grid-cols-3 gap-6 text-blue-100">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center mx-auto mb-3 border border-purple-400/50">
                <Search className="w-6 h-6 text-purple-300" />
              </div>
              <h4 className="font-medium mb-2 text-white">
                1. Search & Discover
              </h4>
              <p className="text-sm text-blue-200">
                Search for other users by name or username. Only users who allow
                discovery will appear in results.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center mx-auto mb-3 border border-blue-400/50">
                <Users className="w-6 h-6 text-blue-300" />
              </div>
              <h4 className="font-medium mb-2 text-white">
                2. Propose Connections
              </h4>
              <p className="text-sm text-blue-200">
                Send connection requests explaining how someone in your family
                tree relates to someone in theirs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center mx-auto mb-3 border border-green-400/50">
                <Bell className="w-6 h-6 text-green-300" />
              </div>
              <h4 className="font-medium mb-2 text-white">3. Build Together</h4>
              <p className="text-sm text-blue-200">
                When requests are accepted, your family trees link together,
                creating a larger collaborative family network.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Connection Request Modal */}
      {showSendRequest && (
        <SendConnectionRequest
          selectedUser={selectedUser}
          onClose={() => {
            setShowSendRequest(false);
            setSelectedUser(null);
          }}
          onSuccess={handleRequestSent}
        />
      )}
    </div>
  );
};

export default ConnectionsHub;
