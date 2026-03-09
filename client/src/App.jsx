import { Routes, Route, Navigate } from "react-router-dom";
// Standard Components
import Hero from "./components/Hompage/Hero";
import NavBar from "./components/Hompage/NavBar";
import Footer from "./components/Hompage/Footer";
import PopularJobs from "./components/Hompage/PopularJobs";
import HowItWorks from "./components/Hompage/HowItWorks";
import WhyChooseUs from "./components/Hompage/WhyChooseUs";
import Reviews from "./components/Hompage/Reviews";
import SignUp from "./components/Hompage/SignUp";
import Login from "./components/Hompage/Login";
import CTA from "./components/Hompage/CTA";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";

// Dashboard & Layout
import DashboardLayout from "./components/Hompage/DashboardLayout";

// User & Job Components
import JobPosting from "./components/User/JobPosting";
import JobsPage from "./components/User/JobsPage";
import VerificationRequest from "./components/User/VerificationRequest";
import MapSearch from "./components/User/MapSearch";
import ChatBox from "./components/User/Chatbox";
import Chatroom from "./components/User/Chatroom";
import ViewDetails from "./components/User/ViewDetails";
import UserProfile from "./components/User/UserProfile";
import NotificationsPage from "./components/User/NotificationsPage";
import ReportPage from "./components/User/ReportPage";

// Admin & Payment Components
import AdminDashboard from "./components/Admin/AdminDashboard";
import SystemLogs from "./components/Admin/SystemLogs";
import TransactionHistory from "./components/Payment/TransactionHistory";
import PaymentPage from "./components/Payment/PaymentPage";
import AdminVerification from "./components/Admin/AdminVerification";
import AdminReports from "./components/Admin/AdminReports";
import AdminTransactionHistory from "./components/Admin/AdminTransactionHistory";
import { ThemeProvider } from "./components/Utils/Themeprovider";
import DashboardHome from "./components/Hompage/DashboardHome";

const HomePage = () => (
  <>
    <Hero />
    <PopularJobs />
    <HowItWorks />
    <WhyChooseUs />
    <Reviews />
    <CTA />
  </>
);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <NavBar />
                <HomePage />
                <Footer />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <NavBar />
                <SignUp />
                <Footer />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <NavBar />
                <Login />
                <Footer />
              </>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["customer", "tradesperson", "admin"]}
              >
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />

            {/* Shared */}
            <Route path="jobs" element={<JobsPage />} />
            <Route path="job/:jobId" element={<ViewDetails />} />
            <Route path="chat/:roomId" element={<ChatBox />} />
            <Route path="proposals/:jobId" element={<Chatroom />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="profile/:id" element={<UserProfile />} />
            <Route path="billing" element={<TransactionHistory />} />
            <Route path="report" element={<ReportPage />} />

            {/* Customer Specific */}
            <Route path="post-job" element={<JobPosting />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="my-job-proposals/:jobId" element={<Chatroom />} />

            {/* Tradesperson Specific */}
            <Route
              path="active-works"
              element={<JobsPage initialTab="active" />}
            />
            <Route path="map" element={<MapSearch />} />
            <Route path="get-verified" element={<VerificationRequest />} />

            {/* Admin Specific */}
            <Route path="admin-panel" element={<AdminDashboard />} />
            <Route path="system-logs" element={<SystemLogs />} />
            <Route path="verifications" element={<AdminVerification />} />
            <Route path="reports" element={<AdminReports />} />
            <Route
              path="admin-payments"
              element={<AdminTransactionHistory />}
            />
          </Route>
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute
                allowedRoles={["customer", "tradesperson", "admin"]}
              >
                <ChatBox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job/:jobId"
            element={
              <ProtectedRoute
                allowedRoles={["customer", "tradesperson", "admin"]}
              >
                <ViewDetails />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster richColors closeButton />
      </div>
    </ThemeProvider>
  );
}

export default App;
