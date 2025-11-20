import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { familyAPI, relationshipsAPI } from "../../services/api";
import { Person } from "../../types";
import AddFamilyMember from "../family-tree/AddFamilyMember";
import SuggestionBadge from "../suggestions/SuggestionBadge";
import {
  TreePine,
  Users,
  Plus,
  User,
  Calendar,
  Heart,
  UserPlus,
  Lightbulb,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Clock,
  MapPin,
} from "lucide-react";

interface DashboardStats {
  totalMembers: number;
  generations: number;
  recentAdditions: number;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    generations: 0,
    recentAdditions: 0,
  });
  const [greeting, setGreeting] = useState("");
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    loadDashboardData();
    setGreetingMessage();
    setTimeout(() => setAnimateStats(true), 100);
  }, []);

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else if (hour < 22) setGreeting("Good Evening");
    else setGreeting("Good Night");
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch family tree data (includes all connected members, not just ones added by user)
      const treeResponse = await relationshipsAPI.getFamilyTree();

      console.log("Family Tree API Response:", treeResponse);

      // Extract all persons from the family tree
      let members: Person[] = [];

      if (treeResponse.data.data?.familyMembers) {
        members = treeResponse.data.data.familyMembers;
      } else if (treeResponse.data.familyMembers) {
        members = treeResponse.data.familyMembers;
      }

      console.log("Parsed members:", members);
      console.log("Members length:", members.length);
      setFamilyMembers(members);

      // Use backend calculated stats, with fallback to frontend calculation
      let calculatedStats: DashboardStats;

      if (treeResponse.data.data?.stats) {
        // Backend provides stats - use them directly
        calculatedStats = {
          totalMembers:
            treeResponse.data.data.stats.totalMembers || members.length,
          generations: treeResponse.data.data.stats.generations || 0,
          recentAdditions: members.filter((member: Person) => {
            const createdAt = new Date(member.createdAt || "");
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return createdAt > thirtyDaysAgo;
          }).length,
        };
      } else {
        // Fallback: calculate on frontend with simple birth year logic
        const birthYears = members
          .filter((member) => member.dateOfBirth)
          .map((member) => new Date(member.dateOfBirth!).getFullYear());

        let generations = 0;
        if (birthYears.length > 0) {
          const minYear = Math.min(...birthYears);
          const maxYear = Math.max(...birthYears);
          const yearSpan = maxYear - minYear;
          generations = yearSpan < 25 ? 1 : Math.ceil(yearSpan / 25);
        }

        calculatedStats = {
          totalMembers: members.length,
          generations: generations,
          recentAdditions: members.filter((member: Person) => {
            const createdAt = new Date(member.createdAt || "");
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return createdAt > thirtyDaysAgo;
          }).length,
        };
      }

      console.log("Calculated stats:", calculatedStats);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
            <TreePine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600" />
          </div>
          <p className="mt-4 text-gray-600 font-medium animate-pulse">
            Loading your family tree...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-72 md:w-96 h-72 md:h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 md:w-96 h-72 md:h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 md:w-96 h-72 md:h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6 md:mb-8 gap-4">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-md mb-4 border border-white/40 animate-fade-in">
                <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="text-sm font-medium text-indigo-600">
                  {greeting}
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 md:mb-4 animate-fade-in">
                Welcome Back, {user?.firstName}! 👋
              </h2>
              <p className="text-base md:text-xl text-gray-600 max-w-2xl leading-relaxed animate-fade-in animation-delay-200">
                Your family heritage platform • Discover, document, and
                celebrate
              </p>
            </div>

            {/* Quick Stats Mini Cards */}
            <div className="flex gap-3">
              <div
                className={`bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/40 text-center hover:scale-110 transition-all duration-300 cursor-pointer ${
                  animateStats ? "animate-fade-in-up" : "opacity-0"
                }`}
              >
                <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-800">
                  {stats.totalMembers}
                </div>
                <div className="text-xs text-gray-500">Members</div>
              </div>
              <div
                className={`bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/40 text-center hover:scale-110 transition-all duration-300 cursor-pointer ${
                  animateStats
                    ? "animate-fade-in-up animation-delay-200"
                    : "opacity-0"
                }`}
              >
                <Award className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-800">
                  {stats.generations}
                </div>
                <div className="text-xs text-gray-500">Generations</div>
              </div>
            </div>
          </div>

          {familyMembers.length === 0 && (
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/40 rounded-2xl md:rounded-3xl p-8 md:p-12 shadow-2xl animate-fade-in-up">
              <div className="flex flex-col items-center">
                <div className="relative mb-6 md:mb-8">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                    <TreePine className="h-10 w-10 md:h-14 md:w-14 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-amber-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-4 text-center">
                  🌟 Let's Build Your Family Tree!
                </h3>
                <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed text-center">
                  Every family has a story worth telling. Start your journey by
                  adding your first family member and watch your heritage come
                  to life.
                </p>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 md:px-12 py-3 md:py-4 rounded-xl transition-all duration-300 font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Add Your First Family Member
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          <div
            className={`group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 md:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${
              animateStats ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Users className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                  {stats.totalMembers}
                </p>
                <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Family Members
                </p>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transform group-hover:scale-105 transition-transform"></div>
          </div>

          <div
            className={`group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 md:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${
              animateStats
                ? "animate-fade-in-up animation-delay-200"
                : "opacity-0"
            }`}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Calendar className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                  {stats.generations}
                </p>
                <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Generations
                </p>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transform group-hover:scale-105 transition-transform"></div>
          </div>

          <div
            className={`group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 md:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ${
              animateStats
                ? "animate-fade-in-up animation-delay-400"
                : "opacity-0"
            }`}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Heart className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                  {stats.recentAdditions}
                </p>
                <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Recent Additions
                </p>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transform group-hover:scale-105 transition-transform"></div>
          </div>
        </div>

        {/* Action Cards - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <Link
            to="/family-tree"
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 md:p-8 block hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:bg-gradient-to-br hover:from-white/80 hover:to-indigo-50/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <TreePine className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
                Family Tree
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Explore connections 🌳
              </p>
            </div>
          </Link>

          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 md:p-8 w-full hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:bg-gradient-to-br hover:from-white/80 hover:to-emerald-50/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Plus className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
                Add Member
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Build heritage 👨‍👩‍👧‍👦
              </p>
            </div>
          </button>

          <Link
            to="/connections"
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 md:p-8 block hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:bg-gradient-to-br hover:from-white/80 hover:to-blue-50/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <UserPlus className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
                Connections
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Collaborate 🤝
              </p>
            </div>
          </Link>

          <Link
            to="/suggestions"
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 md:p-8 block hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:bg-gradient-to-br hover:from-white/80 hover:to-amber-50/50 relative overflow-hidden"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative">
                <Lightbulb className="h-8 w-8 md:h-10 md:w-10 text-white" />
                <div className="absolute -top-2 -right-2">
                  <SuggestionBadge />
                </div>
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">
                Suggestions
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Smart insights 💡
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Family Members - Enhanced */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-xl border border-white/40 animate-fade-in-up animation-delay-600">
          <div className="px-6 md:px-8 py-4 md:py-6 border-b border-white/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-t-2xl md:rounded-t-3xl">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              Your Family Members
            </h3>
          </div>
          <div className="p-6 md:p-8">
            {familyMembers.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-6 md:p-8 mx-auto mb-6 md:mb-8 flex items-center justify-center animate-pulse">
                  <Users className="h-12 w-12 md:h-16 md:w-16 text-indigo-400" />
                </div>
                <h4 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
                  No family members yet
                </h4>
                <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-md mx-auto">
                  Start building your family tree by adding your first member!
                </p>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 md:px-10 md:py-4 rounded-xl transition-all duration-300 font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Add Your First Family Member
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {familyMembers.slice(0, 6).map((member, index) => (
                  <div
                    key={member._id}
                    className={`group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 md:p-5 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer animate-fade-in-up`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center mb-3">
                      {member.photos && member.photos.length > 0 ? (
                        <div className="relative">
                          <img
                            src={member.photos[0].url}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                        </div>
                      ) : (
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <User className="h-6 w-6 md:h-7 md:w-7 text-white" />
                        </div>
                      )}
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-gray-900 text-sm md:text-base group-hover:text-indigo-600 transition-colors">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {member.occupation || "Family Member"}
                        </p>
                      </div>
                    </div>
                    {member.dateOfBirth && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        Born:{" "}
                        {new Date(member.dateOfBirth).toLocaleDateString()}
                      </div>
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
