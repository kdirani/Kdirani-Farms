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

