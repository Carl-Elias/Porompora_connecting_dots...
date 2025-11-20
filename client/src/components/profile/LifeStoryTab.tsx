import React, { useState, useEffect } from "react";
import { lifeStoryAPI } from "../../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  Baby,
  Plane,
  Star,
  Camera,
} from "lucide-react";

interface LifeStory {
  _id: string;
  title: string;
  description?: string;
  date: string;
  category: string;
  location?: string;
  photos?: Array<{ url: string; caption?: string }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LifeStoryTabProps {
  profile: any;
  onUpdate: () => void;
  isOwnProfile?: boolean;
}

const categoryIcons: { [key: string]: any } = {
  birth: Baby,
  education: GraduationCap,
  career: Briefcase,
  marriage: Heart,
  children: Baby,
  achievement: Award,
  travel: Plane,
  milestone: Star,
  memory: BookOpen,
  other: Star,
};

const categoryColors: { [key: string]: string } = {
  birth: "from-pink-400 to-rose-500",
  education: "from-blue-400 to-indigo-500",
  career: "from-purple-400 to-violet-500",
  marriage: "from-red-400 to-pink-500",
  children: "from-green-400 to-emerald-500",
  achievement: "from-yellow-400 to-orange-500",
  travel: "from-cyan-400 to-blue-500",
  milestone: "from-indigo-400 to-purple-500",
  memory: "from-teal-400 to-cyan-500",
  other: "from-gray-400 to-slate-500",
};

const LifeStoryTab: React.FC<LifeStoryTabProps> = ({
  profile,
  onUpdate,
  isOwnProfile = true,
}) => {
  const [lifeStories, setLifeStories] = useState<LifeStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStory, setEditingStory] = useState<LifeStory | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    category: "memory",
    location: "",
    isPublic: true,
  });

  const [photos, setPhotos] = useState<
    Array<{ url: string; caption?: string }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLifeStories();
  }, [profile._id]);

  const loadLifeStories = async () => {
    try {
      setLoading(true);
      // If viewing another user's profile, fetch their stories; otherwise fetch own stories
      const userId = !isOwnProfile ? profile._id : undefined;
      const response = await lifeStoryAPI.getLifeStories(userId);
      const stories = response.data.data.lifeStories || [];
      // Sort stories by date in ascending order (oldest first, like a timeline)
      const sortedStories = stories.sort((a: LifeStory, b: LifeStory) => {
        const dateA = a.date
          ? new Date(a.date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dateB = b.date
          ? new Date(b.date).getTime()
          : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      });
      setLifeStories(sortedStories);
    } catch (error) {
      console.error("Error loading life stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = () => {
    setEditingStory(null);
    setFormData({
      title: "",
      description: "",
      date: "",
      category: "memory",
      location: "",
      isPublic: true,
    });
    setPhotos([]);
    setShowAddModal(true);
  };

  const handleEditStory = (story: LifeStory) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      description: story.description || "",
      date: story.date ? new Date(story.date).toISOString().split("T")[0] : "",
      category: story.category,
      location: story.location || "",
      isPublic: story.isPublic,
    });
    setPhotos(story.photos || []);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      setSubmitting(true);

      const storyData = {
        ...formData,
        photos: photos,
      };

      if (editingStory) {
        // Update existing story
        await lifeStoryAPI.updateLifeStory(editingStory._id, storyData);
      } else {
        // Add new story
        await lifeStoryAPI.addLifeStory(storyData);
      }

      setShowAddModal(false);
      await loadLifeStories();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving life story:", error);
      alert(error.response?.data?.message || "Failed to save life story");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!window.confirm("Are you sure you want to delete this life story?")) {
      return;
    }

    try {
      await lifeStoryAPI.deleteLifeStory(storyId);
      await loadLifeStories();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting life story:", error);
      alert(error.response?.data?.message || "Failed to delete life story");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert("Please select only image files");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setPhotos((prev) => [...prev, { url, caption: "" }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotos((prev) =>
      prev.map((photo, i) => (i === index ? { ...photo, caption } : photo))
    );
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || BookOpen;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Life Story</h2>
          <p className="text-gray-600 mt-1">
            Document your life's important moments and memories
          </p>
        </div>
        {isOwnProfile && (
          <button
            onClick={handleAddStory}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Story
          </button>
        )}
      </div>

      {/* Life Stories Timeline */}
      {lifeStories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Life Stories Yet
          </h3>
          <p className="text-gray-600 mb-6">
            {isOwnProfile
              ? "Start documenting your life's journey by adding your first story"
              : "This person hasn't shared any life stories yet"}
          </p>
          {isOwnProfile && (
            <button
              onClick={handleAddStory}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Story
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {lifeStories.map((story) => (
            <div
              key={story._id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              {/* Story Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCategoryColor(
                      story.category
                    )} flex items-center justify-center text-white flex-shrink-0`}
                  >
                    {getCategoryIcon(story.category)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      {story.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(story.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      )}
                      {story.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {story.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {story.isPublic ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                        {story.isPublic ? "Public" : "Private"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditStory(story)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(story._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Story Description */}
              {story.description && (
                <p className="text-gray-700 leading-relaxed ml-16 mb-4">
                  {story.description}
                </p>
              )}

              {/* Story Photos */}
              {story.photos && story.photos.length > 0 && (
                <div className="ml-16 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {story.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || `Photo ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Badge */}
              <div className="mt-4 ml-16">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                  {story.category.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingStory ? "Edit Life Story" : "Add Life Story"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Graduated from University"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="memory">Memory</option>
                  <option value="birth">Birth</option>
                  <option value="education">Education</option>
                  <option value="career">Career</option>
                  <option value="marriage">Marriage</option>
                  <option value="children">Children</option>
                  <option value="achievement">Achievement</option>
                  <option value="travel">Travel</option>
                  <option value="milestone">Milestone</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Dhaka, Bangladesh"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Share the details of this moment..."
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer">
                      <Camera className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Upload Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Max 5MB per image. JPG, PNG, GIF supported.
                    </p>
                  </div>

                  {/* Photo Preview Grid */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <img
                            src={photo.url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            value={photo.caption}
                            onChange={(e) =>
                              updatePhotoCaption(index, e.target.value)
                            }
                            placeholder="Add caption (optional)"
                            className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs bg-black/70 text-white placeholder-gray-300 border-0 focus:ring-0"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Make this story public
                  </p>
                  <p className="text-sm text-gray-600">
                    Public stories can be seen by family members
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, isPublic: !formData.isPublic })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isPublic ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingStory ? "Update Story" : "Add Story"}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LifeStoryTab;
