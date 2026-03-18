type RegistrationOpenInput = {
  registrationOpen?: boolean | null;
  status?: string | null;
};

type RegistrationOpenDbInput = {
  registration_open?: boolean | null;
  status?: string | null;
};

export function isRegistrationOpen(input: RegistrationOpenInput): boolean {
  if (input.registrationOpen !== null && input.registrationOpen !== undefined) {
    return Boolean(input.registrationOpen);
  }
  return (input.status ?? "active").toLowerCase() === "active";
}

export function isRegistrationOpenFromDb(input: RegistrationOpenDbInput): boolean {
  if (input.registration_open !== null && input.registration_open !== undefined) {
    return Boolean(input.registration_open);
  }
  return (input.status ?? "active").toLowerCase() === "active";
}
