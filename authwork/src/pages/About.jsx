import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, Zap, Archive, BarChart3 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'Nouvelle Collecte',
      description: 'Créez et gérez facilement de nouvelles collectes de données cadastrales'
    },
    {
      icon: Archive,
      title: 'Archive',
      description: 'Accédez à l\'historique complet de vos collectes précédentes'
    },
    {
      icon: BarChart3,
      title: 'Rapports',
      description: 'Générez des rapports détaillés ou compacts pour vos analyses'
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Vos données sont protégées et accessibles hors ligne'
    }
  ];

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
          <h1 className="text-xl sm:text-2xl font-bold">À propos de l'application</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Logo et Titre */}
        <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 mb-8 text-center">
          <img 
            src="https://media.base44.com/images/public/69763698f133e8ecb1784749/277caf724_android-chrome-192x192.png" 
            alt="Logo LM-Collecte" 
            className="h-16 sm:h-24 mx-auto mb-3"
          />
          <div className="inline-block bg-black text-white text-sm font-bold px-4 py-1 rounded-full mb-6 tracking-widest">
            LM-COLLECTE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            OPÉRATION DE RECENSEMENT
          </h2>
          <p className="text-xl sm:text-2xl text-blue-800 font-semibold">
            DES PROPRIÉTAIRES FONCIERS
          </p>
          <p className="text-sm text-slate-600 mt-4">
            Projet E-Cadastre - Direction du Cadastre
          </p>
        </div>

        {/* Description de l'application */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">À propos de LM-Collecte</h3>
          <div className="text-slate-700 leading-relaxed space-y-4">
            <p>
              <strong>LM-Collecte</strong> est une application mobile et web développée par <strong>LM URBS</strong>, dans le cadre de l'Opération de Recensement des Propriétaires Fonciers pour la <strong>Direction Générale des Impôts (DGI)</strong> et la <strong>Direction du Cadastre</strong> de Côte d'Ivoire.
            </p>
            <p>
              Elle permet aux agents recenseurs agréés de collecter, saisir et gérer les données relatives aux propriétaires fonciers et à leurs biens immobiliers, de manière structurée, sécurisée et conforme aux exigences administratives.
            </p>
          </div>
        </div>

        {/* Fonctionnalités détaillées */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Fonctionnalités principales</h3>
          <ul className="text-slate-700 space-y-3">
            {[
              "Saisie guidée des informations des propriétaires fonciers (particuliers et sociétés)",
              "Collecte des données cadastrales : parcelle, section, commune, nature du bien",
              "Capture de photos des pièces d'identité, façades et signatures",
              "Génération de rapports officiels détaillés et compacts pour la DGI",
              "Fonctionnement hors ligne avec synchronisation automatique à la reconnexion",
              "Archivage et consultation de l'historique des collectes effectuées",
              "Accès sécurisé réservé aux agents recenseurs autorisés par leur organisation"
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-blue-800 flex-shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Finalité des données */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 sm:p-8 mb-8">
          <h3 className="text-xl font-bold text-blue-900 mb-3">Utilisation de vos données</h3>
          <p className="text-blue-800 leading-relaxed">
            Les données collectées via E-Cadastre sont utilisées <strong>exclusivement</strong> dans le cadre de l'Opération de Recensement des Propriétaires Fonciers, pour la constitution et la mise à jour du fichier foncier national. Elles sont traitées conformément à la réglementation en vigueur par la Direction Générale des Impôts et la Direction du Cadastre.
          </p>
        </div>

        {/* Liens juridiques - bien visible, requis Google OAuth */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Informations juridiques</h3>
          <p className="text-sm text-slate-500 mb-6">Ces documents sont accessibles librement, sans connexion requise.</p>
          <div className="space-y-4">
            <Link to="/PrivacyPolicy" className="flex items-center justify-between pb-4 border-b border-slate-200 hover:bg-slate-50 -mx-6 px-6 py-3 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Politique de confidentialité</h4>
                  <p className="text-sm text-slate-600">Comment vos données sont collectées et protégées</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-blue-800 border-blue-800 hover:bg-blue-50 flex-shrink-0">
                <FileText className="w-4 h-4 mr-2" />
                Lire
              </Button>
            </Link>

            <Link to="/TermsOfUse" className="flex items-center justify-between hover:bg-slate-50 -mx-6 px-6 py-3 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Conditions d'utilisation</h4>
                  <p className="text-sm text-slate-600">Règles et obligations d'utilisation de l'application</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-blue-800 border-blue-800 hover:bg-blue-50 flex-shrink-0">
                <FileText className="w-4 h-4 mr-2" />
                Lire
              </Button>
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-3">Contact</h3>
          <div className="text-slate-700 space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-2">Développeur de l'application</p>
              <p><strong>LM URBS</strong></p>
              <p>+33 06 13 23 60</p>
              <p>+225 07 11 12 43 59</p>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <p className="font-semibold mb-2">Développeurs</p>
              <div className="mb-2">
                <p><strong>Lacina KONE</strong></p>
                <p className="text-blue-600"><a href="mailto:lassgeometre@gmail.com">lacina.kone.dev@gmail.com</a></p>
              </div>
              <div className="mb-2">
                <p><strong>Doumbia Moussa</strong></p>
                <p className="text-blue-600"><a href="mailto:doumbiasmoussa@gmail.com">lacina.kone.dev@gmail.com</a></p>
              </div>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="text-center mt-8 text-sm text-slate-600">
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}