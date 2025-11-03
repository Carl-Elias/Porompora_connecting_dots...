import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { familyAPI } from "../../services/api";
import { Person } from "../../types";
import AddFamilyMember from "../family-tree/AddFamilyMember";
import SuggestionBadge from "../suggestions/SuggestionBadge";
import {
  TreePine,
  Users,
  Plus,
  Settings,
  LogOut,
  User,
  Calendar,
  Heart,
  Camera,
  UserPlus,
  Lightbulb,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    generations: 0,
    recentAdditions: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await familyAPI.getMembers();
      const members = response.data.data.familyMembers || [];
      setFamilyMembers(members);

      // Calculate basic stats
      setStats({
        totalMembers: members.length,
        generations: calculateGenerations(members),
        recentAdditions: members.filter((member: Person) => {
          const createdAt = new Date(member.createdAt || "");
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdAt > thirtyDaysAgo;
        }).length,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGenerations = (members: Person[]): number => {
    // Simple generation calculation based on birth years
    const birthYears = members
      .filter((member) => member.dateOfBirth)
      .map((member) => new Date(member.dateOfBirth!).getFullYear());

    if (birthYears.length === 0) return 0;

    const minYear = Math.min(...birthYears);
    const maxYear = Math.max(...birthYears);
    return Math.ceil((maxYear - minYear) / 25); // Assuming 25 years per generation
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
                <TreePine className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Porompora
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Connecting Dots
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-white/50 px-4 py-2 rounded-full border border-white/30">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-4 py-2 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <div className="mb-6">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Welcome Back, {user?.firstName}! 👋
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Your family heritage platform is ready to help you discover,
              document, and celebrate your family's unique story
            </p>
          </div>

          {familyMembers.length === 0 && (
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/30 rounded-2xl p-10 mb-12 shadow-xl">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <TreePine className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  � Let's Build Your Family Tree!
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Every family has a story worth telling. Start your journey by
                  adding your first family member and watch your heritage come
                  to life.
                </p>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  ✨ Add Your First Family Member
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gray-800 mb-1">
                  {stats.totalMembers}
                </p>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Family Members
                </p>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
          </div>

          <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gray-800 mb-1">
                  {stats.generations}
                </p>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Generations
                </p>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
          </div>

          <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gray-800 mb-1">
                  {stats.recentAdditions}
                </p>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Recent Additions
                </p>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"></div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Link
            to="/family-tree"
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-8 block hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:bg-white/80"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TreePine className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Family Tree
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Explore your family connections in a beautiful interactive
                visualization 🌳
              </p>
            </div>
          </Link>

          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-8 w-full hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:bg-white/80"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Add Member
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Add new family members and build your heritage connections 👨‍👩‍👧‍👦
              </p>
            </div>
          </button>

          <Link
            to="/connections"
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-8 block hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:bg-white/80"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Connections
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with other users and build collaborative family trees 🤝
              </p>
            </div>
          </Link>

          <Link
            to="/suggestions"
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-8 block hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:bg-white/80 relative"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                <Lightbulb className="h-10 w-10 text-white" />
                <div className="absolute -top-2 -right-2">
                  <SuggestionBadge />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Suggestions
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Review relationship suggestions based on family connections �
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Family Members */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
          <div className="px-8 py-6 border-b border-white/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-t-2xl">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              Your Family Members
            </h3>
          </div>
          <div className="p-8">
            {familyMembers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-8 mx-auto mb-8 flex items-center justify-center">
                  <Users className="h-16 w-16 text-indigo-400" />
                </div>
                <h4 className="text-2xl font-bold text-gray-800 mb-4">
                  No family members yet
                </h4>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                  Start building your family tree by adding your first member
                  and watch your heritage come to life!
                </p>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  ✨ Add Your First Family Member
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyMembers.slice(0, 6).map((member) => (
                  <div
                    key={member._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-3">
                      {member.photos && member.photos.length > 0 ? (
                        <img
                          src={member.photos[0].url}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.occupation || "Family Member"}
                        </p>
                      </div>
                    </div>
                    {member.dateOfBirth && (
                      <p className="text-sm text-gray-500">
                        Born:{" "}
                        {new Date(member.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Family Member Modal */}
      <AddFamilyMember
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default Dashboard;
