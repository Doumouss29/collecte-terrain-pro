import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Building2,
  Users,
  Trash2,
  ChevronLeft,
  Loader2,
  UserPlus,
  UserMinus,
  MapPin,
  X,
  ShieldCheck,
  FileJson
} from 'lucide-react';
import CadastreManagerDialog from '@/components/cadastre/CadastreManagerDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';

export default function AdminOrganisations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isCommunesDialogOpen, setIsCommunesDialogOpen] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ nom: '', description: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('user');
  const [newCommune, setNewCommune] = useState('');
  const [isSuperviseurDialogOpen, setIsSuperviseurDialogOpen] = useState(false);
  const [selectedSuperviseur, setSelectedSuperviseur] = useState(null);
  const [superviseurCommune, setSuperviseurCommune] = useState('');
  const [isCadastreDialogOpen, setIsCadastreDialogOpen] = useState(false);
  const [selectedOrgForCadastre, setSelectedOrgForCadastre] = useState(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: organisations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => base44.entities.Organisation.list('-created_date'),
    enabled: !userLoading && user?.role === 'admin'
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !userLoading && user?.role === 'admin',
    refetchInterval: 5000 // Rafraîchir toutes les 5 secondes
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => base44.entities.Invitation.list(),
    enabled: !userLoading && user?.role === 'admin',
    refetchInterval: 5000 // Rafraîchir toutes les 5 secondes
  });

  const createOrgMutation = useMutation({
    mutationFn: (data) => base44.entities.Organisation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
      setIsCreateDialogOpen(false);
      setNewOrgData({ nom: '', description: '' });
      toast.success('Organisation créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    }
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (id) => base44.entities.Organisation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
      toast.success('Organisation supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, organisation_id }) => {
      await base44.users.inviteUser(email, 'user');
      // Créer une invitation en attente
      await base44.entities.Invitation.create({
        email,
        organisation_id,
        statut: 'en_attente'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setMemberEmail('');
      toast.success('Invitation envoyée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'invitation');
    }
  });

  const updateUserOrgMutation = useMutation({
   mutationFn: ({ userId, organisation_id }) =>
     base44.entities.User.update(userId, { organisation_id }),
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['allUsers'] });
     setMemberEmail('');
     toast.success('Membre mis à jour');
   },
   onError: () => {
     toast.error('Erreur lors de la mise à jour');
   }
  });

  const { data: allCollectes = [] } = useQuery({
   queryKey: ['collectes'],
   queryFn: () => base44.entities.Collecte.list(),
   enabled: !userLoading && user?.role === 'admin'
  });

  const reassignCollectesMutation = useMutation({
   mutationFn: async ({ userEmail, organisationId }) => {
     const userCollectes = allCollectes.filter(c => c.created_by === userEmail);
     for (const collecte of userCollectes) {
       await base44.entities.Collecte.update(collecte.id, { organisation_id: organisationId });
     }
     return userCollectes.length;
   },
   onSuccess: (count) => {
     queryClient.invalidateQueries({ queryKey: ['collectes'] });
     toast.success(`${count} collecte(s) réassignée(s) à l'organisation`);
   },
   onError: () => {
     toast.error('Erreur lors de la réassignation');
   }
  });

  const handleCreateOrg = () => {
    if (!newOrgData.nom) {
      toast.error('Le nom est obligatoire');
      return;
    }
    createOrgMutation.mutate(newOrgData);
  };

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role, communes_supervisees }) =>
      base44.entities.User.update(userId, { role, ...(communes_supervisees !== undefined ? { communes_supervisees } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Rôle mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour du rôle')
  });

  const handleAddMember = async () => {
    if (!memberEmail || !memberEmail.includes('@')) {
      toast.error('Email invalide');
      return;
    }
    
    const existingUser = allUsers.find(u => u.email === memberEmail);
    
    if (existingUser) {
      await updateUserOrgMutation.mutateAsync({ userId: existingUser.id, organisation_id: selectedOrg.id });
      if (memberRole !== 'user') {
        await updateUserRoleMutation.mutateAsync({ userId: existingUser.id, role: memberRole });
      }
      await reassignCollectesMutation.mutateAsync({ userEmail: existingUser.email, organisationId: selectedOrg.id });
    } else {
      inviteUserMutation.mutate({ email: memberEmail, organisation_id: selectedOrg.id });
    }
    setMemberRole('user');
  };

  const handleSetSuperviseurCommunes = (userId, communes) => {
    updateUserRoleMutation.mutate({ userId, role: 'superviseur', communes_supervisees: communes });
  };

  const handleRemoveMember = (userId) => {
   if (confirm('Voulez-vous vraiment retirer ce membre de l\'organisation ?')) {
     updateUserOrgMutation.mutate({ userId, organisation_id: null });
   }
  };

  const handleReassignCollectes = (memberEmail) => {
   if (confirm(`Réassigner toutes les collectes de ${memberEmail} à ${selectedOrg?.nom} ?`)) {
     reassignCollectesMutation.mutate({ userEmail: memberEmail, organisationId: selectedOrg.id });
   }
  };

  const getOrgMembers = (orgId) => {
    return allUsers.filter(u => u.organisation_id === orgId);
  };

  const getOrgInvitations = (orgId) => {
    return invitations.filter(i => i.organisation_id === orgId && i.statut === 'en_attente');
  };

  const updateOrgMutation = useMutation({
    mutationFn: ({ orgId, data }) => base44.entities.Organisation.update(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
      toast.success('Organisation mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const handleAddCommune = () => {
    if (!newCommune.trim()) {
      toast.error('Veuillez entrer un nom de commune');
      return;
    }
    const communes = selectedOrg.communes || [];
    if (communes.includes(newCommune.trim().toUpperCase())) {
      toast.error('Cette commune existe déjà');
      return;
    }
    updateOrgMutation.mutate({
      orgId: selectedOrg.id,
      data: { communes: [...communes, newCommune.trim().toUpperCase()] }
    });
    setNewCommune('');
  };

  const handleRemoveCommune = (commune) => {
    const communes = selectedOrg.communes || [];
    updateOrgMutation.mutate({
      orgId: selectedOrg.id,
      data: { communes: communes.filter(c => c !== commune) }
    });
  };

  if (userLoading || orgsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Accès refusé</h2>
        <p className="text-slate-600 mb-4">Seuls les administrateurs peuvent accéder à cette page</p>
        <Button onClick={() => navigate(createPageUrl('Accueil'))}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Button
            onClick={() => navigate(createPageUrl('Accueil'))}
            className="bg-white text-slate-900 hover:bg-gray-100 h-10 w-10 sm:h-10 sm:w-auto sm:px-4 p-0 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-center flex-1">Gestion des Organisations</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        {/* Bouton Créer */}
        <div className="mb-6 flex justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-800 hover:bg-blue-900">
                <Plus className="w-4 h-4 mr-2" />
                Créer une organisation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Organisation</DialogTitle>
                <DialogDescription>Créez une nouvelle organisation pour gérer vos équipes</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={newOrgData.nom}
                    onChange={(e) => setNewOrgData({ ...newOrgData, nom: e.target.value })}
                    placeholder="Nom de l'organisation"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newOrgData.description}
                    onChange={(e) => setNewOrgData({ ...newOrgData, description: e.target.value })}
                    placeholder="Description (optionnel)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateOrg} disabled={createOrgMutation.isPending}>
                  {createOrgMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des organisations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organisations.map((org) => {
            const members = getOrgMembers(org.id);
            const pendingInvitations = getOrgInvitations(org.id);
            return (
              <Card key={org.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5 text-blue-800" />
                    {org.nom}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {org.description && (
                    <p className="text-sm text-slate-600 mb-4">{org.description}</p>
                  )}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Users className="w-4 h-4" />
                      <span>{members.length} membre{members.length > 1 ? 's' : ''}</span>
                    </div>
                    {pendingInvitations.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>{pendingInvitations.length} invitation{pendingInvitations.length > 1 ? 's' : ''} en attente</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrg(org);
                        setIsMembersDialogOpen(true);
                      }}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Membres
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrg(org);
                        setIsCommunesDialogOpen(true);
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Données cadastrales"
                      onClick={() => {
                        setSelectedOrgForCadastre(org);
                        setIsCadastreDialogOpen(true);
                      }}
                    >
                      <FileJson className="w-4 h-4 text-green-700" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Supprimer l'organisation "${org.nom}" ?`)) {
                          deleteOrgMutation.mutate(org.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {organisations.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune organisation</h3>
              <p className="text-slate-500">Créez votre première organisation pour commencer</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Gestion des membres */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Membres de {selectedOrg?.nom}</DialogTitle>
            <DialogDescription>Ajoutez ou retirez des membres de cette organisation</DialogDescription>
          </DialogHeader>

          {/* Ajouter un membre */}
          <div className="border-b pb-4 mb-4">
           <label className="text-sm font-medium mb-2 block">Ajouter un membre</label>
           <div className="flex gap-2 flex-wrap">
             <Input
               value={memberEmail}
               onChange={(e) => setMemberEmail(e.target.value)}
               placeholder="Email de l'utilisateur"
               className="flex-1 min-w-[180px]"
             />
             <Select value={memberRole} onValueChange={setMemberRole}>
               <SelectTrigger className="w-36">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="user">Agent</SelectItem>
                 <SelectItem value="superviseur">Superviseur</SelectItem>
               </SelectContent>
             </Select>
             <Button onClick={handleAddMember} disabled={updateUserOrgMutation.isPending || inviteUserMutation.isPending}>
               {(updateUserOrgMutation.isPending || inviteUserMutation.isPending) ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <UserPlus className="w-4 h-4" />
               )}
             </Button>
           </div>
          </div>

          {/* Liste des membres */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedOrg && getOrgMembers(selectedOrg.id).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                   <p className="font-medium text-slate-800">{member.full_name}</p>
                   <p className="text-sm text-slate-600">{member.email}</p>
                   <div className="flex gap-1 mt-1 flex-wrap">
                     {member.role === 'admin' && <Badge className="bg-blue-100 text-blue-800">Admin</Badge>}
                     {member.role === 'superviseur' && <Badge className="bg-indigo-100 text-indigo-800">Superviseur</Badge>}
                     {member.role === 'superviseur' && (member.communes_supervisees || []).map(c => (
                       <Badge key={c} className="bg-slate-100 text-slate-600 text-xs">{c}</Badge>
                     ))}
                   </div>
                 </div>
                 <div className="flex gap-2">
                   {member.role !== 'admin' && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setSelectedSuperviseur(member);
                         setIsSuperviseurDialogOpen(true);
                       }}
                       title="Gérer le rôle et communes"
                     >
                       <ShieldCheck className="w-4 h-4 text-indigo-600" />
                     </Button>
                   )}
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleRemoveMember(member.id)}
                     disabled={updateUserOrgMutation.isPending}
                   >
                     <UserMinus className="w-4 h-4 text-red-600" />
                   </Button>
                 </div>
              </div>
            ))}
            
            {selectedOrg && getOrgInvitations(selectedOrg.id).map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
              >
                <div>
                  <p className="font-medium text-slate-800">{invitation.email}</p>
                  <Badge className="mt-1 bg-amber-100 text-amber-800">En attente</Badge>
                </div>
              </div>
            ))}
            
            {selectedOrg && getOrgMembers(selectedOrg.id).length === 0 && getOrgInvitations(selectedOrg.id).length === 0 && (
              <p className="text-center text-slate-500 py-8">Aucun membre dans cette organisation</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Gestion rôle superviseur */}
      <Dialog open={isSuperviseurDialogOpen} onOpenChange={setIsSuperviseurDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rôle de {selectedSuperviseur?.full_name}</DialogTitle>
            <DialogDescription>Définir le rôle et les communes supervisées</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rôle</label>
              <Select
                value={selectedSuperviseur?.role || 'user'}
                onValueChange={(role) => {
                  setSelectedSuperviseur(prev => ({ ...prev, role }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Agent</SelectItem>
                  <SelectItem value="superviseur">Superviseur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedSuperviseur?.role === 'superviseur' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Communes supervisées</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {(selectedOrg?.communes || []).map(commune => {
                    const isSelected = (selectedSuperviseur?.communes_supervisees || []).includes(commune);
                    return (
                      <button
                        key={commune}
                        onClick={() => {
                          const current = selectedSuperviseur?.communes_supervisees || [];
                          const updated = isSelected
                            ? current.filter(c => c !== commune)
                            : [...current, commune];
                          setSelectedSuperviseur(prev => ({ ...prev, communes_supervisees: updated }));
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-slate-50'}`}
                      >
                        <MapPin className="w-3 h-3" />
                        {commune}
                        {isSelected && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    );
                  })}
                  {(!selectedOrg?.communes || selectedOrg.communes.length === 0) && (
                    <p className="text-xs text-slate-500 p-2">Aucune commune configurée pour cette organisation</p>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Si aucune commune sélectionnée, le superviseur voit toute l'organisation</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuperviseurDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={() => {
                handleSetSuperviseurCommunes(
                  selectedSuperviseur.id,
                  selectedSuperviseur.communes_supervisees || []
                );
                // Si le rôle change, mettre à jour le rôle aussi
                if (selectedSuperviseur.role !== allUsers.find(u => u.id === selectedSuperviseur.id)?.role) {
                  updateUserRoleMutation.mutate({
                    userId: selectedSuperviseur.id,
                    role: selectedSuperviseur.role,
                    communes_supervisees: selectedSuperviseur.communes_supervisees || []
                  });
                }
                setIsSuperviseurDialogOpen(false);
                toast.success('Rôle et communes mis à jour');
              }}
              disabled={updateUserRoleMutation.isPending}
            >
              {updateUserRoleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cadastre */}
      <CadastreManagerDialog
        isOpen={isCadastreDialogOpen}
        onClose={() => setIsCadastreDialogOpen(false)}
        organisation={selectedOrgForCadastre}
      />

      {/* Dialog Gestion des communes */}
      <Dialog open={isCommunesDialogOpen} onOpenChange={setIsCommunesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Communes de {selectedOrg?.nom}</DialogTitle>
            <DialogDescription>Gérez les communes disponibles pour cette organisation</DialogDescription>
          </DialogHeader>

          {/* Ajouter une commune */}
          <div className="border-b pb-4 mb-4">
            <label className="text-sm font-medium mb-2 block">Ajouter une commune</label>
            <div className="flex gap-2">
              <Input
                value={newCommune}
                onChange={(e) => setNewCommune(e.target.value)}
                placeholder="Nom de la commune"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCommune()}
              />
              <Button onClick={handleAddCommune} disabled={updateOrgMutation.isPending}>
                {updateOrgMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Liste des communes */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedOrg && (selectedOrg.communes || []).map((commune) => (
              <div
                key={commune}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <p className="font-medium text-slate-800">{commune}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCommune(commune)}
                  disabled={updateOrgMutation.isPending}
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
            {selectedOrg && (!selectedOrg.communes || selectedOrg.communes.length === 0) && (
              <p className="text-center text-slate-500 py-8">Aucune commune configurée</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}