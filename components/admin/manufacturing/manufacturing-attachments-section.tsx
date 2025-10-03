'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getManufacturingAttachments, deleteManufacturingAttachment, ManufacturingAttachment } from '@/actions/manufacturing-attachment.actions';
import { FileIcon, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ManufacturingAttachmentsSectionProps {
  invoiceId: string;
}

export function ManufacturingAttachmentsSection({ invoiceId }: ManufacturingAttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<ManufacturingAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAttachments();
  }, [invoiceId]);

  const loadAttachments = async () => {
    setIsLoading(true);
    const result = await getManufacturingAttachments(invoiceId);
    if (result.success && result.data) {
      setAttachments(result.data);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المرفق؟')) return;

    setDeletingId(id);
    const result = await deleteManufacturingAttachment(id);
    
    if (result.success) {
      toast.success('تم حذف المرفق بنجاح');
      loadAttachments();
    } else {
      toast.error(result.error || 'فشل في حذف المرفق');
    }
    setDeletingId(null);
  };

  const isImage = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المرفقات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المرفقات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            لم يتم العثور على مرفقات
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>المرفقات ({attachments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50"
            >
              {isImage(attachment.file_type) ? (
                <div className="relative w-16 h-16 rounded overflow-hidden bg-background">
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded bg-background flex items-center justify-center">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attachment.file_type}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.file_name}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deletingId === attachment.id}
                >
                  {deletingId === attachment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
