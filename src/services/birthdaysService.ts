import { birthdayRecords } from "../data/birthdays";
import type { Birthday, MemberRecord, MemberSaveInput, MemberValidationResult } from "../types";
import { getPersistenceClient, warnAndUseFallback, type PersistenceResult } from "./persistence";

interface SupabaseMemberRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  last_initial: string | null;
  email: string | null;
  phone_number: string | null;
  member_role: string | null;
  date_joined: string | null;
  birthday_month: number | null;
  birthday_day: number | null;
  instagram_handle: string | null;
}

export interface BirthdayLoadResult {
  birthdays: Birthday[];
  source: "static" | "supabase" | "fallback";
}

export interface MemberLoadResult {
  members: MemberRecord[];
  source: "static" | "supabase" | "fallback";
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });

export function getBirthdays(): Birthday[] {
  return birthdayRecords;
}

export function getUpcomingBirthdays(today = new Date()): Birthday[] {
  return getStaticBirthdaysThisMonth(today);
}

export function getBirthdaysThisMonthFromMembers(members: MemberRecord[], today = new Date()): Birthday[] {
  const currentMonth = today.getMonth() + 1;

  return members
    .filter((member) => member.birthdayMonth === currentMonth && Boolean(member.birthdayDay))
    .sort((a, b) => (a.birthdayDay ?? 0) - (b.birthdayDay ?? 0))
    .map(toBirthdayFromMember);
}

export async function loadMemberRecords(): Promise<MemberLoadResult> {
  const supabase = getPersistenceClient();

  if (!supabase) {
    return {
      members: [],
      source: "static"
    };
  }

  const { data, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, last_initial, email, phone_number, member_role, date_joined, birthday_month, birthday_day, instagram_handle")
    .order("birthday_month", { ascending: true, nullsFirst: false })
    .order("birthday_day", { ascending: true, nullsFirst: false })
    .order("first_name", { ascending: true });

  if (error || !data) {
    warnAndUseFallback("Unable to load member birthday records from Supabase. Showing an empty birthday manager.", error);
    return {
      members: [],
      source: "fallback"
    };
  }

  return {
    members: (data as SupabaseMemberRow[]).map(fromSupabaseMember),
    source: "supabase"
  };
}

export async function loadBirthdaysThisMonth(today = new Date()): Promise<BirthdayLoadResult> {
  const supabase = getPersistenceClient();
  const currentMonth = today.getMonth() + 1;

  if (!supabase) {
    return {
      birthdays: getStaticBirthdaysThisMonth(today),
      source: "static"
    };
  }

  const { data, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, last_initial, email, phone_number, member_role, date_joined, birthday_month, birthday_day, instagram_handle")
    .eq("birthday_month", currentMonth)
    .not("birthday_day", "is", null)
    .order("birthday_day", { ascending: true });

  if (error || !data) {
    warnAndUseFallback("Unable to load member birthdays from Supabase. Falling back to static birthday data.", error);
    return {
      birthdays: getStaticBirthdaysThisMonth(today),
      source: "fallback"
    };
  }

  return {
    birthdays: (data as SupabaseMemberRow[])
      .map(toBirthday)
      .filter((birthday): birthday is Birthday => Boolean(birthday)),
    source: "supabase"
  };
}

export async function saveMemberRecord(input: MemberSaveInput): Promise<PersistenceResult<MemberRecord>> {
  const validation = validateMemberInput(input);
  if (!validation.isValid) {
    return Promise.reject(validation);
  }

  const supabase = getPersistenceClient();

  if (!supabase) {
    return {
      data: toLocalMemberRecord(input),
      source: "fallback"
    };
  }

  const payload = toSupabaseMemberPayload(input);
  const query = input.id && isUuid(input.id)
    ? supabase.from("members").update(payload).eq("id", input.id).select().single()
    : supabase.from("members").insert(payload).select().single();

  const { data, error } = await query;

  if (error || !data) {
    console.error("[birthdays] Supabase member save failed.", {
      error,
      data,
      input,
      payload
    });
    warnAndUseFallback("Unable to save member birthday data to Supabase. Keeping local UI stable.", error);
    return {
      data: toLocalMemberRecord(input),
      source: "fallback"
    };
  }

  return {
    data: fromSupabaseMember(data as SupabaseMemberRow),
    source: "supabase"
  };
}

export async function deleteMemberRecord(member: MemberRecord): Promise<PersistenceResult<MemberRecord>> {
  const supabase = getPersistenceClient();

  if (!supabase || !isUuid(member.id)) {
    return {
      data: member,
      source: "fallback"
    };
  }

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", member.id);

  if (error) {
    warnAndUseFallback("Unable to delete member birthday record from Supabase. Keeping local UI stable.", error);
    return {
      data: member,
      source: "fallback"
    };
  }

  return {
    data: member,
    source: "supabase"
  };
}

export function validateMemberInput(input: MemberSaveInput): MemberValidationResult {
  const errors: MemberValidationResult["errors"] = {};
  const firstName = input.firstName.trim();
  const birthdayMonth = normalizeOptionalNumber(input.birthdayMonth);
  const birthdayDay = normalizeOptionalNumber(input.birthdayDay);

  if (!firstName) {
    errors.firstName = "First name is required.";
  }

  if (birthdayMonth !== undefined && (!Number.isInteger(birthdayMonth) || birthdayMonth < 1 || birthdayMonth > 12)) {
    errors.birthdayMonth = "Birthday month must be 1–12.";
  }

  if (birthdayDay !== undefined) {
    const maxDay = birthdayMonth ? getMaxBirthdayDay(birthdayMonth) : 31;

    if (!Number.isInteger(birthdayDay) || birthdayDay < 1 || birthdayDay > maxDay) {
      errors.birthdayDay = `Birthday day must be 1–${maxDay}.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function getStaticBirthdaysThisMonth(today: Date) {
  const currentMonth = monthFormatter.format(today);

  return [...birthdayRecords]
    .filter((birthday) => birthday.dateLabel.startsWith(currentMonth))
    .sort((a, b) => getDayFromDateLabel(a.dateLabel) - getDayFromDateLabel(b.dateLabel));
}

function toBirthday(row: SupabaseMemberRow): Birthday | null {
  if (!row.first_name || !row.birthday_month || !row.birthday_day) return null;

  return {
    id: row.id,
    name: formatMemberName(row.first_name, row.last_initial),
    initials: getInitials(row.first_name, row.last_initial),
    dateLabel: `${monthFormatter.format(new Date(2026, row.birthday_month - 1, 1))} ${row.birthday_day}`,
    instagramHandle: normalizeInstagramHandle(row.instagram_handle)
  };
}

function toBirthdayFromMember(member: MemberRecord): Birthday {
  return {
    id: member.id,
    name: formatMemberName(member.firstName, member.lastInitial),
    initials: getInitials(member.firstName, member.lastInitial),
    dateLabel: `${monthFormatter.format(new Date(2026, (member.birthdayMonth ?? 1) - 1, 1))} ${member.birthdayDay}`,
    instagramHandle: member.instagramHandle
  };
}

function fromSupabaseMember(row: SupabaseMemberRow): MemberRecord {
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: normalizeOptionalString(row.last_name),
    lastInitial: normalizeLastInitial(row.last_initial),
    email: normalizeOptionalString(row.email),
    phoneNumber: normalizeOptionalString(row.phone_number),
    memberRole: normalizeOptionalString(row.member_role),
    dateJoined: normalizeOptionalString(row.date_joined),
    birthdayMonth: row.birthday_month ?? undefined,
    birthdayDay: row.birthday_day ?? undefined,
    instagramHandle: normalizeInstagramHandle(row.instagram_handle)
  };
}

function toLocalMemberRecord(input: MemberSaveInput): MemberRecord {
  return {
    id: input.id ?? createLocalId("member"),
    firstName: input.firstName.trim(),
    lastName: normalizeOptionalString(input.lastName),
    lastInitial: normalizeLastInitial(input.lastInitial),
    email: normalizeEmail(input.email),
    phoneNumber: normalizeOptionalString(input.phoneNumber),
    memberRole: normalizeOptionalString(input.memberRole),
    dateJoined: normalizeOptionalString(input.dateJoined),
    birthdayMonth: normalizeOptionalNumber(input.birthdayMonth),
    birthdayDay: normalizeOptionalNumber(input.birthdayDay),
    instagramHandle: normalizeInstagramHandle(input.instagramHandle)
  };
}

function toSupabaseMemberPayload(input: MemberSaveInput) {
  const payload: Record<string, string | number | null> = {
    first_name: input.firstName.trim(),
    last_initial: normalizeLastInitial(input.lastInitial) ?? null,
    birthday_month: normalizeOptionalNumber(input.birthdayMonth) ?? null,
    birthday_day: normalizeOptionalNumber(input.birthdayDay) ?? null,
    instagram_handle: normalizeInstagramHandle(input.instagramHandle) ?? null
  };

  if (input.lastName !== undefined) payload.last_name = normalizeOptionalString(input.lastName) ?? null;
  if (input.email !== undefined) payload.email = normalizeEmail(input.email) ?? null;
  if (input.phoneNumber !== undefined) payload.phone_number = normalizeOptionalString(input.phoneNumber) ?? null;
  if (input.memberRole !== undefined) payload.member_role = normalizeOptionalString(input.memberRole) ?? null;
  if (input.dateJoined !== undefined) payload.date_joined = normalizeOptionalString(input.dateJoined) ?? null;

  return payload;
}

function formatMemberName(firstName: string, lastInitial?: string | null) {
  const normalizedLastInitial = normalizeLastInitial(lastInitial);
  return normalizedLastInitial ? `${firstName} ${normalizedLastInitial}` : firstName;
}

function getInitials(firstName: string, lastInitial?: string | null) {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = normalizeLastInitial(lastInitial);
  return `${first}${last ?? ""}`;
}

function normalizeLastInitial(value?: string | null) {
  const normalized = value?.trim().replace(".", "").charAt(0).toUpperCase();
  return normalized || undefined;
}

function normalizeInstagramHandle(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeEmail(value?: string | null) {
  const normalized = normalizeOptionalString(value)?.toLowerCase();
  return normalized;
}

function normalizeOptionalNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return undefined;
  return Number(value);
}

function getMaxBirthdayDay(month: number) {
  if (month === 2) return 29;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function getDayFromDateLabel(dateLabel: string) {
  return Number(dateLabel.split(" ")[1] ?? 0);
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

// TODO: Future member tooling may support .ics export, Google Calendar subscription,
// or Apple Calendar subscription for birthdays. Keep this pass read/write-data only.
