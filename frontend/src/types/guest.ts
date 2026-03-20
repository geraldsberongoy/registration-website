export interface Guest {
  registrant_id: string;
  created_at?: string | null;
  event_id: string;
  users_id: string;
  terms_approval: boolean;
  form_answers: Record<string, string>;
  is_registered: boolean;
  is_going: boolean | null;
  check_in?: boolean | null;
  check_in_time?: string | null;
  qr_data: string | null;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface GuestStats {
  totalRsvp: number;
  totalRegistered: number;
  checkedIn: number;
  going: number;
  notGoing: number;
  notResponded: number;
  ticketsReady: number;
  ticketsMissing: number;
}
