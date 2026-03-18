import { z } from "zod";

// --- Reusable helpers ---

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const requiredField = (label: string, regex: RegExp, format: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(regex, `${label} must be in ${format} format`);

const optionalField = (label: string, regex: RegExp, format: string) =>
  z
    .string()
    .regex(regex, `${label} must be in ${format} format`)
    .optional()
    .nullable();

const toDateTime = (date: string, time: string): Date =>
  new Date(`${date}T${time}`);

// --- Schemas ---

export const EventSlugSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export const UpdateEventDetailsSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  capacity: z.string().optional().nullable(),
  ticketPrice: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  requireApproval: z.boolean().optional(),
});

export const UpdateEventSettingsSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  requireApproval: z.boolean(),
  registrationOpen: z.boolean(),
});

export const RegistrationQuestionSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  questionId: z.number().optional().nullable(),
  text: z.string().optional().nullable(),
  required: z.boolean().optional(),
});

export const CreateEventSchema = z
  .object({
    title: z
      .string()
      .min(1, "Event title is required")
      .max(200, "Event title must be at most 200 characters")
      .trim(),
    startDate: requiredField("Start date", DATE_REGEX, "YYYY-MM-DD"),
    startTime: requiredField("Start time", TIME_REGEX, "HH:MM (24-hour)"),
    endDate: optionalField("End date", DATE_REGEX, "YYYY-MM-DD"),
    endTime: optionalField("End time", TIME_REGEX, "HH:MM (24-hour)"),
    location: z
      .string()
      .max(500, "Location must be at most 500 characters")
      .optional()
      .nullable(),
    description: z
      .string()
      .max(5000, "Description must be at most 5000 characters")
      .optional()
      .nullable(),
    ticketPrice: z
      .string()
      .max(100, "Ticket price must be at most 100 characters")
      .optional()
      .nullable(),
    coverImage: z.string().optional().nullable(),
    requireApproval: z.boolean().optional(),
    capacity: z
      .string()
      .refine(
        (val) => !val || (Number.isInteger(Number(val)) && Number(val) > 0),
        "Capacity must be a positive integer",
      )
      .optional()
      .nullable(),
    questions: z
      .array(
        z.object({
          id: z.string().or(z.number()),
          text: z
            .string()
            .min(1, "Question text cannot be empty")
            .max(500, "Question text must be at most 500 characters")
            .trim(),
          required: z.boolean(),
          type: z.enum(["text", "multiple_choice", "dropdown", "file_upload"]),
          options: z.array(z.string()).optional(),
          allowedFileTypes: z.array(z.string()).optional(),
          validationPattern: z.string().optional(),
          validationMessage: z.string().optional(),
        }),
      )
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.endDate) return;

    const startDT = toDateTime(data.startDate, data.startTime);
    const endDT = toDateTime(data.endDate, data.endTime ?? "00:00");

    if (isNaN(startDT.getTime()) || isNaN(endDT.getTime())) return;

    if (endDT < startDT) {
      const isSameDay = data.startDate === data.endDate;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: isSameDay
          ? "End time must be after start time on the same day"
          : "End date must be on or after start date",
        path: [isSameDay ? "endTime" : "endDate"],
      });
    }
  });
