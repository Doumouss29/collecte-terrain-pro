import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, PenTool } from 'lucide-react';
import SignaturePad from './SignaturePad';

export default function AgentNameModal({ isOpen, onClose, onSubmit }) {
  const [agentName, setAgentName] = useState('');
  const [agentSignature, setAgentSignature] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem('agentReviewerName');
      const savedSignature = localStorage.getItem('agentReviewerSignature');
      if (savedName) {
        setAgentName(savedName);
      }
      if (savedSignature) {
        setAgentSignature(savedSignature);
        setShowSignaturePad(true);
      }
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (agentName.trim() && agentSignature) {
      localStorage.setItem('agentReviewerName', agentName.trim());
      localStorage.setItem('agentReviewerSignature', agentSignature);
      onSubmit(agentName.trim(), agentSignature);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Identifiant de l'Agent Recenseur
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentName" className="text-slate-700 font-medium">
              Nom et Prénom
            </Label>
            <Input
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value.toUpperCase())}
              placeholder="EX: PICO TOLA GBLANW"
              className="h-10 uppercase"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <SignaturePad
              label="Signature"
              value={agentSignature}
              onChange={setAgentSignature}
              show={showSignaturePad}
              onToggle={() => setShowSignaturePad(!showSignaturePad)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 h-10"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!agentName.trim() || !agentSignature}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-10"
            >
              Continuer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}