import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
// import QRCode from 'qrcode';
import QRCode from 'react-qr-code';
import emailjs from '@emailjs/browser';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase - replace with your actual credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

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
      // 1. Generate a unique ID for the visit
      const visitId = uuidv4();
      
      // 2. Insert visitor data into Supabase
      const { data: insertedData, error: dbError } = await supabase
        .from('visitors')
        .insert([
          {
            id: visitId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            purpose: formData.purpose,
            host_email: formData.hostEmail,
            valid_until: formData.validUntil,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (dbError) {
        throw new Error(dbError.message || 'Failed to insert visitor data');
      }
      
      // 3. Upload photo if provided
      if (formData.photo) {
        const { error: uploadError } = await supabase
          .storage
          .from('visitor-photos')
          .upload(`${visitId}.jpg`, formData.photo, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          // Continue with the process even if photo upload fails
        }
      }
      
      // 4. Generate QR code with visit info
      const qrData = JSON.stringify({
        visitId,
        name: formData.name,
        email: formData.email,
        purpose: formData.purpose,
        validUntil: formData.validUntil
      });
      // @ts-ignore
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrImageUrl(qrUrl);
      
      // 5. Send email with QR code
      const emailResult = await emailjs.send(
        'service_tmagvgd', // Your EmailJS service ID
        'template_c4a4dpu', // Your EmailJS template ID
        {
          to_name: formData.name,
          to_email: formData.email,
          qr_code: qrUrl,
          visit_id: visitId,
          visit_purpose: formData.purpose,
          host_email: formData.hostEmail,
          valid_until: new Date(formData.validUntil).toLocaleString(),
        },
        'ApAlChy6Mq77wiEue' // Your EmailJS user ID
      );

      if (emailResult.status !== 200) {
        throw new Error('Failed to send email');
      }
      
      // 6. Update visitor status to "email_sent"
      const { error: updateError } = await supabase
        .from('visitors')
        .update({ status: 'email_sent' })
        .eq('id', visitId);
        
      if (updateError) {
        console.error('Error updating visitor status:', updateError);
        // Continue even if status update fails
      }
      
      console.log('Registration complete:', {
        visitor: insertedData,
        qrGenerated: true,
        emailSent: true
      });
      
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
      setError(err instanceof Error ? err.message : 'Failed to register visitor. Please try again.');
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
                {success && (
                  <div className="rounded-md bg-green-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Visitor registration successful! An email with QR code has been sent to the visitor.
                        </p>
                      </div>
                    </div>
                    
                    {qrImageUrl && (
                      <div className="mt-4 flex justify-center">
                        <div className="p-2 bg-white border rounded-md shadow-sm">
                          <img src={qrImageUrl} alt="Visitor QR Code" className="w-32 h-32" />
                          <p className="mt-2 text-xs text-center text-gray-500">QR Code for visitor</p>
                        </div>
                      </div>
                    )}
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
                      Full name aba
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
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
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