import { useMemo, useState, type FormEvent } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SelectInput, TextInput } from "../components/ui/inputs";
import { StatusChip } from "../components/ui/StatusChip";
import type { AnnualBranchReport, EventRecord, MemberRecord, MemberSaveInput, SharedAccount } from "../types";
import type { PersistenceResult } from "../services/persistence";
import {
  getAnnualBranchReport,
  getAvailableReportYears,
  getBranchMetrics,
  getSharedAccounts
} from "../services/operationsService";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

const monthOptions = [
  { value: "", label: "Month" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

const emptyBirthdayForm = {
  id: undefined as string | undefined,
  firstName: "",
  lastInitial: "",
  birthdayMonth: "",
  birthdayDay: "",
  instagramHandle: ""
};

const birthdayPageSize = 8;

interface OperationsProps {
  eventRecords: EventRecord[];
  memberRecords: MemberRecord[];
  isLoading: boolean;
  isPersistenceConfigured: boolean;
  onSaveMember: (input: MemberSaveInput) => Promise<PersistenceResult<MemberRecord>>;
  onDeleteMember: (member: MemberRecord) => Promise<PersistenceResult<MemberRecord>>;
}

export function Operations({
  eventRecords,
  memberRecords,
  isLoading,
  isPersistenceConfigured,
  onSaveMember,
  onDeleteMember
}: OperationsProps) {
  const today = new Date();
  const reportYears = useMemo(() => getAvailableReportYears(eventRecords), [eventRecords]);
  const [selectedYear, setSelectedYear] = useState(reportYears[0] ?? today.getFullYear());
  const [birthdayForm, setBirthdayForm] = useState(emptyBirthdayForm);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [birthdayMessage, setBirthdayMessage] = useState("");
  const [birthdayError, setBirthdayError] = useState("");
  const [isBirthdayFormOpen, setIsBirthdayFormOpen] = useState(false);
  const [expandedBirthdayMonth, setExpandedBirthdayMonth] = useState<string | undefined>();
  const [visibleBirthdayCount, setVisibleBirthdayCount] = useState(birthdayPageSize);
  const [selectedAccount, setSelectedAccount] = useState<SharedAccount | null>(null);
  const [credentialMessage, setCredentialMessage] = useState("");
  const metrics = getBranchMetrics(eventRecords, {
    memberCount: memberRecords.length,
    today
  });
  const sharedAccounts = getSharedAccounts();
  const annualReport = getAnnualBranchReport(eventRecords, selectedYear);
  const sortedMembers = [...memberRecords].sort(compareBirthdayMembers);
  const birthdayGroups = getBirthdayGroups(sortedMembers);

  function editMember(member: MemberRecord) {
    setBirthdayForm({
      id: member.id,
      firstName: member.firstName,
      lastInitial: member.lastInitial ?? "",
      birthdayMonth: member.birthdayMonth ? String(member.birthdayMonth) : "",
      birthdayDay: member.birthdayDay ? String(member.birthdayDay) : "",
      instagramHandle: member.instagramHandle ?? ""
    });
    setIsBirthdayFormOpen(true);
    setBirthdayMessage("");
    setBirthdayError("");
  }

  function resetBirthdayForm() {
    setBirthdayForm(emptyBirthdayForm);
    setIsBirthdayFormOpen(false);
    setBirthdayMessage("");
    setBirthdayError("");
  }

  function updateBirthdayForm(field: keyof typeof emptyBirthdayForm, value: string) {
    setBirthdayForm((current) => ({ ...current, [field]: value }));
  }

  function toggleBirthdayMonth(month: string) {
    setExpandedBirthdayMonth((current) => current === month ? undefined : month);
    setVisibleBirthdayCount(birthdayPageSize);
  }

  function openNewBirthdayForm() {
    setBirthdayForm(emptyBirthdayForm);
    setIsBirthdayFormOpen(true);
    setBirthdayMessage("");
    setBirthdayError("");
  }

  async function saveBirthday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingMemberId(birthdayForm.id ?? "new");
    setBirthdayMessage("");
    setBirthdayError("");

    try {
      const result = await onSaveMember({
        id: birthdayForm.id,
        firstName: birthdayForm.firstName,
        lastInitial: birthdayForm.lastInitial,
        birthdayMonth: birthdayForm.birthdayMonth ? Number(birthdayForm.birthdayMonth) : null,
        birthdayDay: birthdayForm.birthdayDay ? Number(birthdayForm.birthdayDay) : null,
        instagramHandle: birthdayForm.instagramHandle
      });

      if (result.source === "fallback" && isPersistenceConfigured) {
        setBirthdayError("Birthday could not be saved to the shared records.");
      } else {
        setBirthdayMessage(result.source === "supabase" ? "Birthday saved." : "Birthday saved for this browser session.");
        setBirthdayForm(emptyBirthdayForm);
        setIsBirthdayFormOpen(false);
      }
    } catch (error) {
      const validation = error as { errors?: Record<string, string> };
      setBirthdayError(Object.values(validation.errors ?? {})[0] ?? "Birthday could not be saved.");
    } finally {
      setSavingMemberId(null);
    }
  }

  async function deleteBirthday(member: MemberRecord) {
    if (!window.confirm(`Delete ${formatMemberName(member)} from birthday management?`)) return;

    setSavingMemberId(member.id);
    setBirthdayMessage("");
    setBirthdayError("");

    try {
      const result = await onDeleteMember(member);
      if (result.source === "fallback" && isPersistenceConfigured) {
        setBirthdayError("Birthday could not be deleted from the shared records.");
      } else {
        setBirthdayMessage(result.source === "supabase" ? "Birthday deleted." : "Birthday deleted for this browser session.");
        if (birthdayForm.id === member.id) setBirthdayForm(emptyBirthdayForm);
        if (birthdayForm.id === member.id) setIsBirthdayFormOpen(false);
      }
    } catch (error) {
      console.warn("[operations] Unable to delete birthday.", error);
      setBirthdayError("Birthday could not be deleted.");
    } finally {
      setSavingMemberId(null);
    }
  }

  return (
    <PageContainer>
      <div className="page-title">
        <span>Operations</span>
        <h1>Branch operations overview</h1>
      </div>
      <div className="module-grid module-grid--wide-left">
        <DashboardCard className="span-all">
          <SectionHeader title="Branch Metrics" />
          <div className="metrics-grid metrics-grid--operations">
            {metrics.map((metric) => (
              <article className="metric-tile" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <SectionHeader title="Shared Accounts" />
          <p className="card-note operations-card-note">Operational accounts used by branch leadership.</p>
          <div className="account-list">
            {sharedAccounts.map((account) => (
              <SharedAccountRow
                account={account}
                key={account.id}
                onOpenCredentials={(account) => {
                  setSelectedAccount(account);
                  setCredentialMessage("");
                }}
              />
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <SectionHeader
            title="Annual Branch Report"
            action={(
              <label className="report-year-select">
                <span className="sr-only">Report year</span>
                <SelectInput value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                  {reportYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </SelectInput>
              </label>
            )}
          />
          {isLoading ? (
            <EmptyState title="Loading branch report" message="Checking the shared event source." />
          ) : (
            <AnnualReportSummary report={annualReport} />
          )}
        </DashboardCard>

        <DashboardCard className="span-all">
          <SectionHeader
            title="Birthday Management"
            action={isBirthdayFormOpen ? (
              <Button type="button" variant="ghost" onClick={resetBirthdayForm}>Cancel</Button>
            ) : (
              <Button type="button" variant="secondary" onClick={openNewBirthdayForm}>+ Add Birthday</Button>
            )}
          />
          {isBirthdayFormOpen ? (
            <form className="form-grid birthday-management-form" onSubmit={saveBirthday}>
              <FormField label="First Name" htmlFor="birthday-first-name">
                <TextInput
                  id="birthday-first-name"
                  value={birthdayForm.firstName}
                  onChange={(event) => updateBirthdayForm("firstName", event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Last Initial" htmlFor="birthday-last-initial">
                <TextInput
                  id="birthday-last-initial"
                  value={birthdayForm.lastInitial}
                  maxLength={2}
                  onChange={(event) => updateBirthdayForm("lastInitial", event.target.value)}
                />
              </FormField>
              <FormField label="Month" htmlFor="birthday-month">
                <SelectInput
                  id="birthday-month"
                  value={birthdayForm.birthdayMonth}
                  onChange={(event) => updateBirthdayForm("birthdayMonth", event.target.value)}
                >
                  {monthOptions.map((month) => <option key={month.value || "empty"} value={month.value}>{month.label}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Day" htmlFor="birthday-day">
                <TextInput
                  id="birthday-day"
                  type="number"
                  min="1"
                  max="31"
                  inputMode="numeric"
                  value={birthdayForm.birthdayDay}
                  onChange={(event) => updateBirthdayForm("birthdayDay", event.target.value)}
                />
              </FormField>
              <FormField label="Instagram" htmlFor="birthday-instagram">
                <TextInput
                  id="birthday-instagram"
                  value={birthdayForm.instagramHandle}
                  onChange={(event) => updateBirthdayForm("instagramHandle", event.target.value)}
                  placeholder="@handle"
                />
              </FormField>
              <div className="form-actions birthday-management-actions">
                <Button type="submit" variant="primary" disabled={savingMemberId === (birthdayForm.id ?? "new")}>
                  {savingMemberId === (birthdayForm.id ?? "new") ? "Saving..." : birthdayForm.id ? "Save Birthday" : "Add Birthday"}
                </Button>
                {birthdayForm.id ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const selectedMember = memberRecords.find((member) => member.id === birthdayForm.id);
                      if (selectedMember) void deleteBirthday(selectedMember);
                    }}
                    disabled={savingMemberId === birthdayForm.id}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}
          {sortedMembers.length > 0 ? (
            <section className="birthday-list-panel" aria-labelledby="birthday-list-title">
              <div className="birthday-list-header">
                <div>
                  <h3 id="birthday-list-title">Birthday List</h3>
                  <p>Grouped to keep member birthdays easy to scan and maintain.</p>
                </div>
              </div>
              {birthdayGroups.length > 0 ? (
                <div className="birthday-month-groups">
                  {birthdayGroups.map((group) => {
                    const isExpanded = expandedBirthdayMonth === group.month;
                    const visibleMembers = group.members.slice(0, visibleBirthdayCount);
                    const hiddenCount = group.members.length - visibleMembers.length;

                    return (
                      <section className="birthday-month-group" key={group.month}>
                        <button
                          className="birthday-month-header"
                          type="button"
                          onClick={() => toggleBirthdayMonth(group.month)}
                          aria-expanded={isExpanded}
                        >
                          <span>{group.label}</span>
                          <em>{group.members.length} {group.members.length === 1 ? "birthday" : "birthdays"} · {isExpanded ? "Collapse" : "Expand"}</em>
                        </button>
                        {isExpanded ? (
                          <>
                            <div className="birthday-management-list">
                              {visibleMembers.map((member) => (
                                <button className="birthday-management-row" type="button" key={member.id} onClick={() => editMember(member)}>
                                  <span>
                                    <strong>{formatMemberName(member)}</strong>
                                    <em>{formatBirthday(member)}{member.instagramHandle ? ` · ${member.instagramHandle}` : ""}</em>
                                  </span>
                                </button>
                              ))}
                            </div>
                            {hiddenCount > 0 ? (
                              <Button type="button" variant="ghost" onClick={() => setVisibleBirthdayCount((current) => current + birthdayPageSize)}>
                                Load More
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                      </section>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No birthdays have been added." />
              )}
            </section>
          ) : (
            <EmptyState title="No birthdays have been added." />
          )}
          {birthdayMessage ? <p className="form-status form-status--success">{birthdayMessage}</p> : null}
          {birthdayError ? <p className="form-status form-status--error">{birthdayError}</p> : null}
        </DashboardCard>
      </div>
      {selectedAccount ? (
        <CredentialsModal
          account={selectedAccount}
          message={credentialMessage}
          onCopy={async (label, value) => {
            const copied = await copyToClipboard(value);
            setCredentialMessage(copied ? `${label} copied.` : `${label} could not be copied.`);
          }}
          onClose={() => {
            setSelectedAccount(null);
            setCredentialMessage("");
          }}
        />
      ) : null}
    </PageContainer>
  );
}

function SharedAccountRow({
  account,
  onOpenCredentials
}: {
  account: SharedAccount;
  onOpenCredentials: (account: SharedAccount) => void;
}) {
  const hasUrl = Boolean(account.url);
  const hasCredentials = hasSavedCredentials(account);
  const isConfigured = hasUrl || hasCredentials;

  return (
    <article className="account-row">
      <Icon name={account.icon} />
      <span className="account-row__details">
        <strong>{account.service}</strong>
        {account.username ? <em>{account.username}</em> : null}
        {!account.username && !isConfigured ? <em>Not Configured</em> : null}
        {account.lastUpdated ? <small>Updated {formatDate(account.lastUpdated)}</small> : null}
      </span>
      <div className="account-row__actions">
        <StatusChip
          label={isConfigured ? "Configured" : "Not Configured"}
          tone={isConfigured ? "success" : "neutral"}
        />
        {hasUrl ? (
          <a className="button button--secondary" href={account.url} target="_blank" rel="noreferrer">
            Open
          </a>
        ) : (
          <Button type="button" variant="secondary" disabled title="No account URL has been saved.">
            Open
          </Button>
        )}
        {hasCredentials ? (
          <Button type="button" variant="ghost" onClick={() => onOpenCredentials(account)}>
            Credentials
          </Button>
        ) : (
          <Button type="button" variant="ghost" disabled title="No credentials have been saved.">
            Credentials
          </Button>
        )}
      </div>
    </article>
  );
}

function hasSavedCredentials(account: SharedAccount) {
  return Boolean(account.username || account.password);
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (error) {
    console.warn("[operations] Unable to copy credential.", error);
    return false;
  }
}

function CredentialsModal({
  account,
  message,
  onCopy,
  onClose
}: {
  account: SharedAccount;
  message: string;
  onCopy: (label: string, value: string) => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="preview-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="credentials-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credentials-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="credentials-modal__header">
          <span>Vault</span>
          <h2 id="credentials-modal-title">{account.service}</h2>
          <p>Credentials are hidden from the account list and only shown here for founder use.</p>
        </div>
        <div className="credentials-list">
          {account.username ? (
            <CredentialRow label="Username" value={account.username} onCopy={onCopy} />
          ) : null}
          {account.password ? (
            <CredentialRow label="Password" value={account.password} secret onCopy={onCopy} />
          ) : null}
        </div>
        {message ? <p className="form-status form-status--success">{message}</p> : null}
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </section>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  secret = false,
  onCopy
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: (label: string, value: string) => void | Promise<void>;
}) {
  return (
    <article className="credential-row">
      <span>
        <em>{label}</em>
        <strong>{secret ? "••••••••••••" : value}</strong>
      </span>
      <Button type="button" variant="secondary" onClick={() => onCopy(label, value)}>
        Copy
      </Button>
    </article>
  );
}

function AnnualReportSummary({ report }: { report: AnnualBranchReport }) {
  const rows = [
    { label: "Total Rides", value: report.totalRides },
    { label: "Meet & Greets", value: report.meetAndGreets },
    { label: "Collaborations", value: report.collaborations },
    { label: "Beginner Rides", value: report.beginnerRides },
    { label: "Estimated Riders", value: report.estimatedRiders },
    { label: "New Members", value: report.newMembers },
    { label: "Charity Events", value: report.charityEvents },
    { label: "Partner Businesses", value: report.partnerBusinesses }
  ];

  return (
    <div className="report-list">
      {rows.map((row) => (
        <article className="report-row" key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </article>
      ))}
    </div>
  );
}

function getBirthdayGroups(members: MemberRecord[]) {
  const groups = new Map<string, MemberRecord[]>();
  monthOptions
    .filter((month) => month.value)
    .forEach((month) => groups.set(month.value, []));
  groups.set("unscheduled", []);

  members.forEach((member) => {
    const key = member.birthdayMonth ? String(member.birthdayMonth) : "unscheduled";
    groups.set(key, [...(groups.get(key) ?? []), member]);
  });

  return Array.from(groups.entries())
    .map(([month, groupMembers]) => ({
      month,
      label: month === "unscheduled" ? "Needs Date" : monthOptions[Number(month)].label,
      members: groupMembers.sort(compareBirthdayMembers)
    }))
    .sort((a, b) => getBirthdayGroupSortValue(a.month) - getBirthdayGroupSortValue(b.month));
}

function getBirthdayGroupSortValue(month: string) {
  if (month === "unscheduled") return 13;
  return Number(month);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function formatMemberName(member: MemberRecord) {
  return member.lastInitial ? `${member.firstName} ${member.lastInitial}` : member.firstName;
}

function formatBirthday(member: MemberRecord) {
  if (!member.birthdayMonth || !member.birthdayDay) return "Birthday not set";
  return `${monthOptions[member.birthdayMonth].label} ${member.birthdayDay}`;
}

function compareBirthdayMembers(a: MemberRecord, b: MemberRecord) {
  const monthA = a.birthdayMonth ?? 13;
  const monthB = b.birthdayMonth ?? 13;
  if (monthA !== monthB) return monthA - monthB;

  const dayA = a.birthdayDay ?? 32;
  const dayB = b.birthdayDay ?? 32;
  if (dayA !== dayB) return dayA - dayB;

  return a.firstName.localeCompare(b.firstName);
}
