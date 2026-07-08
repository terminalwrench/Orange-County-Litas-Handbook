export interface MemberRecord {
  id: string;
  firstName: string;
  lastInitial?: string;
  birthdayMonth?: number;
  birthdayDay?: number;
  instagramHandle?: string;
}

export interface MemberSaveInput {
  id?: string;
  firstName: string;
  lastInitial?: string;
  birthdayMonth?: number | null;
  birthdayDay?: number | null;
  instagramHandle?: string;
}

export interface MemberValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof MemberSaveInput, string>>;
}
