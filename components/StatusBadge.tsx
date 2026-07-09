const LABELS: Record<string, string> = {
  inquired: "Inquired",
  booked: "Booked",
  paid: "Paid",
  contract_sent: "Contract Sent",
  shot: "Shot",
  delivered: "Delivered",
  pending: "Pending",
  failed: "Failed",
  not_sent: "Not Sent",
  sent: "Sent",
  signed: "Signed",
};

const TONES: Record<string, string> = {
  inquired: "bg-ivory-deep text-ink",
  booked: "bg-dusty-blue/30 text-dusty-blue-deep",
  paid: "bg-sage/30 text-sage-deep",
  contract_sent: "bg-dusty-blue/30 text-dusty-blue-deep",
  shot: "bg-sage/30 text-sage-deep",
  delivered: "bg-ink text-ivory",
  pending: "bg-ivory-deep text-ink",
  failed: "bg-ink/10 text-ink",
  not_sent: "bg-ivory-deep text-ink",
  sent: "bg-dusty-blue/30 text-dusty-blue-deep",
  signed: "bg-sage/30 text-sage-deep",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? "bg-ivory-deep text-ink";
  const label = LABELS[status] ?? status;
  return (
    <span
      className={`inline-block font-body text-xs uppercase tracking-[0.06em] px-2.5 py-1 rounded-none ${tone}`}
    >
      {label}
    </span>
  );
}
