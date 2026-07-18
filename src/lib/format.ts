export const numberFormatter = new Intl.NumberFormat("en-IE");

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Dublin",
  }).format(new Date(value));
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
