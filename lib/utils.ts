import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: string | Date): string {
  if (!time) return "";
  const d = typeof time === "string" ? new Date(`1970-01-01T${time}`) : time;
  return d.toLocaleTimeString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency: "IQD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat("ar-IQ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function generateInvoiceNumber(prefix: string = "INV"): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function safeParseFloat(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
}

export function safeParseInt(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = typeof value === "string" ? parseInt(value, 10) : value;
  return isNaN(parsed) ? 0 : parsed;
}
