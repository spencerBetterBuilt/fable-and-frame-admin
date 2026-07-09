export function formatSlotDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatSlotTimeRange(startTime: string, durationMin: number) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date(2000, 0, 1, hours, minutes);
  const end = new Date(start.getTime() + durationMin * 60000);
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
