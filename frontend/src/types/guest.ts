export interface Guest {
  registrant_id: string;
  event_id: string;
  users_id: string;
  terms_approval: boolean;
  form_answers: Record<string, string>;
  is_registered: boolean;
  qr_url: string | null;
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
  waitlist: number;
  notGoing: number;
}
