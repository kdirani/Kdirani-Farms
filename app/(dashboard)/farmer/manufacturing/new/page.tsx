import { Metadata } from 'next';
import { FarmerManufacturingForm } from '@/components/farmer/invoices/farmer-manufacturing-form';

export const metadata: Metadata = {
  title: 'إنشاء فاتورة تصنيع جديدة',
  description: 'إنشاء فاتورة تصنيع جديدة للمزرعة',
};

export default function NewFarmerManufacturingPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">إنشاء فاتورة تصنيع جديدة</h1>
      </div>
      <FarmerManufacturingForm />
    </div>
  );
}