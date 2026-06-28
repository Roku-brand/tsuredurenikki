export function toDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function formatJapaneseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthBounds(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(year, monthIndex - 1, 1);
  const end = new Date(year, monthIndex, 0);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end)
  };
}

export function addMonths(month: string, amount: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + amount, 1);
  return monthKey(date);
}

export function daysInCalendarMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(year, monthIndex - 1, 1);
  const last = new Date(year, monthIndex, 0);
  const days: Array<{ date: string; inMonth: boolean }> = [];

  for (let i = 0; i < first.getDay(); i += 1) {
    const date = new Date(year, monthIndex - 1, 1 - (first.getDay() - i));
    days.push({ date: toDateInputValue(date), inMonth: false });
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    days.push({ date: toDateInputValue(new Date(year, monthIndex - 1, day)), inMonth: true });
  }

  while (days.length % 7 !== 0) {
    const date = new Date(year, monthIndex - 1, last.getDate() + (days.length % 7));
    days.push({ date: toDateInputValue(date), inMonth: false });
  }

  return days;
}
