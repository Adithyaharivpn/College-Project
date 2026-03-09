import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  ShieldCheck,
  User,
  Zap,
  Wallet,
  Map as MapIcon,
  List,
  CreditCard,
  Users,
  Terminal,
  LogOut,
  ArrowLeft,
  Sun,
  Moon,
  Bell,
  AlertTriangle,
  ChevronsUpDown,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "../../api/useAuth";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "../Utils/Themeprovider";
import { useNotifications } from "../../api/NotificationProvider";
import NotificationBell from "../User/NotificationBell";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import VerifiedBadge from "../Utils/VerifiedBadge";

const Logo = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-foreground dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0 flex items-center justify-center">
        <Zap className="h-3 w-3 text-background dark:text-black" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-foreground whitespace-pre"
      >
        HomeCrew
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-foreground dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0 flex items-center justify-center">
        <Zap className="h-3 w-3 text-background dark:text-black" />
      </div>
    </Link>
  );
};

const DashboardLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  // Define menu items per role
  const roleMenus = {
    admin: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Users",
        href: "/dashboard/admin-panel",
        icon: <Users className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Notifications",
        icon: <Bell className="h-6 w-6 shrink-0 text-foreground" />,
        badge: unreadCount,
      },
      {
        label: "System Logs",
        href: "/dashboard/system-logs",
        icon: <Terminal className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Verify",
        href: "/dashboard/verifications",
        icon: <ShieldCheck className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Reports",
        href: "/dashboard/reports",
        icon: <AlertTriangle className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Payments",
        href: "/dashboard/admin-payments",
        icon: <Wallet className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Market",
        href: "/dashboard/jobs",
        icon: <List className="h-6 w-6 shrink-0 text-foreground" />,
      },
    ],
    tradesperson: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Notifications",
        icon: <Bell className="h-6 w-6 shrink-0 text-foreground" />,
        badge: unreadCount,
      },
      {
        label: "Active Works",
        href: "/dashboard/active-works",
        icon: <Briefcase className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Market",
        href: "/dashboard/jobs",
        icon: <List className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Map",
        href: "/dashboard/map",
        icon: <MapIcon className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Wallet",
        href: "/dashboard/billing",
        icon: <Wallet className="h-6 w-6 shrink-0 text-foreground" />,
      },
      ...(!user?.isVerified
        ? [
            {
              label: "Verify",
              href: "/dashboard/get-verified",
              icon: (
                <ShieldCheck className="h-6 w-6 shrink-0 text-foreground" />
              ),
            },
          ]
        : []),
    ],
    customer: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Notifications",
        icon: <Bell className="h-6 w-6 shrink-0 text-foreground" />,
        badge: unreadCount,
      },
      {
        label: "Market",
        href: "/dashboard/jobs",
        icon: <List className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Post Job",
        href: "/dashboard/post-job",
        icon: <Briefcase className="h-6 w-6 shrink-0 text-foreground" />,
      },
      {
        label: "Payments",
        href: "/dashboard/billing",
        icon: <CreditCard className="h-6 w-6 shrink-0 text-foreground" />,
      },
    ],
  };

  const menuItems = user && roleMenus[user.role] ? roleMenus[user.role] : [];

  // Add Profile and Logout
  const commonLinks = [
    // { label: "Profile", href: "/dashboard/profile", icon: <User className="h-5 w-5 flex-shrink-0 text-foreground" /> },
  ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-background w-full flex-1 mx-auto overflow-hidden h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0 h-full">
            {open ? <Logo /> : <LogoIcon />}

            <div className="mt-8 flex flex-col gap-2 flex-1">
              {menuItems.map((link, idx) => {
                if (link.label === "Notifications") {
                  return (
                    <NotificationBell key={idx}>
                      <SidebarLink link={link} />
                    </NotificationBell>
                  );
                }
                return <SidebarLink key={idx} link={link} />;
              })}
              {commonLinks.map((link, idx) => (
                <SidebarLink key={`common-${idx}`} link={link} />
              ))}

              {/* Theme Toggle Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-start gap-2 group/sidebar py-2 cursor-pointer w-full">
                    <div className="h-6 w-6 shrink-0 relative">
                      <Sun className="h-6 w-6 absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                      <Moon className="h-6 w-6 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
                    </div>
                    <motion.span
                      animate={{
                        display: open ? "inline-block" : "none",
                        opacity: open ? 1 : 0,
                      }}
                      className="text-foreground text-sm font-medium group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block p-0! m-0! flex-1"
                    >
                      Theme
                    </motion.span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="ml-10 bg-card border-border z-200"
                >
                  {" "}
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="cursor-pointer"
                  >
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="cursor-pointer"
                  >
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="cursor-pointer"
                  >
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout Button */}
              <div onClick={logout} className="cursor-pointer">
                <SidebarLink
                  link={{
                    label: "Log Out",
                    href: "#",
                    icon: (
                      <LogOut className="h-7 w-7 shrink-0 text-foreground" />
                    ),
                  }}
                />
              </div>

              {/* BOTTOM SECTION: Fixed User Profile */}
              <div className="mt-auto pt-4 pb-4">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-2 py-2 w-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors group/sidebar"
                >
                  <Avatar className="h-7 w-7 rounded-full shrink-0 overflow-hidden">
                    <AvatarImage
                      src={user?.profilePictureUrl}
                      alt={user?.name}
                      className="object-cover h-full w-full"
                    />
                    <AvatarFallback className="rounded-full bg-muted font-bold text-[10px]">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    animate={{
                      display: open ? "flex" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="flex-col flex-1 text-left text-sm leading-tight ml-2 group-hover/sidebar:translate-x-1 transition duration-150"
                  >
                    <span className="truncate font-semibold text-foreground flex items-center gap-1">
                      {user?.name}
                      <VerifiedBadge isVerified={user?.isVerified} />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden relative bg-background border-l border-neutral-200 dark:border-neutral-700 rounded-tl-2xl">
        {location.pathname.includes("/map") ? (
          <div className="h-full w-full p-0">
            <Outlet />
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="mx-auto h-full w-full p-2 md:p-10 transition-all duration-300">
              <Outlet />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
