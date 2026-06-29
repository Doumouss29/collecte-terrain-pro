import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10 px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">Conditions d'utilisation</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-8 h-8 text-blue-800" />
            <h2 className="text-3xl font-bold text-slate-800">Conditions d'Utilisation</h2>
          </div>

          <div className="space-y-6 text-slate-700">
            
            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">1. Objet de l'application</h3>
              <p className="leading-relaxed">
                Cette application est un outil officiel mis à disposition par la Direction Générale des Impôts pour l'Opération de Recensement des Propriétaires Fonciers. 
                Elle est destinée exclusivement aux agents autorisés et aux entités gouvernementales habilitées.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">2. Accès et authentification</h3>
              <p className="leading-relaxed">
                L'accès à l'application est réservé aux utilisateurs autorisés. Vous êtes responsable de la confidentialité de vos identifiants de connexion. 
                Toute utilisation non autorisée doit être signalée immédiatement.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">3. Obligations de l'utilisateur</h3>
              <p className="leading-relaxed">
                L'utilisateur s'engage à :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Utiliser l'application conformément à sa destination officielle</li>
                <li>Respecter les procédures de saisie de données établies</li>
                <li>Assurer l'exactitude et la complétude des données collectées</li>
                <li>Maintenir la sécurité de ses accès et identifiants</li>
                <li>Signaler tout dysfonctionnement ou problème de sécurité</li>
                <li>Respecter la confidentialité des données collectées</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">4. Utilisation acceptable</h3>
              <p className="leading-relaxed">
                Les utilisateurs ne doivent pas :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Modifier ou falsifier les données</li>
                <li>Accéder à des données non autorisées</li>
                <li>Partager les données avec des tiers non autorisés</li>
                <li>Utiliser l'application à des fins autres qu'officielles</li>
                <li>Interfère avec la disponibilité ou l'intégrité de l'application</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">5. Mode hors ligne</h3>
              <p className="leading-relaxed">
                L'application fonctionne en mode hors ligne pour assurer la continuité des opérations. Les données collectées sont synchronisées automatiquement 
                lorsqu'une connexion Internet est rétablie. L'utilisateur doit assurer que les données collectées hors ligne sont exactes et complètes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">6. Responsabilité</h3>
              <p className="leading-relaxed">
                La Direction Générale des Impôts ne peut être tenue responsable de :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Les interruptions de service</li>
                <li>Les erreurs de saisie des utilisateurs</li>
                <li>Les pertes de données dues à une mauvaise utilisation</li>
                <li>Les impacts résultant de la violation des conditions d'utilisation</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">7. Propriété intellectuelle</h3>
              <p className="leading-relaxed">
                L'application et tous ses composants sont la propriété de la Direction Générale des Impôts. Leur reproduction, modification ou distribution 
                sans autorisation est interdite.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">8. Modifications des conditions</h3>
              <p className="leading-relaxed">
                Ces conditions d'utilisation peuvent être modifiées à tout moment. Les utilisateurs seront informés des modifications importantes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">9. Résiliation</h3>
              <p className="leading-relaxed">
                L'accès à l'application peut être révoqué à tout moment pour non-respect des présentes conditions ou pour d'autres motifs justifiés.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">10. Droit applicable</h3>
              <p className="leading-relaxed">
                Ces conditions sont régies par la législation en vigueur. Tout différend sera résolu selon les procédures administratives applicables.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">11. Support et assistance</h3>
              <p className="leading-relaxed">
                Pour toute question ou assistance concernant l'utilisation de l'application, veuillez contacter :
              </p>
              <p className="mt-2 font-semibold text-slate-800">
                Direction Générale des Impôts<br />
                Direction du Cadastre
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-600">
            <p>Dernière mise à jour : 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}