import type { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function DashboardCard({ children, className = "", ariaLabel }: DashboardCardProps) {
  return (
    <section className={`dashboard-card ${className}`.trim()} aria-label={ariaLabel}>
      {children}
    </section>
  );
}
