import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Camera } from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

type VisitorFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  photo?: FileList;

  purpose: string;
  hostEmail: string;
  entityEmail: string; // Added field for entity email
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
  const [userId, setUserId] = useState<string | null>(null);

  // Get the current user session when component mounts
  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    }
    getUserId();
  }, []);

  const onSubmit = async (formData: VisitorFormData) => {
    try {
    //   // Check if user is authenticated
    //   if (!userId) {
    //     toast.error("You must be logged in to request a visit");
    //     return;
    //   }

      let photoUrl = null;

      // Upload photo if provided
      if (formData.photo?.[0]) {
        const file = formData.photo[0];
        const fileExt = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`; // Using UUID for unique filenames
        const filePath = fileName;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("identification-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("identification-images")
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      // // Get host details
      // const { data: hostData, error: hostError } = await supabase
      //   .from("hosts")
      //   .select("id")
      //   .eq("email", formData.hostEmail)
      //   .single();

      // if (hostError) {
      //   throw new Error("Host not found with email: " + formData.hostEmail);
      // }

      // Look up entity by email in the hosts table, if provided
            let entityId = null;
            if (formData.entityEmail && formData.entityEmail.trim() !== "") {
              const { data: entityData, error: entityError } = await supabase
                .from("hosts")
                .select("id")
                .eq("email", formData.entityEmail)
                .eq("role", "entity") // Make sure we're getting an entity role
                .maybeSingle();
      
              if (entityError && entityError.code !== "PGRST116") {
                console.error("Entity lookup error:", entityError);
                throw new Error("Error looking up entity: " + entityError.message);
              }
      
              if (entityData) {
                entityId = entityData.id;
              } else {
                toast.error(
                  "No entity found with the provided email. Please make sure the entity exists in the system."
                );
                throw new Error(
                  "No entity found with email: " + formData.entityEmail
                );
              }
            }
      

      // Step 1: Create or find existing visitor
      let visitorId;

      const { data: existingVisitor, error: visitorLookupError } =
        await supabase
          .from("visitors")
          .select("id")
          .eq("email", formData.email)
          .maybeSingle();

      if (visitorLookupError && visitorLookupError.code !== "PGRST116") {
        throw visitorLookupError;
      }

      if (existingVisitor) {
        visitorId = existingVisitor.id;

        const { error: updateError } = await supabase
          .from("visitors")
          .update({
            name: formData.name,
            phone: formData.phone,
            company: formData.company || null,
            photo_url: photoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", visitorId);

        if (updateError) {
          console.error("Visitor update error:", updateError);
          throw updateError;
        }
      } else {
        const { data: newVisitor, error: createError } = await supabase
          .from("visitors")
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company || null,
            photo_url: photoUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Visitor creation error:", createError);
          throw createError;
        }

        visitorId = newVisitor.id;
      }

      // Step 2: Create visit record
      const currentTime = new Date().toISOString();
      const visitId = uuidv4(); // Generate unique visit ID

      const { error: visitError } = await supabase.from("visits").insert({
        id: visitId,
        visitor_id: visitorId,
        entity_id : entityId,
        purpose: formData.purpose,
        status: "pending",
        check_in_time: formData.checkInTime
          ? new Date(formData.checkInTime).toISOString()
          : null,
        check_out_time: formData.checkOutTime
          ? new Date(formData.checkOutTime).toISOString()
          : null,
        valid_until: new Date(formData.validUntil).toISOString(),
        notes: formData.notes || null,
        created_at: currentTime,
        updated_at: currentTime,
      });

      if (visitError) {
        console.error("Visit creation error:", visitError);
        throw visitError;
      }

      // Step 3: Generate QR code with visit info
      const qrData = JSON.stringify({
        visitId,
        name: formData.name,
        email: formData.email,
        purpose: formData.purpose,
        validUntil: formData.validUntil,
      });

      const qrUrl = await QRCode.toDataURL(qrData);
      setQrImageUrl(qrUrl);

      toast.success("Visit requested successfully!");
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
                        htmlFor="entityEmail"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Entity email
                      </label>
                      <input
                        type="email"
                        {...register("entityEmail")}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter the email of the entity associated with this visit
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
