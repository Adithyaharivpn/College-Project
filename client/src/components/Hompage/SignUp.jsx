import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../api/useAuth";
import api from "../../api/axiosConfig";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "../Utils/Themeprovider";
import {
  Loader2,
  CloudUpload,
  Upload,
  User,
  Hammer,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import LocationSearchInput from "./LocationSearchInput";

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "", // "customer" | "tradesperson"
    tradeCategory: [],
    experience: "",
    location: "",
    lat: "",
    lng: "",
    agreeToTerms: false,
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [tradeCategories, setTradeCategories] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);

  // FETCH Categories
  useEffect(() => {
    const fetchTradeCategories = async () => {
      try {
        const response = await api.get("/api/service");
        setTradeCategories(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Service fetch failed");
      }
    };
    fetchTradeCategories();
  }, []);

  // Update Progress Bar
  useEffect(() => {
    if (step === 1) setProgress(33);
    if (step === 2) setProgress(66);
    if (step === 3) setProgress(100);
  }, [step]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSelectChange = (name, value) =>
    setFormData({ ...formData, [name]: value });

  const handleLocationSelect = (locData) => {
    setFormData((prev) => ({
      ...prev,
      location: locData.city || locData.fullAddress.split(",")[0],
      lat: locData.lat,
      lng: locData.lng,
    }));
  };

  const handleNext = async () => {
    setError("");
    // Basic Validation per step
    if (step === 1) {
      if (!formData.role) {
        setError("Please select a role to continue.");
        return;
      }
      setStep((prev) => prev + 1);
    }

    if (step === 2) {
      if (
        !formData.name ||
        !formData.email ||
        !formData.phoneNumber ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("Please fill in all basic details.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (formData.phoneNumber.length < 10) {
        setError("Phone number must be at least 10 digits.");
        return;
      }

      // Check for uniqueness
      setIsNextLoading(true);
      try {
        await api.post("/api/auth/check-unique", {
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        });
        // If successful (status 200), proceed
        setStep((prev) => prev + 1);
      } catch (err) {
        setError(err.response?.data?.error || "Validation failed");
      } finally {
        setIsNextLoading(false);
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      setError("You must acknowledge the terms to proceed.");
      return;
    }

    setIsLoading(true);
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (!["confirmPassword", "agreeToTerms", "tradeCategory"].includes(key)) {
        data.append(key, formData[key]);
      }
    });

    if (formData.tradeCategory && formData.tradeCategory.length > 0) {
      formData.tradeCategory.forEach((cat) =>
        data.append("tradeCategory", cat),
      );
    }

    if (profilePicture) data.append("profilePicture", profilePicture);
    if (verificationDocs.length > 0) {
      Array.from(verificationDocs).forEach((doc) =>
        data.append("documents", doc),
      );
    }

    try {
      const response = await api.post("/api/auth/signup", data);

      if (response.data.token) {
        await login(response.data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation Variants
  const variants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  const borderColor = theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "#e5e5e5";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 pt-24 pb-20 overflow-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/3 blur-[120px] pointer-events-none -z-10" />

      <Card
        className="w-full max-w-4xl bg-card rounded-xl shadow-2xl overflow-hidden transition-all duration-300 dark:shadow-[0_0_50px_-5px_rgba(255,255,255,0.15)]"
        style={{ border: `1px solid ${borderColor}` }}
      >
        <CardHeader className="pt-8 text-center text-foreground pb-2">
          <CardTitle className="text-3xl font-bold">Join The Network</CardTitle>

          <div className="w-full px-10 mx-auto mt-8 mb-6 space-y-4">
            <div className="flex justify-between px-2">
              {["Role Selection", "Personal Info", "Finalize"].map(
                (label, index) => {
                  const stepNum = index + 1;
                  const isActive = step >= stepNum;
                  const isCurrent = step === stepNum;
                  return (
                    <span
                      key={label}
                      className={`text-sm font-bold transition-colors duration-300 ${
                        isCurrent
                          ? "text-blue-600 scale-105"
                          : isActive
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  );
                },
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="pb-10 px-6 sm:px-16 min-h-[500px] flex flex-col justify-center relative">
          {error && (
            <div className="mb-6 rounded-xl bg-destructive/10 border-2 border-destructive/20 p-4 text-sm font-black uppercase text-destructive text-center tracking-widest animate-pulse shadow-lg shadow-destructive/10">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: ROLE SELECTION */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div
                  onClick={() => {
                    setFormData({ ...formData, role: "customer" });
                    setStep(2);
                  }}
                  className={`cursor-pointer group relative p-8 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center space-y-4 hover:scale-[1.02] ${
                    formData.role === "customer"
                      ? "border-blue-500 bg-blue-500/5 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
                      : "border-border hover:border-blue-500/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="h-16 w-16 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-blue-500/50 transition-all">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Customer</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      I want to hire professionals
                    </p>
                  </div>
                  {formData.role === "customer" && (
                    <div className="absolute top-4 right-4 text-blue-500">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => {
                    setFormData({ ...formData, role: "tradesperson" });
                    setStep(2);
                  }}
                  className={`cursor-pointer group relative p-8 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center space-y-4 hover:scale-[1.02] ${
                    formData.role === "tradesperson"
                      ? "border-purple-500 bg-purple-500/5 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]"
                      : "border-border hover:border-purple-500/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="h-16 w-16 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-purple-500/50 transition-all">
                    <Hammer className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Tradesperson</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      I want to find work
                    </p>
                  </div>
                  {formData.role === "tradesperson" && (
                    <div className="absolute top-4 right-4 text-purple-500">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: BASIC INFO */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex justify-center mb-6">
                  <Label className="group cursor-pointer relative h-24 w-24 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-foreground/50 transition-all overflow-hidden bg-muted/20">
                    {profilePicture ? (
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center p-2 text-center">
                        <CloudUpload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-[8px] uppercase font-bold text-muted-foreground">
                          Upload Photo
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setProfilePicture(e.target.files[0])}
                      accept="image/*"
                    />
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="name"
                    placeholder="Full Name"
                    className="h-12 rounded-xl"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    className="h-12 rounded-xl"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <Input
                    name="phoneNumber"
                    type="tel"
                    placeholder="Phone Number"
                    className="h-12 rounded-xl md:col-span-2"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="h-12 rounded-xl"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    className="h-12 rounded-xl"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: SPECIFIC DETAILS */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {formData.role === "tradesperson" ? (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider ml-1 text-dark:!text-black">
                          Specializations (Select Multiple)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {tradeCategories.map((c) => {
                            const isSelected = formData.tradeCategory.includes(
                              c.service_name,
                            );
                            return (
                              <div
                                key={c._id}
                                onClick={() => {
                                  const newCategories = isSelected
                                    ? formData.tradeCategory.filter(
                                        (cat) => cat !== c.service_name,
                                      )
                                    : [
                                        ...formData.tradeCategory,
                                        c.service_name,
                                      ];
                                  setFormData({
                                    ...formData,
                                    tradeCategory: newCategories,
                                  });
                                }}
                                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                    : "bg-card border-border text-foreground hover:border-blue-500"
                                }`}
                              >
                                {c.service_name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <Input
                        name="experience"
                        type="number"
                        placeholder="Years Experience"
                        className="h-12 rounded-xl"
                        value={formData.experience}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider ml-1 text-dark:!text-black">
                        Service Area
                      </label>
                      <LocationSearchInput
                        value={formData.location}
                        onChange={handleChange}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>
                    <label className="cursor-pointer border-2 border-dashed border-border h-16 rounded-xl flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-all text-xs font-bold uppercase tracking-widest text-dark:!text-black">
                      <Upload className="mr-2 h-4 w-4" />
                      {verificationDocs.length > 0
                        ? `${verificationDocs.length} Files Selected`
                        : "Upload License / ID"}
                      <input
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => setVerificationDocs(e.target.files)}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold">Almost There!</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Just accept the terms below to create your customer
                      account and start hiring.
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-4 border-t border-border">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(val) =>
                      setFormData({ ...formData, agreeToTerms: val })
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs font-medium cursor-pointer leading-tight text-dark:!text-black peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Terms of Service and Privacy Protocol.
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center mt-8 pt-4">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isLoading || isNextLoading}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <div /> // Spacer
            )}

            {step < 3 ? (
              step !== 1 && ( // Hide Next on Step 1 because selection auto-advances
                <Button
                  onClick={handleNext}
                  disabled={isNextLoading}
                  className="rounded-xl px-8"
                >
                  {isNextLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 shadow-lg shadow-blue-600/20"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
