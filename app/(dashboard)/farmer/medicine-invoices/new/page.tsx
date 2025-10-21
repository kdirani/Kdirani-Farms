import { Metadata } from 'next';
import { FarmerMedicineInvoiceForm } from '@/components/farmer/invoices/farmer-medicine-invoice-form';

export const metadata: Metadata = {
  title: 'إنشاء فاتورة أدوية جديدة',
  description: 'إنشاء فاتورة أدوية جديدة للمزرعة',
};

export default function NewFarmerMedicineInvoicePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">إنشاء فاتورة أدوية جديدة</h1>
      </div>
      <FarmerMedicineInvoiceForm />
    </div>
  );
}