import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import {
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { VisitDetailsModal } from "./VisitDetailsModal";
import { Visit } from "./VisitDetailsModal";

type StatItem = {
  name: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  status?: string;
  description: string;
};

const VISIT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DENIED: "denied",
};

export function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedVisits, setSelectedVisits] = useState<Visit[]>([]);

  useEffect(() => {
    if (!user?.role) return;

    // Initial fetch
    fetchStats();

    // Poll for updates every 10 seconds
    const pollInterval = setInterval(() => {
      fetchStats();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user?.role]);

  const handleStatusChange = () => {
    if (user?.role) {
      fetchStats();
    }
  };

  const fetchStats = async () => {
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
      
      // Common stats configuration based on cleaned up requirement
      // Showing only relevant actionable stats
      const statsData: StatItem[] = [
        {
          name: "Pending Requests",
          value: apiStats.pending ?? 0,
          icon: AlertCircle,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          status: VISIT_STATUS.PENDING,
          description: "Awaiting approval",
        },
        {
          name: "Expected Visitors",
          value: apiStats.approved ?? 0,
          icon: UserCheck,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
          status: VISIT_STATUS.APPROVED,
          description: "Approved for today",
        },
        {
          name: "Checked In / Completed",
          value: apiStats.completed ?? 0,
          icon: CheckCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          status: VISIT_STATUS.COMPLETED,
          description: "Visits completed",
        },
        {
          name: "Denied Visits",
          value: apiStats.denied ?? 0,
          icon: XCircle,
          color: "text-rose-600",
          bgColor: "bg-rose-50",
          borderColor: "border-rose-200",
          status: VISIT_STATUS.DENIED,
          description: "Rejected today",
        }
      ];

      setStats(statsData);
      setConnectionError(null);
    } catch (err: any) {
      console.error("⚠️ Error fetching stats:", err.message);
      setConnectionError(err.message || "Failed to fetch stats");
    }
  };

  const handleStatCardClick = async (status: string) => {
    setSelectedStatus(status);
    try {
      const localToday = new Date();
      localToday.setHours(0, 0, 0, 0);
      const todayStart = new Date(
        localToday.getTime() - localToday.getTimezoneOffset() * 60000
      ).toISOString();

      const localTomorrow = new Date(localToday);
      localTomorrow.setDate(localToday.getDate() + 1);
      const todayEnd = new Date(
        localTomorrow.getTime() - localTomorrow.getTimezoneOffset() * 60000
      ).toISOString();

      // Fetch visits by status
      const response = await api.getVisits({
        status,
        startDate: todayStart,
        endDate: todayEnd,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const visits = response.data?.visits || [];
      setSelectedVisits(visits);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Error fetching visits:", error);
      setConnectionError(error.message || "Failed to fetch visits");
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, <span className="text-sky-600">{user?.name || "Administrator"}</span>
          </h1>
          <p className="mt-1 text-slate-500">
            Here's your daily visitor activity overview.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <Calendar className="h-4 w-4 text-sky-600" />
          {currentDate}
        </div>
      </div>

      {connectionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>Connection issue: {connectionError}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 ${
              stat.status ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : ""
            } ${stat.borderColor}`}
            onClick={() => stat.status && handleStatCardClick(stat.status)}
            role="button"
            tabIndex={stat.status ? 0 : undefined}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                {stat.status === VISIT_STATUS.PENDING && (Number(stat.value) > 0) && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-4xl font-bold text-slate-900 tracking-tight">
                  {stat.value}
                </p>
                <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  {stat.name}
                </h3>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-slate-400 font-medium">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {stat.description}
              </div>
            </div>
            
            {/* Background Decoration */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-125 transition-transform duration-500 ${stat.bgColor.replace('bg-', 'bg-')}`} />
          </div>
        ))}
      </div>

      <VisitDetailsModal
        status={selectedStatus}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userRole={user?.role}
        userId={user?.id}
        visits={selectedVisits}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}