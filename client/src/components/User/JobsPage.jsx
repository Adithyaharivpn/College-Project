import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axiosConfig";
import { useAuth } from "../../api/useAuth";
import Confetti from "react-confetti";
import io from "socket.io-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";

// Icons
import {
  MapPin,
  Briefcase,
  Clock,
  ArrowRight,
  Loader2,
  Star,
  Plus,
  Trash2,
  CalendarDays,
} from "lucide-react";

import JobActionController from "../User/JobActionController";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const timeAgo = (dateString) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  return Math.floor(seconds / 60) + "m ago";
};

const JobsPage = ({ initialTab = "open" }) => {
  const rescheduleDateRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [myWorks, setMyWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const search = params.get("search");

    if (category) {
      setCategoryFilter(category);
    }

    if (search) {
      setSearchTerm(search);
    }
  }, [location.search]);

  const [codeDialog, setCodeDialog] = useState({ open: false, code: "" });
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    jobId: null,
    targetId: null,
  });
  const [verifyDialog, setVerifyDialog] = useState({
    open: false,
    jobId: null,
    customerId: null,
  });
  const [rescheduleDialog, setRescheduleDialog] = useState({
    open: false,
    jobId: null,
    currentDate: null,
  });
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    jobId: null,
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [newDate, setNewDate] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      let mainUrl =
        user?.role === "customer" ? "/api/jobs/userjob" : "/api/jobs/feed";
      const promises = [api.get(mainUrl), api.get("/api/service/")];
      if (user?.role === "tradesperson") {
        promises.push(api.get("/api/jobs/tradesperson/my-works"));
      }
      const results = await Promise.all(promises);
      setJobs(results[0].data || []);
      setCategoryOptions(results[1].data || []);
      if (user?.role === "tradesperson" && results[2]) {
        setMyWorks(results[2].data || []);
      }
    } catch (error) {
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  const fetchDataRef = useRef(fetchData);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.search]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const socket = io(import.meta.env.VITE_API_BASE_URL);
    socket.emit("addUser", userId);

    socket.on("job_review_prompt", (data) => {
      setReviewDialog({
        open: true,
        jobId: data.jobId,
        targetId: data.targetId,
      });
      fetchDataRef.current();
      toast.info("Job Completed! Please leave a review.");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    });

    socket.on("job_created", () => {
      console.log("Socket: job_created received");
      fetchDataRef.current();
      if (user.role === "tradesperson") {
        toast.info("New job available!");
      }
    });

    socket.on("job_updated", () => {
      console.log("Socket: job_updated received");
      fetchDataRef.current();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id || user?.id]);

  const handleContactCustomer = async (job) => {
    const isCustomer = user.role === "customer";

    if (!isCustomer && user.role === "tradesperson" && !user.isVerified) {
      toast.error("Account pending verification.", {
        description: "You cannot initiate chats until approved.",
      });
      return;
    }

    try {
      const payload = {
        jobId: job._id,
        customerId: isCustomer
          ? user._id || user.id
          : job.user?._id || job.user,
        tradespersonId: isCustomer
          ? job.assignedTo?._id || job.assignedTo
          : user._id || user.id,
      };

      const res = await api.post("/api/chat/initiate", payload);
      navigate(`/dashboard/chat/${res.data._id}`);
    } catch (err) {
      toast.error("Could not start chat.");
    }
  };

  const handleCancelJob = async () => {
    try {
      await api.put(`/api/jobs/${cancelDialog.jobId}/cancel`);
      toast.success("Job cancelled");
      setCancelDialog({ open: false, jobId: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  const handleStartJourney = async (job) => {
    try {
      if (!job.appointment || !job.appointment._id) {
        toast.error(
          "No linked appointment found. Please ensure a quote is accepted.",
        );
        return;
      }
      await api.put(`/api/appointments/${job.appointment._id}/start-journey`);
      toast.success("Journey started! (Status: On The Way)");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start journey");
    }
  };

  const handleStartJob = async (job) => {
    toast.loading("Starting job...");
    try {
      await api.put(`/api/jobs/${job._id}/start`, { lat: 0, lng: 0 });
      toast.dismiss();
      toast.success("Job started successfully!");
      fetchData();
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Failed to start job.");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!newDate) {
      toast.error("Please select a date first.");
      return;
    }
    try {
      const jobId = rescheduleDialog.jobId;
      const jobObj = [...jobs, ...myWorks].find(
        (j) => (j._id?.toString() || j._id) === jobId,
      );

      if (["assigned", "in_progress"].includes(jobObj?.status?.toLowerCase())) {
        try {
          const isoProposedDate = new Date(newDate).toISOString();
          await api.post(`/api/appointments/propose-reschedule`, {
            jobId,
            proposedDate: isoProposedDate,
            proposedBy: user._id || user.id,
          });
          toast.success(
            "Reschedule proposed! The other party must accept in chat.",
          );
          setRescheduleDialog({ open: false, jobId: null, currentDate: null });
          setNewDate("");
          fetchData();
          return;
        } catch (propErr) {
          console.error("Propose Error:", propErr);
          toast.error(
            propErr.response?.data?.message || "Failed to propose reschedule.",
          );
          return;
        }
      }

      try {
        const isoScheduledDate = new Date(newDate).toISOString();
        await api.put(`/api/jobs/${jobId}/reschedule`, {
          scheduledDate: isoScheduledDate,
        });
        toast.success("Job rescheduled successfully!");
        setRescheduleDialog({ open: false, jobId: null, currentDate: null });
      } catch (jobErr) {
        const msg = jobErr.response?.data?.message || "Could not reschedule.";
        toast.error(msg);
      }
      setNewDate("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reschedule");
    }
  };

  const handleVerifySubmit = async () => {
    try {
      await api.post("/api/jobs/complete", {
        jobId: verifyDialog.jobId,
        code: verifyCode,
      });
      setShowConfetti(true);
      setVerifyDialog({ open: false, jobId: null, customerId: null });
      toast.success("Job Completed!");

      setReviewDialog({
        open: true,
        jobId: verifyDialog.jobId,
        targetId: verifyDialog.customerId,
      });

      fetchData();

      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      toast.error("Invalid Code");
    }
  };

  const handleSubmitReview = async () => {
    try {
      await api.post("/api/reviews", {
        jobId: reviewDialog.jobId,
        targetUserId: reviewDialog.targetId,
        rating,
        comment,
      });
      toast.success("Review submitted!");
      setReviewDialog({ open: false, jobId: null, targetId: null });
      setRating(0);
      setComment("");
    } catch {
      toast.error("Failed");
    }
  };

  const getFilteredJobs = () => {
    let source =
      user?.role === "tradesperson" && activeTab !== "open" ? myWorks : jobs;
    return source.filter((job) => {
      const matchesSearch = job.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || job.category === categoryFilter;
      let matchesTab = false;
      if (activeTab === "open") matchesTab = job.status === "open";
      else if (activeTab === "active")
        matchesTab = job.status === "assigned" || job.status === "in_progress";
      else if (activeTab === "history")
        matchesTab = job.status === "completed" || job.status === "cancelled";
      return matchesSearch && matchesCategory && matchesTab;
    });
  };

  const getCounts = (tabType) => {
    let source =
      user?.role === "tradesperson" && tabType !== "open" ? myWorks : jobs;
    if (tabType === "open")
      return jobs.filter((j) => j.status === "open").length;
    if (tabType === "active")
      return source.filter((j) =>
        ["assigned", "in_progress"].includes(j.status),
      ).length;
    if (tabType === "history")
      return source.filter((j) => ["completed", "cancelled"].includes(j.status))
        .length;
    return 0;
  };

  const sortedJobs = [...getFilteredJobs()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  if (loading)
    return (
      <div className="w-full px-2 py-12 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-4 w-full md:w-auto">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-14 w-48 rounded-2xl" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-14 flex-1 rounded-2xl" />
          <Skeleton className="h-14 w-full sm:w-[250px] rounded-2xl" />
        </div>
        <Skeleton className="h-16 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card
              key={i}
              className="bg-card border-border rounded-[2.5rem] overflow-hidden shadow-md flex flex-col h-[400px]"
            >
              <div className="p-8 space-y-4">
                <Skeleton className="h-8 w-3/4 rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
              <div className="px-8 flex-1 space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
              <div className="p-6 bg-muted/10 border-t border-border mt-auto space-y-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );

  return (
    <div className="bg-background min-h-full pb-20 animate-in fade-in duration-700">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          className="z-100"
        />
      )}

      <div className="w-full px-2">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-foreground">
              {user?.role === "customer" ? "My Projects" : "Job Market"}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground">
              {activeTab === "open"
                ? "Browse Available Jobs"
                : "Track Ongoing Progress"}
            </p>
          </div>
          {user?.role === "customer" && (
            <MovingBorderButton
              onClick={() => navigate("/dashboard/post-job")}
              borderRadius="1rem"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none"
              containerClassName="h-14 w-48 shadow-xl shadow-blue-600/20"
            >
              <Plus className="mr-2 h-5 w-5" /> New Job
            </MovingBorderButton>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            placeholder="Search title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 rounded-xl px-6 font-bold"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[250px] h-14 rounded-xl font-bold text-xs px-6 shadow-input border-none">
              <SelectValue placeholder="Categories" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl">
              <SelectItem value="All" className="font-bold text-xs">
                All Trades
              </SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem
                  key={cat._id}
                  value={cat.service_name}
                  className="font-bold text-xs"
                >
                  {cat.service_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1.5 rounded-3xl h-16 border border-border">
            <TabsTrigger value="open" className="rounded-xl font-bold text-xs">
              Available{" "}
              <Badge
                variant="secondary"
                className="ml-2 bg-blue-600 text-white border-none"
              >
                {getCounts("open")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="rounded-xl font-bold text-xs"
            >
              Active{" "}
              <Badge variant="secondary" className="ml-2">
                {getCounts("active")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl font-bold text-xs"
            >
              History{" "}
              <Badge variant="secondary" className="ml-2">
                {getCounts("history")}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedJobs.map((job) => (
            <Card
              key={job._id}
              className={`bg-card border-border shadow-md rounded-[2.5rem] overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:border-blue-600/20 ${
                job.status === "completed" ? "opacity-70" : ""
              }`}
            >
              <CardHeader className="p-8 pb-5">
                <div className="flex justify-between items-start gap-4">
                  <h3
                    onClick={() => navigate(`/dashboard/job/${job._id}`)}
                    className="text-2xl font-bold leading-tight cursor-pointer hover:text-blue-600 line-clamp-1 flex-1"
                  >
                    {job.title}
                  </h3>
                  {user?.role === "customer" && job.status === "open" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelDialog({ open: true, jobId: job._id });
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-blue-600 text-white border-none font-bold text-[10px] px-3 py-1">
                    {job.category}
                  </Badge>
                  <Badge
                    className={`text-[10px] font-bold border-none text-white px-3 py-1 ${
                      job.status === "completed"
                        ? "bg-slate-500"
                        : job.status === "cancelled"
                          ? "bg-red-500"
                          : job.status === "assigned"
                            ? "bg-amber-500"
                            : job.status === "in_progress"
                              ? "bg-blue-600 animate-pulse"
                              : "bg-emerald-600"
                    }`}
                  >
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <Separator className="bg-border/40 mx-8" />
              <CardContent className="p-8 flex-1">
                <p className="text-foreground/80 text-sm font-medium leading-relaxed line-clamp-3">
                  {job.description}
                </p>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" /> {job.city}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />{" "}
                      {timeAgo(job.createdAt)}
                    </div>
                  </div>

                  {/* Date / Schedule info — shown for both customer and tradesperson */}
                  {job.status !== "open" &&
                    job.status !== "cancelled" &&
                    (job.appointment || job.scheduledDate) && (
                      <div className="flex flex-col gap-1 mt-4 p-3 bg-muted/30 border border-border rounded-xl">
                        <div className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> Scheduled
                        </div>
                        {job.appointment ? (
                          job.appointment.status === "reschedule_requested" ? (
                            <div className="space-y-1 mt-1">
                              <div className="text-xs font-black line-through opacity-50">
                                {new Date(
                                  job.appointment.date,
                                ).toLocaleString()}
                              </div>
                              <div className="text-xs font-black text-amber-500">
                                Proposed:{" "}
                                {new Date(
                                  job.appointment.proposedDate,
                                ).toLocaleString()}
                              </div>
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                Check chat to accept/decline.
                              </p>
                            </div>
                          ) : (
                            <div className="text-xs font-black">
                              {new Date(job.appointment.date).toLocaleString()}
                              {job.appointment.status === "in_transit" && (
                                <span className="ml-2 text-[10px] text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  On the way
                                </span>
                              )}
                            </div>
                          )
                        ) : job.scheduledDate ? (
                          <div className="text-xs font-black">
                            {new Date(job.scheduledDate).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    )}
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-muted/20 border-t border-border/50">
                <div className="w-full flex flex-col gap-3">
                  <JobActionController
                    job={job}
                    user={user}
                    onContact={() => handleContactCustomer(job)}
                    onViewCode={() =>
                      setCodeDialog({ open: true, code: job.completionCode })
                    }
                    onReschedule={() =>
                      setRescheduleDialog({
                        open: true,
                        jobId: job._id,
                        currentDate: job.appointment?.date || job.scheduledDate,
                      })
                    }
                    onStartJourney={handleStartJourney}
                    onStartJob={handleStartJob}
                    onCancel={() =>
                      setCancelDialog({ open: true, jobId: job._id })
                    }
                    onReview={() => {
                      const targetId =
                        user.role === "customer"
                          ? job.assignedTo?._id || job.assignedTo
                          : job.user?._id || job.user;
                      setReviewDialog({
                        open: true,
                        jobId: job._id,
                        targetId,
                      });
                    }}
                    onFinishJob={(j) =>
                      setVerifyDialog({
                        open: true,
                        jobId: j._id,
                        customerId: j.user?._id || j.user,
                      })
                    }
                    suppressDefaultDetails={true}
                  />
                  <MovingBorderButton
                    borderRadius="1rem"
                    className="bg-card font-bold text-xs text-foreground border-border"
                    containerClassName="w-full h-10"
                    onClick={() => navigate(`/dashboard/job/${job._id}`)}
                  >
                    Details <ArrowRight className="ml-2 h-4 w-4" />
                  </MovingBorderButton>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog
        open={rescheduleDialog.open}
        onOpenChange={(o) =>
          setRescheduleDialog({ ...rescheduleDialog, open: o })
        }
      >
        <DialogContent className="bg-card border-border rounded-[2.5rem] p-10 max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Reschedule
            </DialogTitle>
          </DialogHeader>
          {/* Show pending banner if appointment already has a pending reschedule */}
          {(() => {
            const job = [...jobs, ...myWorks].find(
              (j) => j._id === rescheduleDialog.jobId,
            );
            const appt = job?.appointment;
            if (appt?.status === "reschedule_requested" && appt?.proposedDate) {
              return (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-500 space-y-1">
                  <p className="uppercase tracking-widest">
                    ⏳ Awaiting Approval
                  </p>
                  <p className="font-medium text-foreground/80">
                    You proposed:{" "}
                    <span className="text-amber-500">
                      {new Date(appt.proposedDate).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    The other party must accept in chat. You can propose a
                    different date below to replace it.
                  </p>
                </div>
              );
            }
            return null;
          })()}
          {rescheduleDialog.currentDate && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-1">
                Current Schedule
              </p>
              <p className="text-sm font-bold">
                {new Date(rescheduleDialog.currentDate).toLocaleString()}
              </p>
            </div>
          )}
          <div className="relative mt-6">
            <Input
              type="datetime-local"
              style={{ colorScheme: "dark" }}
              min={new Date(
                new Date().getTime() - new Date().getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16)}
              className="h-16 rounded-xl bg-background px-5 font-bold text-lg [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <Button
            onClick={handleRescheduleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold text-lg mt-6"
          >
            Send Request
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={codeDialog.open}
        onOpenChange={(o) => setCodeDialog({ ...codeDialog, open: o })}
      >
        <DialogContent className="sm:max-w-md bg-card border-border rounded-[2.5rem] p-10 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Completion Code
            </DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 rounded-2xl p-6 my-6 border border-border">
            <p className="text-xs font-bold text-muted-foreground mb-3">
              Your Code
            </p>
            <p className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-600 break-all">
              {codeDialog.code || "N/A"}
            </p>
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(codeDialog.code);
              toast.success("Code copied!");
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold text-lg"
          >
            Copy Code
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={verifyDialog.open}
        onOpenChange={(o) => setVerifyDialog({ ...verifyDialog, open: o })}
      >
        <DialogContent className="sm:max-w-md bg-card border-border rounded-[2.5rem] p-10 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Enter Verify Code
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="000000"
            className="text-center text-3xl tracking-[0.6em] font-mono h-20 rounded-xl my-6"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
          />
          <Button
            onClick={handleVerifySubmit}
            className="w-full bg-blue-600 h-14 rounded-2xl font-bold text-lg"
          >
            Verify & Finish
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reviewDialog.open}
        onOpenChange={(o) => setReviewDialog({ ...reviewDialog, open: o })}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border rounded-[2.5rem] p-10 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Rate Experience
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  onClick={() => setRating(s)}
                  className={`h-12 w-12 cursor-pointer ${
                    s <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
            <Textarea
              placeholder="Share details..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-36 rounded-xl p-4 text-base font-medium"
            />
          </div>
          <Button
            onClick={handleSubmitReview}
            className="bg-blue-600 w-full h-14 rounded-2xl font-bold text-lg"
          >
            Submit Feedback
          </Button>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={cancelDialog.open}
        onOpenChange={(o) => setCancelDialog({ ...cancelDialog, open: o })}
      >
        <AlertDialogContent className="bg-card border-border rounded-[2.5rem] p-10 max-w-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-center">
              {user?.role === "customer"
                ? "Cancel Project?"
                : "Cancel your commitment?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium py-4">
              {user?.role === "customer"
                ? "Are you sure you want to cancel this job? This action cannot be undone."
                : "This will revert the job to open status so another tradesperson can find and apply for it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-4 mt-4">
            <AlertDialogCancel className="h-14 rounded-2xl border-border bg-muted/30 font-bold text-xs flex-1">
              {user?.role === "customer" ? "Keep Project" : "Don't Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelJob}
              className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex-1 border-none"
            >
              {user?.role === "customer" ? "Cancel now" : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobsPage;
