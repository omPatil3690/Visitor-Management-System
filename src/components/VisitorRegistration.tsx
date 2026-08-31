import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

type VisitorFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  purpose: string;
  hostEmail: string;
  validUntil: string;
  notes: string;
};

export function VisitorRegistration() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitorFormData>();
  const { user } = useAuthStore();

  const onSubmit = async (formData: VisitorFormData) => {
    try {
      // Check if user is authenticated
      if (!user) {
        toast.error("You must be logged in to register visitors");
        return;
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
      toast.loading('Creating visit...');

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

      toast.dismiss();
      toast.success('Visit created successfully!');

      toast.success("Visitor registered successfully!");
      reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(`Failed: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Register New Visitor
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Please fill in the visitor's details and take their photo for
              security purposes.
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
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
                  disabled={isSubmitting || !user}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Register Visitor"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
