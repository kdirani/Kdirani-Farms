import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'معرف الفاتورة مطلوب' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // جلب بيانات الفاتورة
    const { data: invoice, error } = await supabase
      .from('medicine_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        invoice_time,
        warehouse_id,
        poultry_status_id,
        total_value,
        notes,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching medicine invoice:', error);
      return NextResponse.json(
        { error: 'فشل في جلب بيانات الفاتورة' },
        { status: 500 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: 'لم يتم العثور على الفاتورة' },
        { status: 404 }
      );
    }

    // جلب معلومات المستودع
    let warehouseInfo = undefined;
    if (invoice.warehouse_id) {
      const { data: warehouse } = await supabase
        .from('warehouses')
        .select(`
          name,
          farms (name)
        `)
        .eq('id', invoice.warehouse_id)
        .single();

      if (warehouse) {
        warehouseInfo = {
          name: warehouse?.name || 'غير معروف',
          farm_name: warehouse?.farms?.[0]?.name || 'مزرعة غير معروفة',
        };
      }
    }

    // جلب معلومات حالة الدواجن
    let poultryStatusInfo = undefined;
    if (invoice.poultry_status_id) {
      const { data: poultryStatus } = await supabase
        .from('poultry_statuses')
        .select('status_name')
        .eq('id', invoice.poultry_status_id)
        .single();

      if (poultryStatus) {
        poultryStatusInfo = {
          status_name: poultryStatus.status_name,
        };
      }
    }

    // إضافة معلومات المستودع وحالة الدواجن إلى الفاتورة
    const enrichedInvoice = {
      ...invoice,
      warehouse: warehouseInfo,
      poultry_status: poultryStatusInfo,
    };

    return NextResponse.json(enrichedInvoice);
  } catch (error) {
    console.error('Error in medicine invoice API:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}