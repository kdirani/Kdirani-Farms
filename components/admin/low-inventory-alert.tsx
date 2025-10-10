'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LowInventoryItem {
  id: string;
  current_balance: number;
  materials_names: {
    material_name: string;
  };
  warehouses: {
    name: string;
  };
}

interface LowInventoryAlertProps {
  initialData?: LowInventoryItem[];
  initialTotal?: number;
}

export function LowInventoryAlert({ initialData = [], initialTotal = 0 }: LowInventoryAlertProps) {
  const [items, setItems] = useState<LowInventoryItem[]>(initialData);
  const [totalItems, setTotalItems] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const itemsPerPage = 5;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const fetchItems = async (page: number) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const offset = (page - 1) * itemsPerPage;
      
      const { data, count, error } = await supabase
        .from('materials')
        .select(`
          id,
          current_balance,
          materials_names (
            material_name
          ),
          warehouses (
            name
          )
        `, { count: 'exact' })
        .lt('current_balance', 100)
        .order('current_balance', { ascending: true })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        console.error('Error fetching low inventory items:', error);
        return;
      }

      // Transform the data to match the interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        current_balance: item.current_balance,
        materials_names: Array.isArray(item.materials_names) 
          ? item.materials_names[0] 
          : item.materials_names,
        warehouses: Array.isArray(item.warehouses) 
          ? item.warehouses[0] 
          : item.warehouses,
      }));

      setItems(transformedData);
      setTotalItems(count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchItems(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchItems(currentPage + 1);
    }
  };

  // Don't show the component if there are no low inventory items
  if (totalItems === 0) {
    return null;
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          تنبيه: مواد منخفضة في المخزون
        </CardTitle>
        <CardDescription>
          المواد التالية أقل من الحد الأدنى المطلوب ({totalItems} مادة)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              <span className="mr-2 text-red-600">جاري التحميل...</span>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-red-900">
                    {item.materials_names?.material_name || "مادة"}
                  </p>
                  <p className="text-sm text-red-700">
                    المستودع: {item.warehouses?.name || "غير محدد"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {item.current_balance?.toLocaleString("ar-IQ", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-red-200">
            <div className="text-sm text-red-700">
              صفحة {currentPage} من {totalPages} ({totalItems} مادة)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoading}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
