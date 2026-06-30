import type { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  id?: string;
}

export function DashboardCard({ children, className = "", ariaLabel, id }: DashboardCardProps) {
  return (
    <section className={`dashboard-card ${className}`.trim()} aria-label={ariaLabel} id={id}>
      {children}
    </section>
  );
}
