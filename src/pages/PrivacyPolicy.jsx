import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
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
          <h1 className="text-xl sm:text-2xl font-bold">Politique de confidentialité</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-blue-800" />
            <h2 className="text-3xl font-bold text-slate-800">Politique de Confidentialité</h2>
          </div>

          <div className="space-y-6 text-slate-700">
            
            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">1. Collecte des données</h3>
              <p className="leading-relaxed">
                L'application collecte les données personnelles et professionnelles nécessaires pour les opérations de recensement des propriétaires fonciers. Ces informations incluent :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Données d'identification des propriétaires fonciers</li>
                <li>Informations relatives aux biens immobiliers</li>
                <li>Données de localisation et cadastrales</li>
                <li>Informations de contact professionnelles</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">2. Utilisation des données</h3>
              <p className="leading-relaxed">
                Les données collectées sont utilisées exclusivement pour :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>L'Opération de Recensement des Propriétaires Fonciers</li>
                <li>La mise à jour du fichier foncier national</li>
                <li>L'optimisation de l'assiette fiscale</li>
                <li>La prise de décisions administratives et fiscales</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">3. Protection des données</h3>
              <p className="leading-relaxed">
                Nous mettons en place des mesures de sécurité appropriées pour protéger vos données contre :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Les accès non autorisés</li>
                <li>Les modifications non consentis</li>
                <li>La divulgation accidentelle</li>
                <li>La destruction illégale</li>
              </ul>
              <p className="mt-3">
                Ces mesures incluent le chiffrement des données, l'accès sécurisé et la synchronisation sécurisée en mode offline.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">4. Partage des données</h3>
              <p className="leading-relaxed">
                Les données ne sont partagées qu'avec les entités autorisées :
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Direction Générale des Impôts</li>
                <li>Direction du Cadastre</li>
                <li>Organismes gouvernementaux autorisés</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">5. Durée de conservation</h3>
              <p className="leading-relaxed">
                Les données sont conservées conformément à la législation en vigueur et aux besoins administratifs de l'État.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">6. Droits des utilisateurs</h3>
              <p className="leading-relaxed">
                Conformément à la loi, vous avez le droit d'accéder, de rectifier ou de demander la suppression de vos données personnelles. 
                Pour exercer ces droits, veuillez contacter la Direction Générale des Impôts.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">7. Modifications de cette politique</h3>
              <p className="leading-relaxed">
                Cette politique de confidentialité peut être modifiée à tout moment. Les modifications seront communiquées aux utilisateurs.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-3">8. Contact</h3>
              <p className="leading-relaxed">
                Pour toute question concernant cette politique de confidentialité, veuillez contacter :
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