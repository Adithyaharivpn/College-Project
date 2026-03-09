import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import api from "../../api/axiosConfig";
import { useAuth } from "../../api/useAuth";

// Icons
import {
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Loader2,
  DollarSign,
  ArrowLeft,
  Star,
  Flag,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ChatBox = () => {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const dateInputRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isArchived, setIsArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState(null);
  const [roomData, setRoomData] = useState(null); // Added
  const [completionCodeInput, setCompletionCodeInput] = useState("");

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [quotePrice, setQuotePrice] = useState("");

  // Review State
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    jobId: null,
    targetId: null,
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const initData = async () => {
      try {
        const msgRes = await api.get(`/api/chat/messages/${roomId}`);
        setMessages(msgRes.data);
        const roomRes = await api.get(`/api/chat/${roomId}`);
        setRoomData(roomRes.data);
        const realJobId = roomRes.data.jobId;

        if (realJobId) {
          const jobRes = await api.get(`/api/jobs/${realJobId}`);
          setJobDetails(jobRes.data);
          if (jobRes.data.isPaid && jobRes.data.isCompleted) {
            setIsArchived(true);
          } else if (roomRes.data.isArchived) {
            setIsArchived(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) initData();
  }, [roomId]);

  const jobDetailsRef = useRef(null);

  useEffect(() => {
    jobDetailsRef.current = jobDetails;
  }, [jobDetails]);

  useEffect(() => {
    if (!roomId) return;
    const userId = user?._id || user?.id;
    if (!userId) return;

    const newSocket = io(import.meta.env.VITE_API_BASE_URL);
    setSocket(newSocket);
    newSocket.emit("joinRoom", roomId);
    newSocket.emit("addUser", userId);

    newSocket.on("job_review_prompt", (data) => {
      setReviewDialog({
        open: true,
        jobId: data.jobId,
        targetId: data.targetId,
      });
      setJobDetails((prev) => ({ ...prev, isCompleted: true }));
    });

    newSocket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
      if (message.type === "job_completed") {
        const currentJob = jobDetailsRef.current;
        if (currentJob) {
          const targetUserId =
            user.role === "customer"
              ? currentJob.assignedTo?._id || currentJob.assignedTo
              : currentJob.user?._id || currentJob.user;

          setReviewDialog({
            open: true,
            jobId: currentJob._id,
            targetId: targetUserId,
          });
          setJobDetails((prev) => ({ ...prev, isCompleted: true }));
          setIsArchived(true); 
        }
      }
    });

    return () => newSocket.disconnect();
  }, [roomId, user?._id || user?.id]);

  const handleSendMessage = () => {
    if (currentMessage.trim() && socket) {
      const payload = {
        roomId,
        senderId: user._id || user.id,
        text: currentMessage,
        type: "text",
      };
      socket.emit("sendMessage", payload);
      setCurrentMessage("");
    }
  };

  const handleScheduleSubmit = async () => {
    if (!appointmentDate || !quotePrice) return;
    try {
      const dateObj = new Date(appointmentDate);
      const res = await api.post("/api/appointments", {
        roomId,
        providerId: user._id || user.id,
        date: dateObj.toISOString(),
        status: "pending",
        price: Number(quotePrice),
      });
      const payload = {
        roomId,
        senderId: user._id || user.id,
        text: `Quote Proposed: ₹${quotePrice}`,
        type: "appointment",
        price: Number(quotePrice),
        appointmentId: res.data._id,
        appointmentDate: dateObj.toISOString(),
      };
      if (socket) socket.emit("sendMessage", payload);
      setIsScheduleOpen(false);
    } catch (error) {
      toast.error("Failed to propose quote");
    }
  };

  const handleAcceptBooking = async (msg) => {
    try {
      await api.post(`/api/chat/confirm-appointment`, {
        appointmentId: msg.appointmentId,
        tradespersonId: msg.sender._id,
      });
      toast.success("Job Confirmed!");
      setJobDetails((prev) => ({
        ...prev,
        status: "assigned",
        price: msg.price, 
        isPaid: false,
      }));
      setIsArchived(false); 
    } catch (err) {
      toast.error("Failed to confirm booking.");
    }
  };

  const handleVerifyCode = async () => {
    try {
      await api.post(`/api/jobs/complete`, {
        jobId: jobDetails._id,
        code: completionCodeInput,
      });
      toast.success("Job marked as completed!");

      setReviewDialog({
        open: true,
        jobId: jobDetails._id,
        targetId: jobDetails.user?._id || jobDetails.user, 
      });

      setJobDetails((prev) => ({ ...prev, isCompleted: true }));

      if (socket) {
        socket.emit("sendMessage", {
          roomId,
          senderId: user._id || user.id,
          text: "Job Completed! Please leave a review.",
          type: "job_completed",
        });
      }
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
      window.location.reload(); 
    } catch {
      toast.error("Failed to submit review");
    }
  };

  const handleQuoteAction = async (msg, status) => {
    try {
      const apptId = msg.appointmentId?._id || msg.appointmentId;

      await api.put(`/api/appointments/${apptId}`, { status });
      const actionText =
        status === "cancelled" ? "Quote Withdrawn" : "Quote Declined";

      const payload = {
        roomId,
        senderId: user._id || user.id,
        text: `[INFO]: ${actionText} by ${user.name}`,
        type: "text",
      };
      if (socket) socket.emit("sendMessage", payload);

      toast.success(actionText);

      setMessages((prev) =>
        prev.map((m) => {
          const mApptId = m.appointmentId?._id || m.appointmentId;
          if (mApptId === apptId) {
            if (typeof m.appointmentId === "object") {
              return {
                ...m,
                appointmentId: { ...m.appointmentId, status: status },
              };
            } else {
              return {
                ...m,
                appointmentId: { _id: m.appointmentId, status: status },
              };
            }
          }
          return m;
        }),
      );
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleRescheduleAccept = async (msg) => {
    try {
      const apptId = msg.appointmentId?._id || msg.appointmentId;
      await api.patch(`/api/appointments/${apptId}/reschedule-accept`);
      toast.success("Reschedule Request Accepted!");

      const payload = {
        roomId,
        senderId: user._id || user.id,
        text: `[INFO]: Reschedule Accepted by ${user.name}`,
        type: "text",
      };
      if (socket) socket.emit("sendMessage", payload);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to accept reschedule");
    }
  };

  const handleRescheduleDecline = async (msg) => {
    try {
      const apptId = msg.appointmentId?._id || msg.appointmentId;
      await api.patch(`/api/appointments/${apptId}/reschedule-decline`);
      toast.success("Reschedule Request Declined!");

      const payload = {
        roomId,
        senderId: user._id || user.id,
        text: `[INFO]: Reschedule Declined by ${user.name}`,
        type: "text",
      };
      if (socket) socket.emit("sendMessage", payload);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to decline reschedule");
    }
  };

  const renderMessage = (msg) => {
    if (msg.type === "appointment") {
      const isMe =
        msg.sender?._id === (user._id || user.id) ||
        msg.sender === (user._id || user.id);

      const appointmentObj = msg.appointmentId || {};
      const apptStatus = appointmentObj.status || "pending";
      const isRescheduleRequested = apptStatus === "reschedule_requested";
      const proposedDate = appointmentObj.proposedDate;
      const proposedBy = appointmentObj.proposedBy;
      const isMyProposal = proposedBy === (user._id || user.id);

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest">
            <Calendar className="h-3 w-3" />{" "}
            {isRescheduleRequested ? "Reschedule Proposed" : "Proposed Quote"}
          </div>
          <div className="text-xl font-black italic">₹{msg.price}</div>

          <div
            className={`text-[10px] font-bold ${isRescheduleRequested ? "line-through opacity-50" : "opacity-70"}`}
          >
            {new Date(msg.appointmentDate).toLocaleString()}
          </div>

          {isRescheduleRequested && proposedDate && (
            <div className="text-[10px] font-bold text-amber-400 mt-1 flex items-center gap-1 bg-amber-400/10 p-2 rounded-lg">
              <Calendar className="h-3 w-3" /> New:{" "}
              {new Date(proposedDate).toLocaleString()}
            </div>
          )}

          {apptStatus === "pending" && (
            <div className="flex gap-2 pt-2">
              {!isMe && user.role === "customer" && !isArchived && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] h-8 px-4 rounded-lg"
                    onClick={() => handleAcceptBooking(msg)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="font-black text-[10px] h-8 px-4 rounded-lg"
                    onClick={() => handleQuoteAction(msg, "cancelled")}
                  >
                    Decline
                  </Button>
                </>
              )}

              {isMe && !isArchived && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="font-black text-[10px] h-8 px-4 rounded-lg opacity-80 hover:opacity-100"
                  onClick={() => handleQuoteAction(msg, "cancelled")}
                >
                  Withdraw
                </Button>
              )}
            </div>
          )}

          {isRescheduleRequested && !isArchived && (
            <div className="flex gap-2 pt-2">
              {!isMyProposal ? (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] h-8 px-4 rounded-lg"
                    onClick={() => handleRescheduleAccept(msg)}
                  >
                    Accept New Date
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="font-black text-[10px] h-8 px-4 rounded-lg"
                    onClick={() => handleRescheduleDecline(msg)}
                  >
                    Decline
                  </Button>
                </>
              ) : (
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20 p-2 rounded-lg text-center w-full">
                  Waiting for partner to accept
                </div>
              )}
            </div>
          )}

          {apptStatus !== "pending" &&
            apptStatus !== "reschedule_requested" && (
              <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border p-2 rounded-lg text-center">
                {apptStatus === "cancelled"
                  ? "Quote Cancelled"
                  : apptStatus === "confirmed" || apptStatus === "in_transit"
                    ? "Quote Confirmed"
                    : "Quote Processed"}
              </div>
            )}
        </div>
      );
    }
    return <p className="text-sm font-medium leading-relaxed">{msg.text}</p>;
  };

  const shouldShowPayButton =
    user.role === "customer" &&
    (isArchived || jobDetails?.status === "assigned") &&
    !jobDetails?.isPaid;

  if (loading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  // Verification Lock
  if (user.role === "tradesperson" && !user.isVerified) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center space-y-4 animate-in fade-in">
        <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center border-2 border-border mb-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-center">
          Access Restricted
        </h2>
        <p className="text-muted-foreground text-center text-sm max-w-xs font-medium">
          Identity verification is required to participate in chats and job
          negotiations.
        </p>
        <Button
          onClick={() => navigate("/dashboard/get-verified")}
          className="mt-4 bg-blue-600 font-bold uppercase text-xs h-12 rounded-xl px-8"
        >
          Complete Verification
        </Button>
        <Button
          variant="ghost"
          className="font-bold text-xs"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* Header / Back Button */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[9px] tracking-[0.2em] uppercase">
          {jobDetails?.status}
        </Badge>
      </div>

      <Card className="flex-1 flex flex-col bg-card border-border rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        {/* Chat Header */}
        <div className="p-6 border-b border-border bg-muted/20 backdrop-blur-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter leading-none">
                {jobDetails?.title}
              </h2>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Active Conversation
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user.role === "tradesperson" && !isArchived && (
                <Button
                  onClick={() => {
                    setIsScheduleOpen(true);
                    setQuotePrice("");
                    setAppointmentDate("");
                  }}
                  className="bg-blue-600 font-black text-[10px] uppercase rounded-xl h-10 px-6 border-none shadow-lg shadow-blue-500/20"
                >
                  <DollarSign className="mr-2 h-3 w-3" /> Propose Quote
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                onClick={() => {
                  let otherUserId;
                  if (roomData) {
                    const target =
                      user.role === "customer"
                        ? roomData.tradespersonId
                        : roomData.customerId;
                    otherUserId = target?._id || target;
                  } else {
                    otherUserId =
                      user.role === "customer"
                        ? jobDetails?.assignedTo?._id || jobDetails?.assignedTo
                        : jobDetails?.user?._id || jobDetails?.user;
                  }
                  if (!otherUserId) {
                    const otherMsg = messages.find((m) => {
                      const senderId = m.sender?._id || m.sender;
                      const myId = user._id || user.id;
                      return senderId && senderId !== myId;
                    });
                    if (otherMsg) {
                      otherUserId = otherMsg.sender?._id || otherMsg.sender;
                    }
                  }

                  if (!otherUserId) {
                    console.error(
                      "Debug: Could not find user. Room:",
                      roomData,
                      "Job:",
                      jobDetails,
                      "User:",
                      user,
                    );
                    return toast.error(
                      "Could not identify user to report. Please wait or try again.",
                    );
                  }

                  navigate("/dashboard/report", {
                    state: {
                      reportedUserId: otherUserId,
                      jobId: jobDetails?._id,
                      roomId: roomId,
                    },
                  });
                }}
              >
                <Flag className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Action Alerts */}
          <div className="mt-4 space-y-2">
            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-600 rounded-xl">
              <AlertDescription className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-wide">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Safety Warning: Keep all payments and deals inside HomeCrew.
                  We remain responsible only for on-platform transactions.
                </span>
              </AlertDescription>
            </Alert>
            {shouldShowPayButton && (
              <Alert className="bg-blue-600 border-none text-white rounded-2xl animate-pulse">
                <AlertDescription className="flex justify-between items-center font-black text-[11px] uppercase tracking-wide">
                  <span>Job Assigned. Secure the booking.</span>
                  <Button
                    variant="secondary"
                    className="h-8 font-black text-[10px]"
                    onClick={() =>
                      navigate("/dashboard/payment", {
                        state: {
                          amount: jobDetails?.price,
                          jobId: jobDetails?._id,
                          type: "escrow",
                        },
                      })
                    }
                  >
                    PAY ₹{jobDetails.price}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {user.role === "tradesperson" &&
              jobDetails?.isPaid &&
              !jobDetails?.isCompleted && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                    Enter Customer Code:
                  </span>
                  <div className="flex gap-2">
                    <Input
                      className="h-8 w-24 bg-background font-black text-center text-xs"
                      value={completionCodeInput}
                      onChange={(e) => setCompletionCodeInput(e.target.value)}
                    />
                    <Button
                      onClick={handleVerifyCode}
                      className="h-8 bg-emerald-600 text-white text-[10px] font-black uppercase"
                    >
                      Finish
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((msg, i) => {
              const isMe = msg.sender?._id === user.id;
              return (
                <div
                  key={i}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-10 w-10 border-2 border-border shadow-md">
                      <AvatarImage src={msg.sender?.profilePictureUrl} />
                      <AvatarFallback className="font-black bg-blue-600 text-white">
                        {msg.sender?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-4 rounded-3xl shadow-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-muted text-foreground rounded-tl-none border border-border"}`}
                      >
                        {renderMessage(msg)}
                      </div>
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-2 px-1">
                        {msg.sender?.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 bg-card border-t border-border flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Type your message..."
              className="h-14 rounded-xl px-4 font-bold focus-visible:ring-blue-600/20 w-full"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-600/20"
          >
            <Send className="h-6 w-6" />
          </Button>
        </div>
      </Card>

      {/* Quote Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="bg-card border-border rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight">
              Propose Job Quote
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                Appointment Date
              </label>
              <Input
                type="datetime-local"
                min={new Date(
                  new Date().getTime() - new Date().getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
                className="h-14 rounded-xl dark:text-white relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                style={{ colorScheme: "dark" }}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
              <div className="absolute right-3 top-[38px] pointer-events-none">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                Proposed Price (₹)
              </label>
              <Input
                type="number"
                placeholder="1500"
                className="h-14 rounded-xl font-bold"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="font-bold uppercase text-[10px]"
              onClick={() => setIsScheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 text-white font-black uppercase text-[10px] px-8 rounded-xl"
              onClick={handleScheduleSubmit}
            >
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={(o) => setReviewDialog({ ...reviewDialog, open: o })}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border rounded-[2.5rem] p-10 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold uppercase">
              Rate Experience
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  onClick={() => setRating(s)}
                  className={`h-12 w-12 cursor-pointer ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
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
            className="bg-blue-600 w-full h-14 rounded-2xl font-bold text-lg uppercase"
          >
            Submit Feedback
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatBox;
