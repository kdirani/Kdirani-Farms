import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner مع تأثير النبض */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        
        {/* Loading Text */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-base font-medium text-foreground animate-pulse">
            جاري التحميل...
          </p>
        </div>
      </div>
    </div>
  );
}
