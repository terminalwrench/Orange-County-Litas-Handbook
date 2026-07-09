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
  const metrics = getBranchMetrics(eventRecords, {
    memberCount: memberRecords.length,
    today
  });
  const sharedAccounts = getSharedAccounts();
  const annualReport = getAnnualBranchReport(eventRecords, selectedYear);
  const sortedMembers = [...memberRecords].sort(compareBirthdayMembers);

  function editMember(member: MemberRecord) {
    setBirthdayForm({
      id: member.id,
      firstName: member.firstName,
      lastInitial: member.lastInitial ?? "",
      birthdayMonth: member.birthdayMonth ? String(member.birthdayMonth) : "",
      birthdayDay: member.birthdayDay ? String(member.birthdayDay) : "",
      instagramHandle: member.instagramHandle ?? ""
    });
    setBirthdayMessage("");
    setBirthdayError("");
  }

  function resetBirthdayForm() {
    setBirthdayForm(emptyBirthdayForm);
    setBirthdayMessage("");
    setBirthdayError("");
  }

  function updateBirthdayForm(field: keyof typeof emptyBirthdayForm, value: string) {
    setBirthdayForm((current) => ({ ...current, [field]: value }));
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
              <SharedAccountRow account={account} key={account.id} />
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
            action={birthdayForm.id ? <Button type="button" variant="ghost" onClick={resetBirthdayForm}>Cancel Edit</Button> : null}
          />
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
            </div>
          </form>
          {sortedMembers.length > 0 ? (
            <div className="birthday-management-list">
              {sortedMembers.map((member) => (
                <article className="birthday-management-row" key={member.id}>
                  <span>
                    <strong>{formatMemberName(member)}</strong>
                    <em>{formatBirthday(member)}{member.instagramHandle ? ` · ${member.instagramHandle}` : ""}</em>
                  </span>
                  <div className="record-row__actions">
                    <Button type="button" variant="secondary" onClick={() => editMember(member)}>Edit</Button>
                    <Button type="button" variant="ghost" onClick={() => deleteBirthday(member)} disabled={savingMemberId === member.id}>
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No birthdays have been added." />
          )}
          {birthdayMessage ? <p className="form-status form-status--success">{birthdayMessage}</p> : null}
          {birthdayError ? <p className="form-status form-status--error">{birthdayError}</p> : null}
        </DashboardCard>
      </div>
    </PageContainer>
  );
}

function SharedAccountRow({ account }: { account: SharedAccount }) {
  return (
    <article className="account-row">
      <Icon name={account.icon} />
      <span className="account-row__details">
        <strong>{account.service}</strong>
        <em>{account.username ?? "Not Configured"}</em>
        {account.lastUpdated ? <small>Updated {formatDate(account.lastUpdated)}</small> : null}
      </span>
      <StatusChip
        label={account.configured ? "Configured" : "Not Configured"}
        tone={account.configured ? "success" : "neutral"}
      />
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
