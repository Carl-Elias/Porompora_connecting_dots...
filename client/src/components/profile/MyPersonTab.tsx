import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { profileAPI } from "../../services/api";
import {
  User,
  Users,
  Heart,
  Camera,
  Book,
  TreePine,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface MyPersonTabProps {
  profile: any;
  onUpdate: () => void;
}

const MyPersonTab: React.FC<MyPersonTabProps> = ({ profile, onUpdate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getUserStats();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const person = profile.personId;

  if (!person) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Family Person Linked
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You haven't linked your user account to a person in your family tree
          yet. Create your person record to start building your family tree.
        </p>
        <Link
          to="/family-tree"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <TreePine className="w-5 h-5" />
          Go to Family Tree
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        My Family Tree Person
      </h2>

      {/* Person Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100">
        <div className="flex items-start gap-6">
          {/* Photo */}
          <div>
            {person.photos && person.photos.length > 0 ? (
              <img
                src={
                  person.photos.find((p: any) => p.isProfilePicture)?.url ||
                  person.photos[0].url
                }
                alt={`${person.firstName} ${person.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-4 border-white shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {person.firstName} {person.lastName}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {person.dateOfBirth && (
                <div>
                  <span className="text-gray-600">Born: </span>
                  <span className="font-medium text-gray-900">
                    {new Date(person.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
              {person.gender && (
                <div>
                  <span className="text-gray-600">Gender: </span>
                  <span className="font-medium text-gray-900 capitalize">
                    {person.gender}
                  </span>
                </div>
              )}
              {person.birthPlace && (
                <div>
                  <span className="text-gray-600">Birth Place: </span>
                  <span className="font-medium text-gray-900">
                    {person.birthPlace}
                  </span>
                </div>
              )}
              {person.occupation && (
                <div>
                  <span className="text-gray-600">Occupation: </span>
                  <span className="font-medium text-gray-900">
                    {person.occupation}
                  </span>
                </div>
              )}
            </div>
            {person.notes && (
              <p className="mt-3 text-gray-700">{person.notes}</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-indigo-200 flex flex-wrap gap-3">
          <Link
            to="/family-tree"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-indigo-700 rounded-lg transition-colors font-medium shadow-sm"
          >
            <TreePine className="w-4 h-4" />
            View in Tree
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium shadow-sm">
            <Camera className="w-4 h-4" />
            Add Photos
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium shadow-sm">
            <Book className="w-4 h-4" />
            Add Story
          </button>
        </div>
      </div>

      {/* Contribution Stats */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          My Contributions
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats?.totalMembersAdded || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Family Members Added</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-8 h-8 text-pink-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats?.totalRelationshipsCreated || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Relationships Created</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Camera className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats?.totalPhotosUploaded || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Photos Uploaded</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Book className="w-8 h-8 text-amber-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats?.totalStoriesWritten || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Stories Written</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats?.totalConnections || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Connections Made</p>
            </div>

            <Link
              to="/family-tree"
              className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 border border-indigo-600 hover:shadow-lg transition-all flex flex-col items-center justify-center text-white group"
            >
              <TreePine className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium flex items-center gap-1">
                View Tree <ArrowRight className="w-4 h-4" />
              </p>
            </Link>
          </div>
        )}
      </div>

      {/* Person Details */}
      {person.photos && person.photos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {person.photos.slice(0, 4).map((photo: any, index: number) => (
              <img
                key={index}
                src={photo.url}
                alt={photo.caption || "Family photo"}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-indigo-400 transition-colors cursor-pointer"
              />
            ))}
          </div>
          {person.photos.length > 4 && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              +{person.photos.length - 4} more photos
            </p>
          )}
        </div>
      )}

      {person.stories && person.stories.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Stories</h3>
          <div className="space-y-3">
            {person.stories.slice(0, 3).map((story: any) => (
              <div
                key={story._id}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-1">
                  {story.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {story.content}
                </p>
                {story.dateOfEvent && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(story.dateOfEvent).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
          {person.stories.length > 3 && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              +{person.stories.length - 3} more stories
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MyPersonTab;
