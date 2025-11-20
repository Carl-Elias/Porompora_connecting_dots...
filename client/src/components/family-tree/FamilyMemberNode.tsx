import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { useNavigate } from "react-router-dom";
import { Person } from "../../types";
import { User, Calendar, MapPin, Briefcase, Heart, Eye } from "lucide-react";

interface FamilyMemberNodeProps {
  data: {
    person: Person;
    label: string;
    isCurrentUserFamily?: boolean;
    isCentralNode?: boolean;
    relationshipToCentral?: string | null;
    relationshipDisplayName?: string | null;
  };
  isConnectable: boolean;
  selected?: boolean;
}

const FamilyMemberNode: React.FC<FamilyMemberNodeProps> = ({
  data,
  isConnectable,
  selected,
}) => {
  const {
    person,
    isCurrentUserFamily = false,
    isCentralNode = false,
    relationshipDisplayName = null,
  } = data;
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to profile using associatedUserId if available, otherwise use person _id
    const profileId = person.associatedUserId || person._id;
    navigate(`/profile/${profileId}`);
  };

  const getAgeFromBirthDate = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`
        relative backdrop-blur-sm border-2 rounded-xl shadow-lg p-4 min-w-[220px] 
        transition-all duration-300 ease-in-out cursor-pointer
        ${
          isCentralNode
            ? "bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-400 shadow-indigo-300 shadow-2xl scale-110 ring-4 ring-indigo-200 ring-opacity-50"
            : isCurrentUserFamily
            ? "bg-gradient-to-br from-emerald-50 via-white to-green-50 border-emerald-300 shadow-emerald-200 shadow-xl"
            : "bg-white/80 border-gray-200"
        }
        ${
          selected
            ? "border-indigo-500 shadow-indigo-200 shadow-xl scale-105"
            : isCurrentUserFamily
            ? "hover:border-emerald-400"
            : "hover:border-indigo-300"
        }
        ${isHovered ? "shadow-xl scale-102 bg-white/90" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-center relative">
        {/* Relationship Badge */}
        {relationshipDisplayName && (
          <div className="mb-3 -mt-2">
            <div className="inline-flex items-center justify-center px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold rounded-full shadow-md">
              {relationshipDisplayName}
            </div>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="relative mx-auto w-16 h-16 mb-3 group">
          <div
            className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
            ${
              person.photos && person.photos.length > 0
                ? "bg-gradient-to-br from-indigo-100 to-purple-100"
                : "bg-gradient-to-br from-indigo-500 to-purple-600"
            }
          `}
          >
            {person.photos && person.photos.length > 0 ? (
              <img
                src={
                  person.photos.find((p) => p.isProfilePicture)?.url ||
                  person.photos[0]?.url
                }
                alt={`${person.firstName} ${person.lastName}`}
                className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Status Indicators */}
          {!person.isAlive && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
              <Heart className="w-2 h-2 text-white" />
            </div>
          )}
          {person.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
          {/* Central Node Indicator */}
          {isCentralNode && (
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
          {/* Current User Family Indicator */}
          {isCurrentUserFamily && !isCentralNode && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </div>

        {/* Name Section */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">
            {person.firstName} {person.lastName}
          </h3>
          {person.maidenName && (
            <p className="text-xs text-indigo-600 italic font-medium mt-1">
              (née {person.maidenName})
            </p>
          )}
        </div>

        {/* Details Section */}
        <div
          className={`
          space-y-2 text-xs text-gray-600 transition-all duration-300
          ${isHovered ? "transform scale-105" : ""}
        `}
        >
          {person.dateOfBirth && (
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-2 py-1">
              <Calendar className="w-3 h-3 text-indigo-500" />
              <span className="font-medium">
                {person.isAlive
                  ? `${getAgeFromBirthDate(person.dateOfBirth)} years old`
                  : formatDate(person.dateOfBirth)}
              </span>
            </div>
          )}

          {person.birthPlace && (
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-2 py-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span className="truncate font-medium">{person.birthPlace}</span>
            </div>
          )}

          {person.occupation && (
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg px-2 py-1">
              <Briefcase className="w-3 h-3 text-purple-500" />
              <span className="truncate font-medium">{person.occupation}</span>
            </div>
          )}
        </div>

        {/* Hover Actions */}
        {isHovered && (
          <button
            onClick={handleViewProfile}
            className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-fade-in hover:bg-indigo-600 transition-colors cursor-pointer"
            title="View Profile"
          >
            <Eye className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Connection handles for ReactFlow edges */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: "#6366f1",
          width: "8px",
          height: "8px",
          border: "2px solid white",
        }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: "#6366f1",
          width: "8px",
          height: "8px",
          border: "2px solid white",
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default FamilyMemberNode;
