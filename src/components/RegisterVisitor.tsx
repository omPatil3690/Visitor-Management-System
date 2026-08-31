import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import QRCode from 'react-qr-code';
import emailjs from '@emailjs/browser';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface VisitorFormData {
  name: string;
  email: string;
  phone: string;
  purpose: string;
  hostEmail: string;
  validUntil: string;
  photo?: File;
}

export function RegisterVisitor() {
  const [formData, setFormData] = useState<VisitorFormData>({
    name: '',
    email: '',
    phone: '',
    purpose: '',
    hostEmail: '',
    validUntil: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [visitData, setVisitData] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;

    if (type === 'file' && files) {
      setFormData(prev => ({ ...prev, photo: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Upload photo if provided
      let photoUrl = '';
      if (formData.photo) {
        toast.loading('Uploading photo...');
        const uploadResponse = await api.uploadImage(formData.photo);

        if (uploadResponse.error) {
          throw new Error(uploadResponse.error);
        }

        photoUrl = uploadResponse.data.url;
        toast.dismiss();
        toast.success('Photo uploaded!');
      }

      // 2. Find host by email
      toast.loading('Finding host...');
      const hostResponse = await api.searchHost(formData.hostEmail);

      if (hostResponse.error) {
        toast.dismiss();
        throw new Error('Host not found with this email');
      }

      const host = hostResponse.data;
      toast.dismiss();

      // 3. Create or update visitor
      toast.loading('Creating visitor record...');
      const visitorResponse = await api.createVisitor({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        photoUrl,
      });

      if (visitorResponse.error) {
        toast.dismiss();
        throw new Error(visitorResponse.error);
      }

      const visitor = visitorResponse.data;
      toast.dismiss();
      toast.success('Visitor record created!');

      // 4. Create visit
      toast.loading('Creating visit...');
      const visitResponse = await api.createVisit({
        visitorId: visitor.id,
        hostId: host.id,
        purpose: formData.purpose,
        validUntil: new Date(formData.validUntil).toISOString(),
      });

      if (visitResponse.error) {
        toast.dismiss();
        throw new Error(visitResponse.error);
      }

      const visit = visitResponse.data;
      toast.dismiss();
      toast.success('Visit created successfully!');

      // 5. Generate QR code data
      const qrData = JSON.stringify({
        visitId: visit.id,
        visitorName: formData.name,
        hostName: host.name,
        purpose: formData.purpose,
        validUntil: formData.validUntil,
      });

      setVisitData({ ...visit, qrData });

      // TODO: Send email with QR code using EmailJS
      // Uncomment and configure when EmailJS credentials are available
      /*
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        {
          to_name: formData.name,
          to_email: formData.email,
          visit_id: visit.id,
          visit_purpose: formData.purpose,
          host_email: formData.hostEmail,
          valid_until: new Date(formData.validUntil).toLocaleString(),
        },
        'YOUR_PUBLIC_KEY'
      );
      */

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        purpose: '',
        hostEmail: '',
        validUntil: '',
      });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to register visitor';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Register New Visitor</h3>
            <p className="mt-1 text-sm text-gray-600">
              Please fill in the visitor's details and take their photo for security purposes.
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {success && visitData && (
                  <div className="rounded-md bg-green-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Visitor registration successful!
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <QRCode value={visitData.qrData} size={200} />
                        <p className="mt-2 text-xs text-center text-gray-500">QR Code for visitor</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                      Purpose of visit
                    </label>
                    <input
                      type="text"
                      name="purpose"
                      id="purpose"
                      required
                      value={formData.purpose}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="hostEmail" className="block text-sm font-medium text-gray-700">
                      Host email
                    </label>
                    <input
                      type="email"
                      name="hostEmail"
                      id="hostEmail"
                      required
                      value={formData.hostEmail}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                      Valid until
                    </label>
                    <input
                      type="datetime-local"
                      name="validUntil"
                      id="validUntil"
                      required
                      value={formData.validUntil}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Visitor Photo</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="photo"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Take photo</span>
                          <input
                            id="photo"
                            name="photo"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      {formData.photo && (
                        <p className="text-xs text-green-600">Photo selected: {formData.photo.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register Visitor'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
