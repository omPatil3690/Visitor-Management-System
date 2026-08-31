import  { useState } from "react";
import { useForm } from "react-hook-form";
import { Camera } from "lucide-react";
import { toast } from "react-hot-toast";
import { api } from '../lib/api';
import QRCode from "qrcode";

type VisitorFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  photo?: FileList;

  purpose: string;
  hostEmail: string;
  checkInTime: string;
  checkOutTime: string;
  validUntil: string;
  notes: string;
  status?: string;
};

export function RequestVisit() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitorFormData>();
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  const onSubmit = async (formData: VisitorFormData) => {
    try {
      let photoUrl = '';

      // Upload photo if provided
      if (formData.photo?.[0]) {
        const file = formData.photo[0];
        toast.loading('Uploading photo...');

        const uploadResponse = await api.uploadImage(file);

        if (uploadResponse.error) {
          toast.dismiss();
          throw new Error(uploadResponse.error);
        }

        photoUrl = uploadResponse.data.url;
        toast.dismiss();
        toast.success('Photo uploaded!');
      }

      // Get host details
      toast.loading('Finding host...');
      const hostResponse = await api.searchHost(formData.hostEmail);

      if (hostResponse.error) {
        toast.dismiss();
        throw new Error("Host not found with email: " + formData.hostEmail);
      }

      const host = hostResponse.data;
      toast.dismiss();

      // Step 1: Create or update visitor
      toast.loading('Creating visitor record...');

      // First check if visitor exists
      const searchResponse = await api.searchVisitor({ email: formData.email });

      let visitorId;

      if (searchResponse.data && !searchResponse.error) {
        // Visitor exists, use their ID
        visitorId = searchResponse.data.id;
        toast.dismiss();
        toast.success('Existing visitor found!');
      } else {
        // Create new visitor
        const visitorResponse = await api.createVisitor({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company || undefined,
          photoUrl: photoUrl || undefined,
        });

        if (visitorResponse.error) {
          toast.dismiss();
          throw new Error(visitorResponse.error);
        }

        visitorId = visitorResponse.data.id;
        toast.dismiss();
        toast.success('Visitor record created!');
      }

      // Step 2: Create visit record
      toast.loading('Creating visit request...');

      const visitResponse = await api.createVisit({
        visitorId,
        hostId: host.id,
        purpose: formData.purpose,
        validUntil: new Date(formData.validUntil).toISOString(),
        notes: formData.notes || undefined,
      });

      if (visitResponse.error) {
        toast.dismiss();
        throw new Error(visitResponse.error);
      }

      const visit = visitResponse.data;
      toast.dismiss();
      toast.success('Visit requested successfully!');

      // Step 3: Generate QR code with visit info
      const qrData = JSON.stringify({
        visitId: visit.id,
        name: formData.name,
        email: formData.email,
        purpose: formData.purpose,
        validUntil: formData.validUntil,
      });

      const qrUrl = await QRCode.toDataURL(qrData);
      setQrImageUrl(qrUrl);

      reset();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`Failed: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Request a Visit
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Please fill in the details for your visit request.
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {qrImageUrl && (
                  <div className="rounded-md bg-green-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Visit requested successfully!
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <img src={qrImageUrl} alt="Visit QR Code" className="w-48 h-48" />
                        <p className="mt-2 text-xs text-center text-gray-500">QR Code for your visit</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visitor Information Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-4">
                    Visitor Information
                  </h4>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Full name
                      </label>
                      <input
                        type="text"
                        {...register("name", { required: "Name is required" })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email address
                      </label>
                      <input
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                        })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone number
                      </label>
                      <input
                        type="tel"
                        {...register("phone", {
                          required: "Phone number is required",
                        })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Company
                      </label>
                      <input
                        type="text"
                        {...register("company")}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Visitor Photo
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Camera className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="photo"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload a photo</span>
                            <input
                              id="photo"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              {...register("photo")}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visit Information Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-4">
                    Visit Information
                  </h4>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label
                        htmlFor="purpose"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Purpose of visit
                      </label>
                      <input
                        type="text"
                        {...register("purpose", {
                          required: "Purpose is required",
                        })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.purpose && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.purpose.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-6">
                      <label
                        htmlFor="hostEmail"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Host email
                      </label>
                      <input
                        type="email"
                        {...register("hostEmail", {
                          required: "Host email is required",
                        })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.hostEmail && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.hostEmail.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Enter the email of the person you are visiting
                      </p>
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="checkInTime"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Check-in time
                      </label>
                      <input
                        type="datetime-local"
                        {...register("checkInTime")}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="checkOutTime"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Check-out time
                      </label>
                      <input
                        type="datetime-local"
                        {...register("checkOutTime")}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>



                    <div className="col-span-6 sm:col-span-3">
                      <label
                        htmlFor="validUntil"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Valid until
                      </label>
                      <input
                        type="datetime-local"
                        {...register("validUntil", {
                          required: "Valid until date is required",
                        })}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.validUntil && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.validUntil.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-6">
                      <label
                        htmlFor="notes"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Notes (optional)
                      </label>
                      <textarea
                        {...register("notes")}
                        rows={3}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400"
                >
                  Request Visit
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
