type MonthFormat = "short" | "long";

export function formatMonth(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${year} ${month}`;
}
export function formatYear(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  return `${year}`;
}

export function formatWeek(date: string, monthFormat: MonthFormat = "short"): string {
  const start = new Date(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const year = start.getFullYear();
  const monthStart = start.toLocaleString("en-US", { month: monthFormat });
  const dayStart = start.getDate();
  const monthEnd = end.toLocaleString("en-US", { month: monthFormat });
  const dayEnd = end.getDate();

  if (monthStart === monthEnd) {
    return `${year} ${monthStart} ${dayStart} -> ${dayEnd}`;
  } else {
    return `${year} ${monthStart} ${dayStart} -> ${monthEnd} ${dayEnd}`;
  }
}

export function bisectLeft(a: string[], x: string): number {
  let left = 0;
  let right = a.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (a[mid] < x) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}

export function bisectRight(a: string[], x: string): number {
  let left = 0;
  let right = a.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (a[mid] <= x) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}
