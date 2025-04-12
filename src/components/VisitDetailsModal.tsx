import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { X } from "lucide-react";

type Visit = {
  id: string;
  visitor_name: string;
  host_name: string;
  purpose: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  valid_until?: string;
  created_at: string;
  approved_at?: string;
};

type VisitDetailsModalProps = {
  status: string;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userId?: string;
};

export function VisitDetailsModal({ 
  status, 
  isOpen, 
  onClose,
  userRole,
  userId
}: VisitDetailsModalProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && status) {
      fetchVisitsByStatus(status);
    }
  }, [isOpen, status, userRole, userId]);

  const fetchVisitsByStatus = async (status: string) => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const utcTodayStart = today.toISOString();
      const utcTomorrowStart = tomorrow.toISOString();
      
      let query = supabase
        .from("visits")
        .select(`
          id,
          visitor_name,
          host_name,
          purpose,
          status,
          check_in_time,
          check_out_time,
          valid_until,
          created_at,
          approved_at
        `)
        .eq("status", status);

      if (userRole === "resident") {
        query = query.eq("host_id", userId);
      } else if (userRole === "visitor") {
        query = query.eq("visitor_id", userId);
      }

      switch (status) {
        case "pending":
          query = query
            .gte("created_at", utcTodayStart)
            .lt("created_at", utcTomorrowStart);
          break;
        case "approved":
          query = query
            .gte("approved_at", utcTodayStart)
            .lt("approved_at", utcTomorrowStart);
          break;
        case "completed":
          query = query
            .gte("check_out_time", utcTodayStart)
            .lt("check_out_time", utcTomorrowStart);
          break;
        case "cancelled":
          // No date filter for cancelled as we don't have cancelled_at
          break;
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setVisits(data || []);
    } catch (err) {
      console.error("Error fetching visits:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "New Request";
      case "approved": return "Approved";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "denied": return "Denied";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-50";
      case "approved": return "text-green-600 bg-green-50";
      case "completed": return "text-indigo-600 bg-indigo-50";
      case "cancelled": return "text-red-600 bg-red-50";
      case "denied": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {getStatusLabel(status)} Visits - Today
            {userRole && ` (${userRole.charAt(0).toUpperCase() + userRole.slice(1)})`}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {status} visits found for today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{visit.visitor_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{visit.host_name}</td>
                      <td className="px-4 py-3 text-sm">{visit.purpose}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatTime(
                          visit.status === "pending" ? visit.created_at : 
                          visit.status === "approved" ? visit.approved_at :
                          visit.status === "completed" ? visit.check_out_time : 
                          visit.created_at
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(visit.status)}`}>
                          {getStatusLabel(visit.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}