import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { useAuth } from "../../api/useAuth";
import VerifiedBadge from "../Utils/VerifiedBadge";

// Icons
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  Clock,
  Edit2,
  Save,
  X,
  Upload,
  Star,
  Loader2,
  Calendar,
  ArrowLeft,
  Phone,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const UserProfile = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProfilePicture, setNewProfilePicture] = useState(null);

  const viewingUserId = id || "me";
  const isSelfView = !id || (currentUser && id === currentUser.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endpoint =
          viewingUserId === "me"
            ? "/api/users/me"
            : `/api/users/${viewingUserId}`;
        const res = await api.get(endpoint);
        setProfileData(res.data);

        const targetId = viewingUserId === "me" ? res.data._id : viewingUserId;
        const reviewRes = await api.get(`/api/reviews/${targetId}`);
        setReviews(reviewRes.data);
      } catch (err) {
        toast.error("Failed to fetch user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [viewingUserId]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setNewProfilePicture(e.target.files[0]);
  };
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;

    if (profileData.phoneNumber && profileData.phoneNumber.length < 10) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }

    setIsSaving(true);
    const data = new FormData();
    data.append("name", profileData.name);
    data.append("phoneNumber", profileData.phoneNumber); // Added
    if (profileData.role === "tradesperson") {
      data.append("location", profileData.location);
      data.append("experience", profileData.experience);
      data.append("tradeCategory", profileData.tradeCategory);
    }
    if (newProfilePicture) data.append("profilePicture", newProfilePicture);

    try {
      const response = await api.put("/api/users/me", data);
      setProfileData(response.data);
      setEditMode(false);
      setNewProfilePicture(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  if (loading)
    return (
      <div className="flex items-center justify-center py-12 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );

  if (!profileData)
    return (
      <div className="text-center pt-8 text-muted-foreground">
        User not found.
      </div>
    );

  return (
    <div className="bg-background text-foreground pb-20 transition-colors duration-500">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button
          variant="ghost"
          className="mb-6 font-bold text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card className="shadow-2xl border-border bg-card rounded-[2.5rem] overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start p-10 gap-10">
            <div className="relative group">
              <Avatar className="w-40 h-40 border-4 border-background shadow-xl">
                <AvatarImage
                  src={
                    newProfilePicture
                      ? URL.createObjectURL(newProfilePicture)
                      : profileData.profilePictureUrl
                  }
                />
                <AvatarFallback className="text-5xl bg-blue-600 text-white font-black">
                  {profileData.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {editMode && (
                <Label
                  htmlFor="picture"
                  className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-5 w-5 text-white" />
                  <input
                    id="picture"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Label>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-2">
                    {profileData.name}
                    <VerifiedBadge isVerified={profileData.isVerified} />
                  </h1>
                  <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">
                    {profileData.role}
                  </Badge>
                </div>
                <p className="text-muted-foreground font-bold flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4 text-blue-600" /> {profileData.email}
                </p>
              </div>

              {/* RESTORED: Average Rating Display */}
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-black text-foreground">
                  {averageRating}{" "}
                  <span className="text-muted-foreground font-medium text-sm">
                    ({reviews.length} reviews)
                  </span>
                </span>
              </div>
            </div>

            {isSelfView && !editMode && (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl px-6 h-12 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            )}
          </div>

          <Separator className="bg-border/50" />

          <CardContent className="p-10">
            {editMode ? (
              <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-top-4">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      name="name"
                      className="h-14 rounded-xl"
                      value={profileData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Phone Number
                    </Label>
                    <Input
                      name="phoneNumber"
                      type="tel"
                      className="h-14 rounded-xl"
                      value={profileData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>

                  {profileData.role === "tradesperson" && (
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Trade Category
                        </Label>
                        <Input
                          name="tradeCategory"
                          className="h-14 rounded-xl"
                          value={profileData.tradeCategory}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Experience (Years)
                          </Label>
                          <Input
                            type="number"
                            name="experience"
                            className="h-14 rounded-xl"
                            value={profileData.experience}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Location
                          </Label>
                          <Input
                            name="location"
                            className="h-14 rounded-xl"
                            value={profileData.location}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setEditMode(false)}
                    className="rounded-2xl h-12 font-bold px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl h-12 px-10 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sidebar Professional Info */}
                <div className="lg:col-span-4 space-y-6">
                  {profileData.role === "tradesperson" && (
                    <div className="bg-muted/30 p-8 rounded-4xl border border-border space-y-6">
                      <h3 className="text-sm font-bold text-muted-foreground">
                        Professional Info
                      </h3>

                      <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-blue-600/10 rounded-2xl">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-muted-foreground">
                            Trade
                          </span>
                          <span className="font-bold text-lg text-foreground">
                            {Array.isArray(profileData.tradeCategory)
                              ? profileData.tradeCategory.join(", ")
                              : profileData.tradeCategory || "General"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-blue-600/10 rounded-2xl">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-muted-foreground">
                            Experience
                          </span>
                          <span className="font-bold text-lg text-foreground">
                            {profileData.experience
                              ? `${profileData.experience} Years`
                              : "Experienced"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-blue-600/10 rounded-2xl">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-muted-foreground">
                            Location
                          </span>
                          <span className="font-bold text-lg text-foreground">
                            {profileData.location || "Not set"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-muted-foreground ml-4">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>
                      Joined{" "}
                      {new Date(
                        profileData.createdAt || Date.now(),
                      ).getFullYear()}
                    </span>
                  </div>

                  {/* Contact Info (Self Only) */}
                  {isSelfView && (
                    <div className="bg-muted/30 p-8 rounded-4xl] border border-border space-y-6">
                      <h3 className="text-sm font-bold text-muted-foreground">
                        Contact Info (Private)
                      </h3>
                      <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-blue-600/10 rounded-2xl">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-muted-foreground">
                            Phone Number
                          </span>
                          <span className="font-bold text-lg text-foreground">
                            {profileData.phoneNumber || "Not set"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RESTORED: Conditional Review Visibility */}
                <div className="lg:col-span-8 space-y-8">
                  <h3 className="text-2xl font-bold text-foreground">
                    Recent Feedback
                  </h3>

                  {isSelfView ? (
                    /* SUMMARY VIEW FOR SELF */
                    <div className="bg-blue-600/5 border border-blue-600/20 rounded-4xl p-10 flex flex-col items-center text-center space-y-4">
                      <div className="p-5 bg-blue-600/10 rounded-full">
                        <Star className="h-10 w-10 text-blue-600 fill-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-foreground">
                          You have {reviews.length} reviews
                        </p>
                        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                          Your average rating is{" "}
                          <span className="text-blue-600 font-bold">
                            {averageRating} stars
                          </span>
                          . Individual review comments are hidden from your own
                          profile view for privacy.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* FULL VIEW FOR OTHERS */
                    <div className="space-y-6">
                      {reviews.length === 0 ? (
                        <div className="bg-muted/20 border-2 border-dashed border-border rounded-4xl p-16 text-center text-muted-foreground">
                          No feedback received yet.
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <Card
                            key={review._id}
                            className="bg-muted/10 border-border/50 rounded-3xl p-6"
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12 border border-border">
                                <AvatarImage
                                  src={review.reviewerId?.profilePictureUrl}
                                />
                                <AvatarFallback className="bg-blue-600 text-white font-black">
                                  {review.reviewerId?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-black text-foreground">
                                    {review.reviewerId?.name}
                                  </h4>
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                  {review.comment}
                                </p>
                                <p className="text-xs font-semibold text-muted-foreground">
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
