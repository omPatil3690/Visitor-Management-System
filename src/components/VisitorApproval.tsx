import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import QRCode from 'qrcode';
import emailjs from '@emailjs/browser';

type Visit = Database['public']['Tables']['visits']['Row'] & {
  visitors: Database['public']['Tables']['visitors']['Row'];
};

export function VisitorApproval() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(
          '*, visitors(*)'
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisits(data as Visit[]);
    } catch (error) {
      console.error('Error loading visits:', error);
      toast.error('Failed to load pending visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const handleApproval = async (visitId: string, approved: boolean) => {
    try {
      const { data: updatedData, error } = await supabase
        .from('visits')
        .update({
          status: approved ? 'approved' : 'denied',
          updated_at: new Date().toISOString(),
        })
        .eq('id', visitId)
        .select('*, visitors(*)')
        .single();

      if (error) throw error;

      toast.success(`Visit ${approved ? 'approved' : 'denied'} successfully`);

      if (approved && updatedData) {
        // Generate QR code data
        const qrData = JSON.stringify({
          visitId: updatedData.id,
          name: updatedData.visitors.name,
          email: updatedData.visitors.email,
          purpose: updatedData.purpose,
          validUntil: updatedData.valid_until,
        });

        const qrUrl = await QRCode.toDataURL(qrData);

        try {
          const emailResult = await emailjs.send(
            "service_tmagvgd", // Your EmailJS Service ID
            "template_c4a4dpu", // Your EmailJS Template ID
            {
              to_name: updatedData.visitors.name,
              to_email: updatedData.visitors.email,
              qr_code: qrUrl,
              visit_id: updatedData.id,
              visit_purpose: updatedData.purpose,
              valid_until: new Date(updatedData.valid_until).toLocaleString(),
            },
            "ApAlChy6Mq77wiEue" // Your EmailJS Public Key
          );

          if (emailResult.status === 200) {
            toast.success('Approval email sent successfully!');
          } else {
            console.warn("Email sending failed with status:", emailResult.status);
          }
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
      }

      loadVisits(); // Reload the list after action
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit status');
    }
  };

  const filteredVisits = visits.filter(visit =>
    visit.visitors.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.visitors.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Pending Visits</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and approve pending visitor requests
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-1 items-center justify-between mb-4">
          <div className="w-full max-w-lg lg:max-w-xs">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-primary-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                placeholder="Search visits"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Visitor
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Purpose
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Valid Until
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Requested At
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredVisits.map((visit) => (
                      <tr key={visit.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-gray-900">{visit.visitors.name}</div>
                          <div className="text-gray-500">{visit.visitors.email}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {visit.purpose}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(visit.valid_until), 'PPp')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(visit.created_at), 'PPp')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleApproval(visit.id, true)}
                            className="text-green-600 hover:text-green-900 mr-4"
                            title="Approve Visit"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleApproval(visit.id, false)}
                            className="text-red-600 hover:text-red-900"
                            title="Deny Visit"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
