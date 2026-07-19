export const numberFormatter = new Intl.NumberFormat("en-IE");

const dateTimeFormatter = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Dublin",
  timeZoneName: "short",
});

const dateFormatter = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Dublin",
});

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date) {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
