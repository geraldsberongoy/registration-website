"use client";

import React, { useState } from "react";
import { EventData } from "@/types/event";
import {
  updateEventDetailsAction,
  updateEventSettingsAction,
} from "@/actions/eventActions";
import { RegistrationQuestionsEditor } from "./RegistrationQuestionsEditor";
import { isRegistrationOpen as resolveRegistrationOpen } from "@/utils/registration-open";

interface EventManagementFormProps {
  event: EventData;
  slug: string;
  onCancel: () => void;
  onSuccess: () => void;
}

async function updateEventDetailsFormAction(
  slug: string,
  formData: FormData
): Promise<void> {
  const result = await updateEventDetailsAction({
    slug,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    startDate: formData.get("startDate") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    location: formData.get("location") as string,
    capacity: formData.get("capacity") as string,
    ticketPrice: formData.get("ticketPrice") as string,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to update event details.");
  }
}

async function updateEventSettingsFormAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  const result = await updateEventSettingsAction({
    slug,
    requireApproval: formData.get("requireApproval") === "on",
    registrationOpen: formData.get("registrationOpen") === "on",
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to update event settings.");
  }
}

export function EventManagementForm({
  event,
  slug,
  onCancel,
  onSuccess,
}: EventManagementFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const registrationOpenValue = resolveRegistrationOpen({
    registrationOpen: event.registrationOpen,
    status: event.status,
  });

  const handleSuccess = () => {
    setErrorMessage(null);
    setSuccessMessage("Changes saved successfully.");
    onSuccess();
  };

  const updateDetailsAction = async (formData: FormData) => {
    try {
      await updateEventDetailsFormAction(slug, formData);
      handleSuccess();
    } catch (error) {
      setSuccessMessage(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save changes.",
      );
    }
  };

  const updateSettingsAction = async (formData: FormData) => {
    try {
      await updateEventSettingsFormAction(slug, formData);
      handleSuccess();
    } catch (error) {
      setSuccessMessage(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save settings.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0a1520] border border-emerald-400/40 rounded-2xl px-6 py-5 max-w-sm w-[90%] text-center shadow-xl shadow-emerald-500/30">
            <h3 className="font-urbanist text-lg font-bold text-emerald-300 mb-2">
              Success
            </h3>
            <p className="font-urbanist text-sm text-emerald-100 mb-4">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="font-montserrat px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0a1520] border border-red-400/40 rounded-2xl px-6 py-5 max-w-sm w-[90%] text-center shadow-xl shadow-red-500/20">
            <h3 className="font-urbanist text-lg font-bold text-red-300 mb-2">
              Save Failed
            </h3>
            <p className="font-urbanist text-sm text-red-100 mb-4">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-montserrat px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10">
        <h2 className="font-urbanist text-lg md:text-xl font-bold text-white mb-4 md:mb-6">
          Event Details
        </h2>

        <form action={updateDetailsAction} className="space-y-6">
          <div>
            <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
              Event Title
            </label>
            <input
              type="text"
              name="title"
              defaultValue={event.title}
              required
              className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={event.description}
              className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
                Date
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={event.startDate}
                required
                className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                defaultValue={event.startTime}
                required
                className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                defaultValue={event.endTime}
                className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              defaultValue={event.location}
              placeholder="Enter event location"
              className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
                Capacity
              </label>
              <input
                type="text"
                name="capacity"
                defaultValue={event.capacity}
                className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label className="font-urbanist block text-sm font-medium text-white/80 mb-2">
                Ticket Price
              </label>
              <input
                type="text"
                name="ticketPrice"
                defaultValue={event.ticketPrice}
                className="font-urbanist w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-base placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="font-montserrat px-6 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm md:text-base font-medium transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-montserrat px-6 py-2.5 md:py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm md:text-base font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <RegistrationQuestionsEditor
        slug={slug}
        initialQuestions={event.questions || []}
      />

      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/10">
        <h2 className="font-urbanist text-lg md:text-xl font-bold text-white mb-4 md:mb-6">
          Settings
        </h2>

        <form
          key={`settings-${slug}-${event.requireApproval}-${registrationOpenValue}`}
          action={updateSettingsAction}
          className="space-y-4"
        >
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg gap-4">
            <div className="min-w-0">
              <p className="font-urbanist text-white font-medium text-base mb-1">
                Require Approval
              </p>
              <p className="font-urbanist text-white/60 text-sm">
                Manually approve each registration
              </p>
            </div>

            <label className="flex items-center gap-3 select-none">
              <input
                type="checkbox"
                name="requireApproval"
                defaultChecked={event.requireApproval}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="font-urbanist text-white/80 text-sm">
                Enabled
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg gap-4">
            <div className="min-w-0">
              <p className="font-urbanist text-white font-medium text-base mb-1">
                Registration Open
              </p>
              <p className="font-urbanist text-white/60 text-sm">
                Allow new attendees to register for this event
              </p>
            </div>

            <label className="flex items-center gap-3 select-none">
              <input
                type="checkbox"
                name="registrationOpen"
                defaultChecked={registrationOpenValue}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="font-urbanist text-white/80 text-sm">
                Enabled
              </span>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="font-montserrat px-6 py-2.5 md:py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm md:text-base font-medium transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
