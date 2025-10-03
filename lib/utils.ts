import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تحويل كائن التاريخ إلى سلسلة نصية بتنسيق "YYYY-MM-DD HH:MM:SS"
 * @param date كائن التاريخ المراد تنسيقه
 * @returns سلسلة نصية بتنسيق "YYYY-MM-DD HH:MM:SS"
 */
export function formatDate(date: Date): string {
  // التأكد من أن المعامل هو كائن تاريخ صالح
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  // استخراج مكونات التاريخ
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");


  // إنشاء السلسلة النصية بالتنسيق المطلوب
  return `${day}/${month}/${year}`;
}

/**
 * تحويل كائن التاريخ إلى سلسلة نصية للوقت بتنسيق "HH:MM"
 * @param date كائن التاريخ المراد تنسيقه
 * @returns سلسلة نصية بتنسيق "HH:MM"
 */
export function formatTime(date: Date): string {
  // التأكد من أن المعامل هو كائن تاريخ صالح
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  // استخراج مكونات الوقت
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // إنشاء السلسلة النصية بالتنسيق المطلوب
  return `${hours}:${minutes}`;
}

/**
 * تحويل كائن التاريخ إلى سلسلة نصية بتنسيق "YYYY-MM-DD HH:MM:SS"
 * @param date كائن التاريخ المراد تنسيقه
 * @returns سلسلة نصية بتنسيق "YYYY-MM-DD HH:MM:SS"
 */
export function formatDateTime(date: Date): string {
  // التأكد من أن المعامل هو كائن تاريخ صالح
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const dateStr = formatDate(date);
  const timeStr = formatTime(date);

  return `${dateStr} ${timeStr}`;
}

/**
 * تنسيق المبلغ المالي بالعملة المحددة
 * @param amount المبلغ المراد تنسيقه
 * @param currency رمز العملة (افتراضي: USD)
 * @returns سلسلة نصية منسقة بالعملة
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // التأكد من أن المبلغ رقم صالح
  if (typeof amount !== 'number' || isNaN(amount)) {
    return "0";
  }

  // تحديد رمز العملة
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'SAR': 'ر.س',
    'EUR': '€',
    'GBP': '£',
  };

  const symbol = currencySymbols[currency] || currency;

  // تنسيق الرقم
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // إرجاع المبلغ مع رمز العملة
  return currency === 'USD' ? `${symbol}${formattedAmount}` : `${formattedAmount} ${symbol}`;
}

