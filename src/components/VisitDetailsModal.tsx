import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { X, Check, Ban, Clock, CheckCircle, XCircle } from "lucide-react";
import QRCode from "qrcode";
import emailjs from "@emailjs/browser";
import { v4 as uuidv4 } from "uuid";

export type Visit = {
  id: string;
  visitor_name: string;
  host_name: string;
  purpose: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  created_at: string;
  approved_at?: string;
  visitors?: { name: string };
  hosts?: { name: string };
  entity_id?: string;
};

type VisitDetailsModalProps = {
  status: string;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userId?: string;
  visits: Visit[];
  onStatusChange: () => void;
};

export function VisitDetailsModal({
  status,
  isOpen,
  onClose,
  userRole,
  userId,
  visits,
  onStatusChange,
}: VisitDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "deny" | "comple3te" | null
  >(null);

  const handleStatusUpdate = async (visit: Visit, newStatus: string) => {
    setLoading(true);
    setCurrentVisit(visit);
    setActionType(
      newStatus === "approved"
        ? "approve"
        : newStatus === "denied"
          ? "deny"
          : newStatus === "completed"
            ? "complete"
            : null
    );
    
    try {
      const updates = {
        status: newStatus,
        ...(newStatus === "approved" && {
          approved_at: new Date().toISOString(),
        }),
        ...(newStatus === "completed" && {
          check_out_time: new Date().toISOString(),
        }),
      };
      console.log("VisitDetailModal");
      const { data, error } = await supabase
        .from("visits")
        .update(updates)
        .eq("id", visit.id)
        .select('*, visitors(*)')
        .single();

      if (error) throw error;
      else {
        if (newStatus == 'approved') {
          console.log("data", data);
          // Step 3: Generate QR code with visit info
          const qrData = JSON.stringify({
            visitId:visit.id,
            name: data.visitors?.name,
            email: data.visitors?.email,
            purpose: data.purpose,
            validUntil: data.validUntil,
          });

          const qrUrl = await QRCode.toDataURL(qrData);
          setQrImageUrl(qrUrl);

          // Step 4: Send Email using EmailJS
          try {
            const emailResult = await emailjs.send(
              "", // Your EmailJS Service ID
              "", // Your EmailJS Template ID
              {
                to_name:  data.visitors?.name,
                to_email:  data.visitors?.email,
                qr_code: qrUrl,
                visit_id:  data.id,
                visit_purpose:  data.purpose,
                valid_until: new Date( data.validUntil).toLocaleString(),
              },
              "" // Your EmailJS Public Key
            );

            if (emailResult.status !== 200) {
              console.warn("Email sending failed with status:", emailResult.status);
            }
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
            // Continue execution even if email fails
          }
        }
      }

      onStatusChange();
    } catch (error) {
      console.error("Error updating visit status:", error);
    } finally {
      setLoading(false);
      setCurrentVisit(null);
      setActionType(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "denied":
        return "Denied";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "approved":
        return "text-green-600 bg-green-50";
      case "completed":
        return "text-indigo-600 bg-indigo-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      case "denied":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Updated function to allow guards to perform actions
  const canPerformAction = (visit: Visit) => {
    if (userRole === "admin" || userRole === "guard") {
      // Admin and guards can perform actions on any visit
      return true;
    } else if (userRole === "entity" && userId) {
      // Entity can only perform actions on visits related to itself
      return visit.entity_id === userId;
    }
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {getStatusLabel(status)} Visits - Today
            {userRole &&
              ` (${userRole.charAt(0).toUpperCase() + userRole.slice(1)})`}
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
          {visits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {status} visits found for today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Host
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {visit.visitor_name ||
                          (visit.visitors?.name ?? "Unknown Visitor")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visit.host_name ||
                          (visit.hosts?.name ?? "Unknown Host")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {visit.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            visit.status
                          )}`}
                        >
                          {getStatusLabel(visit.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(visit.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visit.approved_at
                          ? formatDateTime(visit.approved_at)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {canPerformAction(visit) && (
                          <div className="flex space-x-2">
                            {visit.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(visit, "approved")
                                  }
                                  disabled={
                                    loading &&
                                    currentVisit?.id === visit.id &&
                                    actionType === "approve"
                                  }
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                  {loading &&
                                    currentVisit?.id === visit.id &&
                                    actionType === "approve" ? (
                                    <span className="animate-spin">↻</span>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(visit, "denied")
                                  }
                                  disabled={
                                    loading &&
                                    currentVisit?.id === visit.id &&
                                    actionType === "deny"
                                  }
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                  {loading &&
                                    currentVisit?.id === visit.id &&
                                    actionType === "deny" ? (
                                    <span className="animate-spin">↻</span>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3 mr-1" />
                                      Deny
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                            {visit.status === "approved" && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(visit, "completed")
                                }
                                disabled={
                                  loading &&
                                  currentVisit?.id === visit.id &&
                                  actionType === "complete"
                                }
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                              >
                                {loading &&
                                  currentVisit?.id === visit.id &&
                                  actionType === "complete" ? (
                                  <span className="animate-spin">↻</span>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Complete
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
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
