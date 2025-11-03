import React from "react";
import { Person } from "../../types";
import {
  X,
  User,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Camera,
  Heart,
  Edit,
} from "lucide-react";

interface FamilyMemberModalProps {
  member: Person;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (member: Person) => void;
}

const FamilyMemberModal: React.FC<FamilyMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen) return null;

  const calculateAge = (birthDate: string, deathDate?: string): string => {
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      return `${age - 1}`;
    }
    return `${age}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            {member.photos && member.photos.length > 0 ? (
              <img
                src={member.photos[0].url}
                alt={`${member.firstName} ${member.lastName}`}
                className="h-16 w-16 rounded-full object-cover mr-4"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                <User className="h-8 w-8 text-gray-600" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {member.firstName} {member.lastName}
              </h2>
              {member.maidenName && (
                <p className="text-gray-600">née {member.maidenName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(member)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Life Dates */}
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Life Dates</h3>
                {member.dateOfBirth ? (
                  <div className="text-gray-600 text-sm">
                    <p>
                      Born: {new Date(member.dateOfBirth).toLocaleDateString()}
                    </p>
                    {member.dateOfDeath ? (
                      <p>
                        Died:{" "}
                        {new Date(member.dateOfDeath).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="flex items-center">
                        <Heart className="h-3 w-3 text-red-500 mr-1" />
                        Still alive
                      </p>
                    )}
                    {member.dateOfBirth && (
                      <p className="text-xs text-gray-500">
                        Age:{" "}
                        {calculateAge(member.dateOfBirth, member.dateOfDeath)}
                        {member.dateOfDeath ? " at death" : " years old"}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No date information available
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {member.birthPlace && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Birth Place</h3>
                  <p className="text-gray-600 text-sm">{member.birthPlace}</p>
                </div>
              </div>
            )}

            {/* Occupation */}
            {member.occupation && (
              <div className="flex items-start space-x-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Occupation</h3>
                  <p className="text-gray-600 text-sm">{member.occupation}</p>
                </div>
              </div>
            )}

            {/* Education */}
            {member.education && (
              <div className="flex items-start space-x-3">
                <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Education</h3>
                  <p className="text-gray-600 text-sm">{member.education}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {member.notes && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Notes & Stories
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {member.notes}
                </p>
              </div>
            </div>
          )}

          {/* Photos */}
          {member.photos && member.photos.length > 1 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Photos ({member.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {member.photos.map((photo, index) => (
                  <div key={photo._id || index} className="relative group">
                    <img
                      src={photo.url}
                      alt={
                        photo.caption ||
                        `${member.firstName} ${member.lastName}`
                      }
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    {photo.caption && (
                      <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <p className="text-white text-xs text-center px-2">
                          {photo.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stories */}
          {member.stories && member.stories.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Stories</h3>
              <div className="space-y-3">
                {member.stories.map((story, index) => (
                  <div
                    key={story._id || index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {story.title}
                    </h4>
                    <p className="text-gray-700 text-sm mb-2">
                      {story.content}
                    </p>
                    {story.dateOfEvent && (
                      <p className="text-xs text-gray-500">
                        Event Date:{" "}
                        {new Date(story.dateOfEvent).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.isVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {member.isVerified ? "Verified" : "Unverified"}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.visibility === "public"
                      ? "bg-blue-100 text-blue-800"
                      : member.visibility === "family"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.visibility.charAt(0).toUpperCase() +
                    member.visibility.slice(1)}
                </span>
              </div>
              <div>
                <p>Added: {new Date(member.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyMemberModal;
