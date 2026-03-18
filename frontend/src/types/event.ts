import { SurveyConfig } from "./survey";

export interface CertificateConfig {
  isEnabled: boolean;
  templateUrl: string;
  text: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    baseFontSize: number;
    thresholdLength: number;
    minFontSize: number;
    maxFontSize: number;
    fontFile: string;
    fontWeight: number;
    fontStyle: "normal" | "italic";
  };
}

export type QuestionType = 'text' | 'multiple_choice' | 'dropdown' | 'file_upload';

export interface Question {
  id: number | string;
  text: string;
  required: boolean;
  type: QuestionType;
  options?: string[];
  allowedFileTypes?: string[];
  validationPattern?: string;
  validationMessage?: string;
}

export type QuestionFieldValue = string | boolean | QuestionType | string[];

export interface EventData {
  slug: string;
  title: string;
  status?: string;
  registrationOpen?: boolean;
  // ID of the Supabase auth user who created the event
  organizerId?: string | null;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  description: string;
  ticketPrice: string;
  capacity: string;
  registeredCount?: number;
  requireApproval: boolean;
  coverImage?: string;
  theme: string;
  questions: Question[];
  createdAt: string;
  postEventSurvey?: SurveyConfig;
  certificateConfig?: CertificateConfig;
}

export interface EventFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  description: string;
  coverImage: string;
  theme: string;
  ticketPrice: string;
  capacity: string;
  requireApproval: boolean;
  questions: Question[];
}

// Type for database insert (repository layer)
export interface EventInsertData {
  organizer_id: string;
  event_name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string | null;
  price: string;
  capacity: number | null;
  require_approval: boolean;
  form_questions: Question[] | null;
  status: string;
  registration_open?: boolean;
  cover_image?: string | null;
  certificate_config?: CertificateConfig | null;
}

// Type for validated event creation input (from Zod schema)
export interface CreateEventInput {
  title: string;
  startDate: string;
  startTime: string;
  endDate?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  ticketPrice?: string | null;
  requireApproval?: boolean;
  capacity?: string | null;
  coverImage?: string | null;
  questions?: Question[] | null;
  certificateConfig?: CertificateConfig | null;
}
