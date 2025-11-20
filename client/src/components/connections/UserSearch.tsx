import React, { useState } from "react";
import { Search, UserPlus, MapPin, Eye } from "lucide-react";
import { usersAPI, profileAPI } from "../../services/api";

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  profilePicture?: string;
  location?: string;
  bio?: string;
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  showConnectionButton?: boolean;
}

const UserSearch: React.FC<UserSearchProps> = ({
  onUserSelect,
  showConnectionButton = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchUsers = async (query: string, page = 1) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await usersAPI.searchUsers(query.trim(), page, 10);
      setSearchResults(response.data.users);
      setCurrentPage(response.data.pagination.currentPage);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      setError("Failed to search users. Please try again.");
      console.error("Error searching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchUsers(searchQuery, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      searchUsers(searchQuery, newPage);
    }
  };

  const handleViewProfile = async (user: User) => {
    try {
      const response = await profileAPI.getUserProfile(user._id);
      setSelectedUser(response.data.data.user);
      setIsModalOpen(true);
    } catch (err) {
      setError("Failed to load user profile");
      console.error("Error fetching user profile:", err);
    }
  };

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 hover:bg-black/40 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold shadow-lg">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>
              {(user.firstName?.[0] || user.username[0]).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-white font-medium truncate">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username}
            </h3>
            {user.username && (user.firstName || user.lastName) && (
              <span className="text-blue-300 text-sm">@{user.username}</span>
            )}
          </div>

          {user.location && (
            <div className="flex items-center text-blue-200 text-sm mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {user.location}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewProfile(user)}
            className="p-2 rounded-lg bg-blue-500/30 text-blue-200 hover:bg-blue-500/50 hover:text-white transition-all border border-blue-400/30"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>

          {showConnectionButton && (
            <button
              onClick={() => onUserSelect?.(user)}
              className="p-2 rounded-lg bg-green-500/30 text-green-200 hover:bg-green-500/50 hover:text-white transition-all border border-green-400/30"
              title="Send Connection Request"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const ProfileModal: React.FC = () => {
    if (!selectedUser || !isModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">User Profile</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4">
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

            <h3 className="text-white text-lg font-medium">
              {selectedUser.firstName && selectedUser.lastName
                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                : selectedUser.username}
            </h3>

            <p className="text-white/60">@{selectedUser.username}</p>
          </div>

          {selectedUser.location && (
            <div className="flex items-center justify-center text-white/60 mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              {selectedUser.location}
            </div>
          )}

          {selectedUser.bio && (
            <div className="text-white/80 text-sm text-center mb-6 p-3 bg-white/5 rounded-lg">
              {selectedUser.bio}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2 px-4 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Close
            </button>

            {showConnectionButton && (
              <button
                onClick={() => {
                  onUserSelect?.(selectedUser);
                  setIsModalOpen(false);
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                Send Request
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or username..."
            className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-lg"
            minLength={2}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || searchQuery.trim().length < 2}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isLoading ? "Searching..." : "Search Users"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-center">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white text-lg font-medium">
            Search Results ({searchResults.length} found)
          </h3>

          <div className="space-y-3">
            {searchResults.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-black/30 border border-purple-500/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/40 hover:border-purple-400/50 transition-all"
              >
                Previous
              </button>

              <span className="text-blue-200 px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-black/30 border border-purple-500/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/40 hover:border-purple-400/50 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {searchQuery.trim().length >= 2 &&
        searchResults.length === 0 &&
        !isLoading && (
          <div className="text-center py-8 text-blue-200">
            <Search className="w-12 h-12 mx-auto mb-4 text-blue-300" />
            <p className="text-white">
              No users found matching "{searchQuery}"
            </p>
            <p className="text-sm mt-2">
              Try different search terms or check your spelling
            </p>
          </div>
        )}

      <ProfileModal />
    </div>
  );
};

export default UserSearch;
