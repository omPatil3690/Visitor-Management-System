import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import {
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
// Fix the import path - note the exact filename casing and path
import { VisitDetailsModal } from "./VisitDetailsModal"; // Importing from the same folder

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
  CANCELLED: "cancelled",
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

    // Poll for updates every 10 seconds
    const pollInterval = setInterval(() => {
      if (user?.role) fetchStats(user.role as UserRole);
    }, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user?.role]);

  const fetchStats = async (role: UserRole) => {
    console.log(`Fetching stats for role: ${role}`);
    try {
      const localToday = new Date();
      localToday.setHours(0, 0, 0, 0);

      const utcTodayStart = new Date(
        localToday.getTime() - localToday.getTimezoneOffset() * 60000
      ).toISOString();

      const localTomorrow = new Date(localToday);
      localTomorrow.setDate(localToday.getDate() + 1);
      const utcTomorrowStart = new Date(
        localTomorrow.getTime() - localTomorrow.getTimezoneOffset() * 60000
      ).toISOString();

      // Fetch stats from API
      const response = await api.getVisitStats({
        startDate: utcTodayStart,
        endDate: utcTomorrowStart,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const apiStats = response.data;
      let statsData: StatItem[] = [];

      // Similar stats for all roles
      statsData = [
        {
          name: "Approved Visits",
          value: apiStats.approved ?? 0,
          icon: UserCheck,
          color: "text-green-500",
          bgColor: "bg-green-50",
          status: VISIT_STATUS.APPROVED,
        },
        {
          name: "New Visit Requests",
          value: apiStats.pending ?? 0,
          icon: AlertCircle,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50",
          status: VISIT_STATUS.PENDING,
        },
        {
          name: "Completed Visits",
          value: apiStats.completed ?? 0,
          icon: CheckCircle,
          color: "text-indigo-500",
          bgColor: "bg-indigo-50",
          status: VISIT_STATUS.COMPLETED,
        },
        {
          name: "Cancelled Visits",
          value: apiStats.cancelled ?? 0,
          icon: XCircle,
          color: "text-red-500",
          bgColor: "bg-red-50",
          status: VISIT_STATUS.CANCELLED,
        },
      ];

      // Add total users card for admin
      if (role === "admin") {
        statsData.unshift({
          name: "Total Users",
          value: apiStats.totalUsers ?? 0,
          icon: Users,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
        });
      }

      setStats(statsData);
      setConnectionError(null);
    } catch (err: any) {
      console.error("⚠️ Error fetching stats:", err.message);
      console.error("Error details:", err);
      setConnectionError(err.message || "Failed to fetch stats");
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
            className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 ${stat.status ? "cursor-pointer" : ""}`}
            onClick={() =>
              stat.status ? handleStatCardClick(stat.status) : null
            }
            aria-label={
              stat.status ? `View ${stat.name.toLowerCase()}` : undefined
            }
            tabIndex={stat.status ? 0 : undefined}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon
                    className={`h-6 w-6 ${stat.color}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </h3>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`px-6 py-2 bg-gray-50 rounded-b-xl border-t border-gray-100`}
            >
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
