import { notFound, redirect } from 'next/navigation';
import { getInvoiceByIdForFarmer } from '@/actions/invoice.actions';

interface PageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default async function Page({ params }: PageProps) {
  // تحويل المستخدم إلى صفحة الفواتير الرئيسية
  redirect('/farmer/invoices');
}