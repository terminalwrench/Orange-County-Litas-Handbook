import type { StatusTone } from "../../types";
import { Icon } from "./Icon";

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  withIcon?: boolean;
}

export function StatusChip({ label, tone = "neutral", withIcon = false }: StatusChipProps) {
  return (
    <span className={`status-chip status-chip--${tone}`}>
      {withIcon ? <Icon name="check" /> : null}
      {label}
    </span>
  );
}
