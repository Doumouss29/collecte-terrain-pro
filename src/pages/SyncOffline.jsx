import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wifi, WifiOff, Cloud, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { useOfflineSync } from '@/components/offline/useOfflineSync';
import { toast } from 'sonner';
import OfflineIndicator from '@/components/offline/OfflineIndicator';

export default function SyncOffline() {
  const navigate = useNavigate();
  const { isOnline, pendingCount, isSyncing, syncError, syncCollectes, offlineStorage } = useOfflineSync();
  const [collectes, setCollectes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollectes();
  }, []);

  const loadCollectes = async () => {
    setIsLoading(true);
    try {
      const all = await offlineStorage.getAllCollectes();
      setCollectes(all);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    const result = await syncCollectes();
    if (result.success) {
      toast.success(result.message);
      setTimeout(() => loadCollectes(), 1000);
    } else {
      toast.error(`Erreur: ${result.error?.message || 'Synchronisation échouée'}`);
    }
  };

  const handleDelete = async (localId) => {
    try {
      await offlineStorage.deleteCollecte(localId);
      await loadCollectes();
      toast.success('Collecte supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const pendingCollectes = collectes.filter(c => c.status === 'pending');
  const syncedCollectes = collectes.filter(c => c.status === 'synced');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8">
      <OfflineIndicator
        isOnline={isOnline}
        pendingCount={0}
        isSyncing={false}
        syncError={null}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(createPageUrl('MesCollectes'))}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <h1 className="text-2xl font-bold">Gestion Hors Ligne</h1>
          <p className="text-blue-200 mt-1">Synchronisez vos collectes avec le serveur</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Status */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-slate-600">État de connexion</p>
                <p className="font-semibold text-slate-800 mt-1">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </p>
              </div>

              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Cloud className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-sm text-slate-600">En attente</p>
                <p className="font-semibold text-slate-800 mt-1">{pendingCollectes.length}</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-slate-600">Synchronisées</p>
                <p className="font-semibold text-slate-800 mt-1">{syncedCollectes.length}</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Cloud className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="font-semibold text-slate-800 mt-1">{collectes.length}</p>
              </div>
            </div>

            {syncError && (
              <div className="mt-4 flex items-start gap-3 bg-red-50 p-4 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Erreur de synchronisation</p>
                  <div className="text-sm text-red-700 mt-2 space-y-1">
                    {syncError.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isOnline && pendingCollectes.length > 0 && (
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-12"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Synchronisation en cours...
                  </>
                ) : (
                  <>
                    <Cloud className="w-5 h-5 mr-2" />
                    Synchroniser {pendingCollectes.length} collecte{pendingCollectes.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Collectes en attente */}
        {pendingCollectes.length > 0 && (
          <Card className="border-0 shadow-md mb-6">
            <CardHeader className="bg-amber-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-amber-600" />
                Collectes en attente de synchronisation ({pendingCollectes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                </div>
              ) : (
                <div className="divide-y">
                  {pendingCollectes.map((collecte) => (
                    <div key={collecte.localId} className="p-4 flex items-start justify-between hover:bg-slate-50">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{collecte.commune || 'Sans commune'}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {collecte.quartier && `${collecte.quartier} • `}
                          {collecte.parcelle && `Parcelle ${collecte.parcelle}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Sauvegardée le {format(new Date(collecte.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(collecte.localId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Collectes synchronisées */}
        {syncedCollectes.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Collectes synchronisées ({syncedCollectes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {syncedCollectes.map((collecte) => (
                   <div key={collecte.localId} className="p-4 flex items-start justify-between hover:bg-slate-50">
                     <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <p className="font-semibold text-slate-800">{collecte.commune || 'Sans commune'}</p>
                         <Badge className="bg-green-100 text-green-800 text-xs">Synchronisée</Badge>
                       </div>
                       <p className="text-sm text-slate-500 mt-1">
                         {collecte.quartier && `${collecte.quartier} • `}
                         {collecte.parcelle && `Parcelle ${collecte.parcelle}`}
                       </p>
                       <p className="text-xs text-slate-400 mt-2">
                         ID serveur: {collecte.serverId}
                       </p>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => handleDelete(collecte.localId)}
                       className="text-red-500 hover:text-red-700 hover:bg-red-50"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        )}

        {collectes.length === 0 && !isLoading && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Cloud className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune collecte hors ligne</h3>
              <p className="text-slate-500">
                Les collectes créées hors ligne apparaîtront ici pour synchronisation ultérieure
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}