import { Metadata } from 'next';
import { FarmerInvoiceForm } from '@/components/farmer/invoices/farmer-invoice-form';

export const metadata: Metadata = {
  title: 'إنشاء فاتورة بيع وشراء جديدة',
  description: 'إنشاء فاتورة بيع وشراء جديدة للمزرعة',
};

export default function NewFarmerInvoicePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">إنشاء فاتورة بيع وشراء جديدة</h1>
      </div>
      <FarmerInvoiceForm />
    </div>
  );
}