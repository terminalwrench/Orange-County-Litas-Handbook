import { useMemo, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { DashboardCard } from "../components/ui/DashboardCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { SectionHeader } from "../components/ui/SectionHeader";
import { SelectInput } from "../components/ui/inputs";
import { StatusChip } from "../components/ui/StatusChip";
import type { AnnualBranchReport, EventRecord, SharedAccount } from "../types";
import { getBirthdays } from "../services/birthdaysService";
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

interface OperationsProps {
  eventRecords: EventRecord[];
  isLoading: boolean;
}

export function Operations({ eventRecords, isLoading }: OperationsProps) {
  const today = new Date();
  const reportYears = useMemo(() => getAvailableReportYears(eventRecords), [eventRecords]);
  const [selectedYear, setSelectedYear] = useState(reportYears[0] ?? today.getFullYear());
  const metrics = getBranchMetrics(eventRecords, {
    memberCount: getBirthdays().length,
    today
  });
  const sharedAccounts = getSharedAccounts();
  const annualReport = getAnnualBranchReport(eventRecords, selectedYear);

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
