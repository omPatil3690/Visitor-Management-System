import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth";
import { Users, UserCheck, AlertCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
// Fix the import path - note the exact filename casing and path
import { VisitDetailsModal } from "./VisitDetailsModal";  // Importing from the same folder

// Define proper types to avoid type errors
type UserRole = "admin" | "guard" | "resident" | "visitor";

type StatItem = {
  name: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  status?: string; // Optional status field
};

// Define visit statuses as constants to avoid typos
const VISIT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

export function VisitStatsDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    // Log user role for debugging
    console.log("Current user role:", user?.role);
    
    if (user?.role) fetchStats(user.role as UserRole);

    // Test basic connection to Supabase
    const testConnection = async () => {
      try {
        console.log("Testing Supabase connection...");
        const { data, error } = await supabase.from("visits").select("id").limit(1);
        
        if (error) {
          console.error("Supabase connection test failed:", error);
          setConnectionError(`Connection error: ${error.message}`);
        } else {
          console.log("Supabase connection successful, sample data:", data);
          setConnectionError(null);
        }
      } catch (err: any) {
        console.error("Supabase connection test exception:", err);
        setConnectionError(`Connection exception: ${err.message}`);
      }
    };
    
    testConnection();

    // Live updates for visit approvals
    const subscription = supabase
      .channel("visits")
      .on("postgres_changes", { event: "*", schema: "public", table: "visits" }, (payload) => {
        console.log("Realtime change detected:", payload);
        if (user?.role) fetchStats(user.role as UserRole);
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(subscription);
    };
  }, [user?.role]);

  const fetchStats = async (role: UserRole) => {
    console.log(`Fetching stats for role: ${role}`);
    try {
      // Get today's date range in UTC, accounting for local timezone (India)
      const localToday = new Date();
      localToday.setHours(0, 0, 0, 0); // Start of today in local time
      
      const utcTodayStart = new Date(localToday.getTime() - (localToday.getTimezoneOffset() * 60000)).toISOString();
      
      const localTomorrow = new Date(localToday);
      localTomorrow.setDate(localToday.getDate() + 1);
      const utcTomorrowStart = new Date(localTomorrow.getTime() - (localTomorrow.getTimezoneOffset() * 60000)).toISOString();
      
      console.log("Local today:", localToday.toISOString());
      console.log("UTC today start for filtering:", utcTodayStart);
      console.log("UTC tomorrow start for filtering:", utcTomorrowStart);

      switch (role) {
        case "admin": {
          console.log("Fetching admin stats...");
          
          // Keep the first card for Total Users
          const { count: totalUsers, error: usersError } = await supabase
            .from("hosts")
            .select("*", { count: "exact", head: true });
          
          // New queries for the updated cards with proper time range
          const [
            { count: approvedToday, error: approvedError },
            { count: newRequestsToday, error: newRequestsError },
            { count: completedToday, error: completedError },
            { count: cancelledToday, error: cancelledError }
          ] = await Promise.all([
            // 1. Approved Visits - approved today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.APPROVED)
              .gte("approved_at", utcTodayStart)
              .lt("approved_at", utcTomorrowStart),
            
            // 2. New Visit Requests - pending created today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.PENDING)
              .gte("created_at", utcTodayStart)
              .lt("created_at", utcTomorrowStart),
            
            // 3. Completed Visits - completed today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.COMPLETED)
              .gte("completed_at", utcTodayStart)
              .lt("completed_at", utcTomorrowStart),
            
            // 4. Cancelled Visits - cancelled today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.CANCELLED)
              .gte("cancelled_at", utcTodayStart)
              .lt("cancelled_at", utcTomorrowStart),
          ]);
          
          // Log all errors for debugging
          console.log({
            usersError,
            approvedError,
            newRequestsError,
            completedError,
            cancelledError
          });

          console.log("Stats counts:", {
            totalUsers,
            approvedToday,
            newRequestsToday,
            completedToday,
            cancelledToday
          });

          setStats([
            { name: "Total Users", value: totalUsers ?? 0, icon: Users, color: "text-blue-500", bgColor: "bg-blue-50" },
            { name: "Approved Visits", value: approvedToday ?? 0, icon: UserCheck, color: "text-green-500", bgColor: "bg-green-50", status: VISIT_STATUS.APPROVED },
            { name: "New Visit Requests", value: newRequestsToday ?? 0, icon: AlertCircle, color: "text-yellow-500", bgColor: "bg-yellow-50", status: VISIT_STATUS.PENDING },
            { name: "Completed Visits", value: completedToday ?? 0, icon: CheckCircle, color: "text-indigo-500", bgColor: "bg-indigo-50", status: VISIT_STATUS.COMPLETED },
            { name: "Cancelled Visits", value: cancelledToday ?? 0, icon: XCircle, color: "text-red-500", bgColor: "bg-red-50", status: VISIT_STATUS.CANCELLED },
          ]);
          break;
        }

        case "guard": {
          console.log("Fetching guard stats...");
          
          const [
            { count: approvedToday },
            { count: newRequestsToday },
            { count: completedToday },
            { count: cancelledToday }
          ] = await Promise.all([
            // 1. Approved Visits - approved today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.APPROVED)
              .gte("approved_at", utcTodayStart)
              .lt("approved_at", utcTomorrowStart),
            
            // 2. New Visit Requests - pending created today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.PENDING)
              .gte("created_at", utcTodayStart)
              .lt("created_at", utcTomorrowStart),
            
            // 3. Completed Visits - completed today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.COMPLETED)
              .gte("completed_at", utcTodayStart)
              .lt("completed_at", utcTomorrowStart),
            
            // 4. Cancelled Visits - cancelled today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("status", VISIT_STATUS.CANCELLED)
              .gte("cancelled_at", utcTodayStart)
              .lt("cancelled_at", utcTomorrowStart),
          ]);

          console.log("Guard stats:", { 
            approvedToday, 
            newRequestsToday, 
            completedToday, 
            cancelledToday 
          });

          setStats([
            { name: "Approved Visits", value: approvedToday ?? 0, icon: UserCheck, color: "text-green-500", bgColor: "bg-green-50", status: VISIT_STATUS.APPROVED },
            { name: "New Visit Requests", value: newRequestsToday ?? 0, icon: AlertCircle, color: "text-yellow-500", bgColor: "bg-yellow-50", status: VISIT_STATUS.PENDING },
            { name: "Completed Visits", value: completedToday ?? 0, icon: CheckCircle, color: "text-indigo-500", bgColor: "bg-indigo-50", status: VISIT_STATUS.COMPLETED },
            { name: "Cancelled Visits", value: cancelledToday ?? 0, icon: XCircle, color: "text-red-500", bgColor: "bg-red-50", status: VISIT_STATUS.CANCELLED },
          ]);
          break;
        }

        case "resident": {
          const userId = user?.id;
          console.log("Fetching resident stats for user ID:", userId);
          
          if (!userId) {
            console.error("No user ID available for resident");
            return;
          }

          const [
            { count: approvedToday },
            { count: newRequestsToday },
            { count: completedToday },
            { count: cancelledToday }
          ] = await Promise.all([
            // 1. Approved Visits - approved today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("host_id", userId)
              .eq("status", VISIT_STATUS.APPROVED)
              .gte("approved_at", utcTodayStart)
              .lt("approved_at", utcTomorrowStart),
            
            // 2. New Visit Requests - pending created today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("host_id", userId)
              .eq("status", VISIT_STATUS.PENDING)
              .gte("created_at", utcTodayStart)
              .lt("created_at", utcTomorrowStart),
            
            // 3. Completed Visits - completed today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("host_id", userId)
              .eq("status", VISIT_STATUS.COMPLETED)
              .gte("completed_at", utcTodayStart)
              .lt("completed_at", utcTomorrowStart),
            
            // 4. Cancelled Visits - cancelled today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("host_id", userId)
              .eq("status", VISIT_STATUS.CANCELLED)
              .gte("cancelled_at", utcTodayStart)
              .lt("cancelled_at", utcTomorrowStart),
          ]);

          console.log("Resident stats:", { 
            approvedToday, 
            newRequestsToday, 
            completedToday, 
            cancelledToday 
          });

          setStats([
            { name: "Approved Visits", value: approvedToday ?? 0, icon: UserCheck, color: "text-green-500", bgColor: "bg-green-50", status: VISIT_STATUS.APPROVED },
            { name: "New Visit Requests", value: newRequestsToday ?? 0, icon: AlertCircle, color: "text-yellow-500", bgColor: "bg-yellow-50", status: VISIT_STATUS.PENDING },
            { name: "Completed Visits", value: completedToday ?? 0, icon: CheckCircle, color: "text-indigo-500", bgColor: "bg-indigo-50", status: VISIT_STATUS.COMPLETED },
            { name: "Cancelled Visits", value: cancelledToday ?? 0, icon: XCircle, color: "text-red-500", bgColor: "bg-red-50", status: VISIT_STATUS.CANCELLED },
          ]);
          break;
        }

        case "visitor": {
          const visitorId = user?.id;
          console.log("Fetching visitor stats for visitor ID:", visitorId);
          
          if (!visitorId) {
            console.error("No user ID available for visitor");
            return;
          }

          const [
            { count: approvedToday },
            { count: newRequestsToday },
            { count: completedToday },
            { count: cancelledToday }
          ] = await Promise.all([
            // 1. Approved Visits - approved today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("visitor_id", visitorId)
              .eq("status", VISIT_STATUS.APPROVED)
              .gte("approved_at", utcTodayStart)
              .lt("approved_at", utcTomorrowStart),
            
            // 2. New Visit Requests - pending created today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("visitor_id", visitorId)
              .eq("status", VISIT_STATUS.PENDING)
              .gte("created_at", utcTodayStart)
              .lt("created_at", utcTomorrowStart),
            
            // 3. Completed Visits - completed today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("visitor_id", visitorId)
              .eq("status", VISIT_STATUS.COMPLETED)
              .gte("completed_at", utcTodayStart)
              .lt("completed_at", utcTomorrowStart),
            
            // 4. Cancelled Visits - cancelled today
            supabase
              .from("visits")
              .select("*", { count: "exact", head: true })
              .eq("visitor_id", visitorId)
              .eq("status", VISIT_STATUS.CANCELLED)
              .gte("cancelled_at", utcTodayStart)
              .lt("cancelled_at", utcTomorrowStart),
          ]);

          console.log("Visitor stats:", { 
            approvedToday, 
            newRequestsToday, 
            completedToday, 
            cancelledToday 
          });

          setStats([
            { name: "Approved Visits", value: approvedToday ?? 0, icon: UserCheck, color: "text-green-500", bgColor: "bg-green-50", status: VISIT_STATUS.APPROVED },
            { name: "New Visit Requests", value: newRequestsToday ?? 0, icon: AlertCircle, color: "text-yellow-500", bgColor: "bg-yellow-50", status: VISIT_STATUS.PENDING },
            { name: "Completed Visits", value: completedToday ?? 0, icon: CheckCircle, color: "text-indigo-500", bgColor: "bg-indigo-50", status: VISIT_STATUS.COMPLETED },
            { name: "Cancelled Visits", value: cancelledToday ?? 0, icon: XCircle, color: "text-red-500", bgColor: "bg-red-50", status: VISIT_STATUS.CANCELLED },
          ]);
          break;
        }

        default:
          console.warn("Unknown role:", role);
          setStats([]);
      }
    } catch (err: any) {
      console.error("⚠️ Error fetching stats:", err.message);
      // Log more detailed error information
      console.error("Error details:", err);
      
      // Try a simpler query to see if basic queries work
      try {
        console.log("Attempting fallback simple query...");
        const { data, error } = await supabase
          .from("visits")
          .select("id, status")
          .limit(5);
          
        console.log("Fallback query result:", data);
        console.log("Fallback query error:", error);
      } catch (fallbackErr) {
        console.error("Even fallback query failed:", fallbackErr);
      }
    }
  };

  const handleStatCardClick = (status: string) => {
    if (status) {
      setSelectedStatus(status);
      setIsModalOpen(true);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || "Guest"}
        </h1>
        <p className="mt-2 text-md text-gray-600">
          Here's what's happening in your campus today
        </p>
        {connectionError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Connection issue detected: {connectionError}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 ${stat.status ? 'cursor-pointer' : ''}`}
            onClick={() => stat.status ? handleStatCardClick(stat.status) : null}
            aria-label={stat.status ? `View ${stat.name.toLowerCase()}` : undefined}
            tabIndex={stat.status ? 0 : undefined}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">{stat.name}</h3>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
            <div className={`px-6 py-2 bg-gray-50 rounded-b-xl border-t border-gray-100`}>
              <div className="flex items-center text-xs text-gray-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Today</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedStatus && (
        <VisitDetailsModal 
          status={selectedStatus}
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}