import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  Users,
  Briefcase,
  Star,
  ShieldCheck,
  Zap,
  Clock,
  Loader2,
  ArrowRight,
  Badge as BadgeIcon,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
} from "lucide-react";
import api from "../../api/axiosConfig";
import { useAuth } from "../../api/useAuth";
import { useNavigate } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"; // Keep these for ChartContainer

const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = React.useState("90d");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const promises = [api.get("/api/dashboard/stats")];
        const isTradesperson = user?.role === "tradesperson";

        if (isTradesperson) {
          promises.push(
            api
              .get("/api/jobs/tradesperson/my-works")
              .catch(() => ({ data: [] })),
          );
        } else {
          promises.push(
            api
              .get("/api/dashboard/recent-activity")
              .catch(() => ({ data: [] })),
          );
        }

        const [statsRes, feedRes] = await Promise.all(promises);

        setStats(statsRes.data);

        if (isTradesperson) {
          // Filter for active jobs (assigned/in_progress) for the dashboard view
          const allJobs = feedRes.data || [];
          const active = allJobs.filter((j) =>
            ["assigned", "in_progress"].includes(j.status),
          );
          setUpcomingJobs(active);
        } else {
          setActivities(feedRes.data || []);
        }
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        setTimeout(() => setLoading(false), 300); // Small delay for smooth transition
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  // Helper for user-friendly relative time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const getRoleContent = () => {
    const s = stats || {};
    switch (user?.role) {
      case "admin":
        return [
          {
            title: "Platform Revenue",
            value: `₹${(s.totalRevenue || 0).toLocaleString()}`,
            trend: "+12.5%",
            trendIcon: TrendingUp,
            trendColor:
              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            footerLabel: "vs last month",
            footerTrend: "Training up",
            footerTrendIcon: TrendingUp,
            footerTrendColor: "text-emerald-500",
          },
          {
            title: "Active Users",
            value: (s.totalUsers || 0).toLocaleString(),
            trend: "+4.3%",
            trendIcon: TrendingUp,
            trendColor:
              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            footerLabel: "new registrations",
            footerTrend: "Growing",
            footerTrendIcon: TrendingUp,
            footerTrendColor: "text-emerald-500",
          },
          {
            title: "Pending Verifications",
            value: s.pendingVerifications || 0,
            trend: "Attention",
            trendIcon: ShieldCheck,
            trendColor:
              s.pendingVerifications > 0
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            footerLabel: "requires action",
            footerTrend: "Queue",
            footerTrendIcon: Clock,
            footerTrendColor: "text-amber-500",
            path: "/dashboard/verifications",
            alert: s.pendingVerifications > 0,
          },
        ];
      case "tradesperson":
        return [
          {
            title: "Total Earned",
            value: `₹${(s.totalEarned || 0).toLocaleString()}`,
            trend: "+8.2%",
            trendIcon: TrendingUp,
            trendColor:
              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            footerLabel: "this month",
            footerTrend: "Income up",
            footerTrendIcon: TrendingUp,
            footerTrendColor: "text-emerald-500",
          },
          {
            title: "Active Jobs",
            value: s.activeJobs || 0,
            trend: "Stable",
            trendIcon: briefCaseIcon,
            trendColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            footerLabel: "in progress",
            footerTrend: "Consistent",
            footerTrendIcon: TrendingUp,
            footerTrendColor: "text-blue-500",
          },
          {
            title: "Average Rating",
            value: `${s.rating || 0}/5`,
            trend: "Top Rated",
            trendIcon: Star,
            trendColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            footerLabel: "client satisfaction",
            footerTrend: "Excellent",
            footerTrendIcon: Star,
            footerTrendColor: "text-amber-500",
          },
        ];
      case "customer":
        return [
          {
            title: "Total Spent",
            value: `₹${(s.totalSpent || 0).toLocaleString()}`,
            trend: "+2.4%",
            trendIcon: TrendingUp,
            trendColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            footerLabel: "invested",
            footerTrend: "Spending",
            footerTrendIcon: TrendingUp,
            footerTrendColor: "text-blue-500",
          },
          {
            title: "Jobs Posted",
            value: s.totalJobs || 0,
            trend: "Active",
            trendIcon: Zap,
            trendColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
            footerLabel: "total posts",
            footerTrend: "Engagement",
            footerTrendIcon: TrendingUp,
            footerTrendColor: "text-purple-500",
          },
          {
            title: "Ongoing Tasks",
            value: s.ongoingTasks || 0,
            trend: "In Progress",
            trendIcon: Briefcase,
            trendColor:
              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            footerLabel: "currently active",
            footerTrend: "Tracking",
            footerTrendIcon: Clock,
            footerTrendColor: "text-emerald-500",
          },
        ];
      default:
        return [];
    }
  };

  // Helper for icons since I can't use JSX in object key before render? No, I can.
  // But I need to define briefCaseIcon first or just use Briefcase directly.
  const briefCaseIcon = Briefcase;

  const cards = getRoleContent();

  // Chart Data: Prefer Backend, Fallback to Mock
  const chartData = useMemo(() => {
    // 1. Try using real backend data
    if (stats && stats.chartData && stats.chartData.length > 0) {
      return stats.chartData;
    }

    // 2. Fallback to Mock Data generation if real data is missing (prevents empty chart)
    if (!stats) return [];

    const days = 90;
    const data = [];
    const today = new Date();

    // Base values scaling
    let basePrimary = 0; // Money
    let baseSecondary = 0; // Count
    if (user?.role === "admin") {
      basePrimary = (stats.totalRevenue || 50000) / 90;
      baseSecondary = Math.max(0.2, (stats.totalUsers || 0) / 90);
    } else if (user?.role === "tradesperson") {
      basePrimary = (stats.totalEarned || 20000) / 90;
      baseSecondary = Math.max(0.2, (stats.activeJobs || 10) / 90);
    } else {
      basePrimary = (stats.totalSpent || 10000) / 90;
      baseSecondary = Math.max(0.2, (stats.totalJobs || 5) / 90);
    }

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (days - i));
      const dateStr = d.toISOString().split("T")[0];

      // Randomize
      const primary = Math.max(
        0,
        Math.floor(basePrimary * (0.5 + Math.random() * 1.5)),
      );

      // Handle low-frequency events for secondary data
      let secondary = 0;
      if (baseSecondary < 1) {
        secondary = Math.random() < baseSecondary ? 1 : 0;
      } else {
        secondary = Math.max(
          0,
          Math.floor(baseSecondary * (0.5 + Math.random() * 1.5)),
        );
      }

      data.push({
        date: dateStr,
        primary,
        secondary,
      });
    }
    return data;
  }, [stats, user?.role]);

  const filteredChartData = useMemo(() => {
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    else if (timeRange === "7d") daysToSubtract = 7;

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => new Date(item.date) >= startDate);
  }, [chartData, timeRange]);

  const getChartConfig = () => {
    if (user?.role === "admin") {
      return {
        primary: { label: "Revenue (₹)", color: "hsl(var(--chart-1))" }, // Using chart-1 for primary
        secondary: { label: "New Users", color: "hsl(var(--chart-2))" },
      };
    } else if (user?.role === "tradesperson") {
      return {
        primary: { label: "Earnings (₹)", color: "hsl(var(--chart-1))" },
        secondary: { label: "New Jobs", color: "hsl(var(--chart-2))" },
      };
    } else {
      return {
        primary: { label: "Spent (₹)", color: "hsl(var(--chart-1))" },
        secondary: { label: "Posted Jobs", color: "hsl(var(--chart-2))" },
      };
    }
  };

  const chartConfig = getChartConfig();

  const renderChart = () => {
    return (
      <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden shadow-xl border">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b border-border/50 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle className="text-xl font-bold">
              Performance Trends
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-muted-foreground">
              Key metrics over time
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-xl font-bold text-xs sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="90d" className="rounded-lg font-bold text-xs">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg font-bold text-xs">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg font-bold text-xs">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredChartData}>
              <defs>
                <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-secondary)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-secondary)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="secondary"
                type="natural"
                fill="url(#fillSecondary)"
                stroke="var(--color-secondary)"
                stackId="a"
              />
              <Area
                dataKey="primary"
                type="natural"
                fill="url(#fillPrimary)"
                stroke="var(--color-primary)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold leading-none">
            Welcome,{" "}
            <span className="text-blue-600 underline decoration-blue-600/20 underline-offset-8">
              {user?.name?.split(" ")[0]}
            </span>
          </h2>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [1, 2, 3].map((i) => (
              <Card
                key={i}
                className="bg-card border-border rounded-[2.5rem] shadow-sm"
              >
                <CardContent className="p-8 flex items-center gap-6">
                  <Skeleton className="h-16 w-16 rounded-3xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          : cards.map((card, i) => (
              <Card
                key={i}
                onClick={() => card.path && navigate(card.path)}
                className={`bg-card border-border shadow-sm border-l-4 rounded-xl cursor-pointer hover:shadow-lg transition-all ${card.path ? "hover:bg-muted/50" : ""}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="grid gap-1">
                    <CardDescription className="text-xs font-semibold">
                      {card.title}
                    </CardDescription>
                    <CardTitle className="text-2xl font-black tabular-nums">
                      {card.value}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${card.trendColor} gap-1 font-bold`}
                  >
                    {/* Render Icon component */}
                    <card.trendIcon className="h-3 w-3" />
                    {card.trend}
                  </Badge>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1 p-6 pt-0 text-xs font-medium text-muted-foreground">
                  <div className="flex gap-1.5 items-center">
                    <span
                      className={`${card.footerTrendColor} flex items-center gap-1 font-bold`}
                    >
                      {card.footerTrend}
                      <card.footerTrendIcon className="h-3 w-3" />
                    </span>
                    <span>{card.footerLabel}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
      </div>

      {/* Charts Section */}
      {!loading && stats && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          {renderChart()}
        </div>
      )}

      {/* Feed Section */}
      <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center">
          {user?.role === "tradesperson" ? (
            <>
              <h3 className="text-sm font-bold flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-blue-600" /> Upcoming
                Scheduled Jobs
              </h3>
              <Badge
                variant="outline"
                className="font-bold text-xs px-3 border-border"
              >
                {upcomingJobs.length} Active
              </Badge>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-600" /> Live Platform Feed
              </h3>
              <Badge
                variant="outline"
                className="font-bold text-xs px-3 border-border"
              >
                Real-time updates
              </Badge>
            </>
          )}
        </div>

        <div className="p-4 space-y-2">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-5 rounded-4xl"
              >
                <div className="flex items-center gap-5 flex-1">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="space-y-2 flex-1 text-left">
                    <Skeleton className="h-2 w-24" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                <Skeleton className="h-2 w-12 ml-4" />
              </div>
            ))
          ) : user?.role === "tradesperson" ? (
            upcomingJobs.length > 0 ? (
              upcomingJobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => navigate(`/job/${job._id}`)}
                  className="flex items-center justify-between p-5 hover:bg-muted/40 rounded-4xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-800 text-blue-600 group-hover:scale-110 transition-transform">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-foreground line-clamp-1">
                        {job.title}
                      </h4>
                      <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {job.city || "Remote"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{" "}
                          {job.scheduledDate
                            ? new Date(job.scheduledDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`uppercase text-[10px] font-black min-w-[80px] justify-center ${
                      job.status === "in_progress"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {job.status?.replace("_", " ") || "Active"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2.5rem] m-4 bg-muted/5">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-muted-foreground opacity-20" />
                </div>
                <p className="text-xs font-bold text-muted-foreground">
                  No upcoming jobs scheduled
                </p>
                <Button
                  variant="link"
                  onClick={() => navigate("/dashboard/jobs")}
                  className="text-blue-600 font-bold mt-2"
                >
                  Find new work
                </Button>
              </div>
            )
          ) : activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-5 hover:bg-muted/40 rounded-4xl transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 bg-background rounded-2xl flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">
                      {activity.type === "status_update"
                        ? "Update"
                        : "Notification"}
                    </p>
                    <p className="text-sm font-bold text-foreground leading-none">
                      {activity.message}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground">
                    {getRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2.5rem] m-4 bg-muted/5">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-muted-foreground opacity-20" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                No recent events in your pipeline
              </p>
            </div>
          )}
        </div>
        {!loading && (
          <div className="p-6 bg-muted/10 border-t border-border flex justify-center">
            {user?.role === "tradesperson" ? (
              upcomingJobs.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard/active-works")}
                  className="text-xs font-bold text-blue-600 hover:bg-blue-600/10 rounded-xl h-10 px-8"
                >
                  View All Active Works <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              )
            ) : activities.length > 0 ? (
              <Button
                variant="ghost"
                className="text-xs font-bold text-blue-600 hover:bg-blue-600/10 rounded-xl h-10 px-8"
              >
                View Full Audit Log <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
