import { AlertTriangle } from "@/lib/icons";

export function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner" role="note">
      <AlertTriangle size={15} aria-hidden="true" />
      <strong>Research only</strong>
      <span>Research/education tool, not a diagnostic device. Association is not causation.</span>
    </div>
  );
}
