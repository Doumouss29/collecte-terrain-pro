import React from 'react';
import { Wifi, WifiOff, Cloud, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function OfflineIndicator({
  isOnline,
  pendingCount,
  isSyncing,
  syncError,
  onSync
}) {
  if (!isOnline && !pendingCount) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <Badge className="bg-red-100 text-red-800 flex items-center gap-2 px-3 py-2">
          <WifiOff className="w-4 h-4" />
          Hors ligne
        </Badge>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs border border-amber-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Cloud className={cn(
                "w-5 h-5 mt-0.5 flex-shrink-0",
                isOnline ? "text-blue-600" : "text-orange-600"
              )} />
              <div>
                <p className="font-semibold text-slate-800">
                  {pendingCount} collecte{pendingCount > 1 ? 's' : ''} en attente
                </p>
                <p className="text-sm text-slate-500">
                  {isOnline ? 'Prête à synchroniser' : 'Sauvegardée localement'}
                </p>
              </div>
            </div>
          </div>

          {syncError && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 p-2 rounded text-sm text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {isOnline && !isSyncing && (
            <Button
              onClick={onSync}
              size="sm"
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
            >
              Synchroniser maintenant
            </Button>
          )}

          {isSyncing && (
            <div className="mt-3 flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Synchronisation...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}