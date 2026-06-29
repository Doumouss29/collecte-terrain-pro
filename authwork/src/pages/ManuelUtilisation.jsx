import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer, Home, Map, ClipboardList, CheckCircle2, AlertTriangle } from 'lucide-react';

const checklist = [
  'Renseigner le maximum d’informations disponibles.',
  'Prendre obligatoirement la position GPS WGS 84 en recensement classique.',
  'Vérifier les données préremplies en recensement par carte.',
  'Faire signer le propriétaire dans la section propriétaire.',
  'Compléter soigneusement les renseignements sur le bien.',
  'Multiplier tout montant mensuel par 12 pour obtenir la valeur annuelle.',
  'Toujours demander s’il existe un gestionnaire du bien.',
  'Valider uniquement un dossier complet, sinon enregistrer en brouillon.'
];

const stepsClassique = [
  ['Parcelle', 'Saisir manuellement toutes les informations disponibles. La position GPS WGS 84 doit toujours être prise.'],
  ['Propriétaire', 'Collecter les informations d’identification du propriétaire et obtenir sa signature.'],
  ['Bien', 'Renseigner les caractéristiques du bien avec précision, car elles influencent la synthèse.'],
  ['Synthèse', 'Contrôler la valeur locative annuelle : pour le premier bâtiment, le calcul est automatique. En cas de plusieurs bâtiments, les autres valeurs annuelles doivent être renseignées manuellement. Rappel : montant mensuel × 12.'],
  ['Gestion', 'Demander s’il existe un gestionnaire et renseigner ses informations si nécessaire.'],
  ['Validation', 'Valider seulement si le dossier est complet ; sinon enregistrer en brouillon.']
];

const stepsCarte = [
  ['Carte', 'Sélectionner une parcelle déjà présente sur la carte ; certaines données sont préremplies.'],
  ['Convocation', 'Laisser une convocation si le propriétaire ou l’occupant est absent, puis reprendre plus tard.'],
  ['Parcelle', 'Vérifier les données préremplies. Les coordonnées sont automatiques : ne pas reprendre le GPS.'],
  ['Propriétaire', 'Collecter les informations utiles et obtenir la signature du propriétaire.'],
  ['Bien & synthèse', 'Contrôler la valeur locative annuelle : pour le premier bâtiment, le calcul est automatique. En cas de plusieurs bâtiments, les autres valeurs annuelles doivent être renseignées manuellement. Rappel : montant mensuel × 12.'],
  ['Gestion & validation', 'Identifier le gestionnaire éventuel, puis valider uniquement si toutes les informations sont fiables.']
];

function ModeCard({ icon: Icon, title, subtitle, steps, accent }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:p-3 print:break-inside-avoid">
      <div className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${accent}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl print:text-lg font-black text-slate-950 leading-tight">{title}</h2>
        </div>
      </div>
      <div className="grid gap-2">
        {steps.map(([label, text]) => (
          <div key={label} className="flex gap-2 rounded-lg bg-slate-50/80 px-2 py-1.5 text-sm print:text-xs leading-snug">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
            <p><span className="font-semibold text-slate-900">{label} :</span> {text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ManuelUtilisation() {
  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 9mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/"><Home className="w-4 h-4" /> Accueil</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-blue-800 hover:bg-blue-900 text-white">
          <Printer className="w-4 h-4" /> Imprimer
        </Button>
      </div>

      <main className="mx-auto w-full max-w-[210mm] p-4 print:p-0">
        <div className="mx-auto min-h-[297mm] bg-white rounded-[28px] shadow-2xl border border-slate-200 p-6 print:min-h-0 print:shadow-none print:border-0 print:rounded-none print:p-0">
          <header className="text-center border-b border-slate-200 pb-4 mb-4 print:pb-3 print:mb-3">
            <p className="text-xs font-bold tracking-[0.25em] text-blue-800 uppercase">LM-Collecte</p>
            <h1 className="text-3xl print:text-2xl font-black text-slate-950 mt-1">Manuel d’utilisation</h1>
          </header>

          <div className="grid md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            <ModeCard
              icon={ClipboardList}
              title="1. Recensement classique"
              subtitle="Pour les parcelles non préalablement renseignées sur la carte."
              steps={stepsClassique}
              accent="bg-blue-800"
            />
            <ModeCard
              icon={Map}
              title="2. Recensement par carte"
              subtitle="Pour les parcelles déjà présentes sur la carte cadastrale."
              steps={stepsCarte}
              accent="bg-teal-700"
            />
          </div>

          <section className="mt-4 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm print:p-3 print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <h2 className="text-lg print:text-base font-bold text-slate-900">3. Règles importantes à retenir</h2>
            </div>
            <div className="grid md:grid-cols-2 print:grid-cols-2 gap-x-4 gap-y-1">
              {checklist.map((item) => (
                <div key={item} className="flex gap-2 text-sm print:text-xs leading-snug">
                  <span className="font-bold text-blue-800">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-4 rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3 text-center text-sm font-black text-blue-950 shadow-sm print:text-xs print:py-2">
            En cas de doute : enregistrer en brouillon, vérifier les informations, puis reprendre le dossier avant validation.
          </footer>
        </div>
      </main>
    </div>
  );
}