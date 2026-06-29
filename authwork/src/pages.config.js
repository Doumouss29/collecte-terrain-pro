/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import AdminOrganisations from './pages/AdminOrganisations';
import DetailCollecte from './pages/DetailCollecte';
import EditerCollecte from './pages/EditerCollecte';
import MesCollectes from './pages/MesCollectes';
import NouvelleCollecte from './pages/NouvelleCollecte';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RapportCollecte from './pages/RapportCollecte';
import RapportCollecteCompact from './pages/RapportCollecteCompact';
import Settings from './pages/Settings';
import SyncOffline from './pages/SyncOffline';
import TermsOfUse from './pages/TermsOfUse';
import Accueil from './pages/Accueil';


export const PAGES = {
    "About": About,
    "AdminOrganisations": AdminOrganisations,
    "DetailCollecte": DetailCollecte,
    "EditerCollecte": EditerCollecte,
    "MesCollectes": MesCollectes,
    "NouvelleCollecte": NouvelleCollecte,
    "PrivacyPolicy": PrivacyPolicy,
    "RapportCollecte": RapportCollecte,
    "RapportCollecteCompact": RapportCollecteCompact,
    "Settings": Settings,
    "SyncOffline": SyncOffline,
    "TermsOfUse": TermsOfUse,
    "Accueil": Accueil,
}

export const pagesConfig = {
    mainPage: "Accueil",
    Pages: PAGES,
};