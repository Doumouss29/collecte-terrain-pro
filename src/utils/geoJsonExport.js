/**
 * Exporte les collectes en GeoJSON conforme au schéma de recensement foncier
 */

// Schéma des propriétés pour chaque Feature
const GEOJSON_PROPERTIES_SCHEMA = {
  // Bloc identification parcellaire
  commune: null,
  section: null,
  parcelle: null,
  code_exemption: null,
  annee_acq: null,
  nature: null,
  surf_imposable: null,
  val_venale: null,
  code_vv: null,
  quartier: null,
  code_quartier: null,
  tf: null,
  lot: null,
  ilot: null,
  numero_appartement: null,
  niveau_appartement: null,
  latitude: null,
  longitude: null,
  reference_formulaire: null,

  // Type propriétaire
  proprietaire_type: null,

  // Bloc propriétaire personne physique
  pp_nom: null,
  pp_prenoms: null,
  pp_numero_compte_contribuable: null,
  pp_date_naissance: null,
  pp_lieu_naissance: null,
  pp_sous_prefecture: null,
  pp_pays: null,
  pp_numero_carte_identite: null,
  pp_nationalite: null,
  pp_autre_piece: null,
  pp_numero_autre_piece: null,
  pp_nom_pere: null,
  pp_nom_mere: null,

  pp_adresse_residence_adresse_postale: null,
  pp_adresse_residence_bp: null,
  pp_adresse_residence_ville: null,
  pp_adresse_residence_tel: null,
  pp_adresse_residence_quartier: null,
  pp_adresse_residence_tf: null,
  pp_informations_complementaires: null,
  pp_situation_famille: null,
  pp_nombre_enfants_charge: null,

  pp_profession: null,
  pp_service_employeur: null,
  pp_adresse_professionnelle_adresse_postale: null,
  pp_adresse_professionnelle_bp: null,
  pp_adresse_professionnelle_ville: null,
  pp_adresse_professionnelle_tel: null,
  pp_adresse_professionnelle_quartier: null,
  pp_date_signature: null,
  pp_signataire: null,

  // Bloc propriétaire personne morale / entreprise individuelle
  pm_raison_sociale: null,
  pm_numero_compte_contribuable: null,
  pm_numero_registre_commerce: null,
  pm_tel: null,
  pm_adresse_postale: null,
  pm_bp: null,
  pm_ville: null,
  pm_quartier: null,
  pm_ilot: null,
  pm_lot: null,
  pm_tf: null,

  // Bloc renseignements concernant le bien
  bien_description_immeuble: null,
  bien_nature_local: null,
  bien_equipe_eau: null,
  bien_equipe_electricite: null,
  bien_nombre_niveaux: null,
  bien_nombre_batiments: null,
  bien_annee_achevement_travaux: null,
  bien_nature_occupation: null,
  bien_valeur_locative_mensuelle: null,
  bien_nombre_pieces: null,
  bien_agent_recenseur: null,

  // Bloc tableau de synthèse
  synthese_annee_achevement_travaux: null,
  synthese_nature_occupation: null,
  synthese_valeur_locative_annuelle: null,
  synthese_nombre_pieces: null,

  // Bloc gestion
  gestion_nom_raison_sociale_agence: null,
  gestion_numero_compte_contribuable: null,
  gestion_adresse_postale: null,
  gestion_bp: null,
  gestion_ville: null,
  gestion_tel: null,
  gestion_quartier: null,

  // Photos / pièces jointes
  photo_piece_identite_recto: null,
  photo_piece_identite_verso: null,
  photo_immeuble_generale: null,
  photo_immeuble_facade: null,
  photo_immeuble_entree: null,

  // Métadonnées
  date_export: null,
  id_unique: null,
};

// Champs numériques
const NUMERIC_FIELDS = new Set([
  "annee_acq",
  "surf_imposable",
  "val_venale",
  "numero_appartement",
  "niveau_appartement",
  "latitude",
  "longitude",
  "pp_nombre_enfants_charge",
  "bien_nombre_niveaux",
  "bien_nombre_batiments",
  "bien_valeur_locative_mensuelle",
  "bien_nombre_pieces",
  "synthese_annee_achevement_travaux",
  "synthese_valeur_locative_annuelle",
  "synthese_nombre_pieces",
]);

// Champs booléens
const BOOLEAN_FIELDS = new Set([
  "bien_equipe_eau",
  "bien_equipe_electricite",
]);

// Champs dates (ISO)
const DATE_FIELDS = new Set([
  "pp_date_naissance",
  "pp_date_signature",
  "date_export",
]);

/**
 * Parse et nettoie une valeur
 */
function parseValue(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Trim si c'est un string
  if (typeof value === "string") {
    value = value.trim();
    if (value === "") return null;
  }

  // Conversion numérique
  if (NUMERIC_FIELDS.has(fieldName)) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  // Conversion booléenne
  if (BOOLEAN_FIELDS.has(fieldName)) {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1" || value === 1) return true;
    if (value === "false" || value === "0" || value === 0) return false;
    return null;
  }

  // Conversion date
  if (DATE_FIELDS.has(fieldName)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return null;
  }

  // String par défaut
  return String(value);
}

/**
 * Détermine le type de propriétaire basé sur les champs renseignés
 */
function determinePropietaireType(collecte) {
  const hasPP = collecte.prop_nom || collecte.prop_prenoms || collecte.prop_carte_identite;
  const hasPM = collecte.societe_raison_sociale || collecte.societe_registre_commerce;

  if (hasPP) return "personne_physique";
  if (hasPM) return "personne_morale";
  return null;
}

/**
 * Valide les coordonnées
 */
function validateCoordinates(lat, lon) {
  if (lat === null || lon === null) return false;

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;

  return true;
}

/**
 * Extrait la première ligne du tableau de synthèse
 */
function extractSynthese(collecte) {
  const synthese = collecte.tableau_synthese?.[0];
  if (!synthese) return {};

  return {
    synthese_annee_achevement_travaux: synthese.annee_achevement,
    synthese_nature_occupation: synthese.nature_occupation,
    synthese_valeur_locative_annuelle: synthese.valeur_locative_annuelle,
    synthese_nombre_pieces: synthese.nombre_pieces,
  };
}

/**
 * Construit les propriétés d'une Feature
 */
function buildProperties(collecte) {
  const lat = parseValue(collecte.latitude, "latitude");
  const lon = parseValue(collecte.longitude, "longitude");

  const proprietaireType = determinePropietaireType(collecte);
  const syntheseData = extractSynthese(collecte);

  const properties = {
    ...GEOJSON_PROPERTIES_SCHEMA,

    // Bloc identification parcellaire
    source: undefined,
    type_formulaire: undefined,
    commune: parseValue(collecte.commune, "commune"),
    section: parseValue(collecte.section, "section"),
    parcelle: parseValue(collecte.parcelle, "parcelle"),
    code_exemption: parseValue(collecte.code_exemption, "code_exemption"),
    annee_acq: parseValue(collecte.annee_acq, "annee_acq"),
    nature: parseValue(collecte.nature, "nature"),
    surf_imposable: parseValue(collecte.surface_imposable, "surf_imposable"),
    val_venale: parseValue(collecte.valeur_venale, "val_venale"),
    code_vv: parseValue(collecte.code_vv, "code_vv"),
    quartier: parseValue(collecte.quartier, "quartier"),
    code_quartier: parseValue(collecte.code_quartier, "code_quartier"),
    tf: parseValue(collecte.tf, "tf"),
    lot: parseValue(collecte.lot, "lot"),
    ilot: parseValue(collecte.ilot, "ilot"),
    numero_appartement: parseValue(collecte.num_appartement, "numero_appartement"),
    niveau_appartement: parseValue(collecte.niveau_appartement, "niveau_appartement"),
    latitude: lat,
    longitude: lon,
    reference_formulaire: parseValue(collecte.reference_dgi, "reference_formulaire"),

    proprietaire_type: proprietaireType,

    // Bloc propriétaire personne physique
    pp_nom: parseValue(collecte.prop_nom, "pp_nom"),
    pp_prenoms: parseValue(collecte.prop_prenoms, "pp_prenoms"),
    pp_numero_compte_contribuable: parseValue(
      collecte.prop_compte_contribuable,
      "pp_numero_compte_contribuable"
    ),
    pp_date_naissance: parseValue(
      collecte.prop_date_naissance,
      "pp_date_naissance"
    ),
    pp_lieu_naissance: parseValue(collecte.prop_lieu_naissance, "pp_lieu_naissance"),
    pp_sous_prefecture: parseValue(
      collecte.prop_sous_prefecture,
      "pp_sous_prefecture"
    ),
    pp_pays: parseValue(collecte.prop_pays, "pp_pays"),
    pp_numero_carte_identite: parseValue(
      collecte.prop_carte_identite,
      "pp_numero_carte_identite"
    ),
    pp_nationalite: parseValue(collecte.prop_nationalite, "pp_nationalite"),
    pp_autre_piece: parseValue(collecte.prop_autre_piece, "pp_autre_piece"),
    pp_numero_autre_piece: parseValue(
      collecte.prop_autre_piece_numero,
      "pp_numero_autre_piece"
    ),
    pp_nom_pere: parseValue(collecte.prop_nom_pere, "pp_nom_pere"),
    pp_nom_mere: parseValue(collecte.prop_nom_mere, "pp_nom_mere"),

    pp_adresse_residence_adresse_postale: parseValue(
      collecte.prop_adresse_postale,
      "pp_adresse_residence_adresse_postale"
    ),
    pp_adresse_residence_bp: parseValue(collecte.prop_bp, "pp_adresse_residence_bp"),
    pp_adresse_residence_ville: parseValue(
      collecte.prop_ville,
      "pp_adresse_residence_ville"
    ),
    pp_adresse_residence_tel: parseValue(collecte.prop_tel, "pp_adresse_residence_tel"),
    pp_adresse_residence_quartier: parseValue(
      collecte.prop_quartier_residence,
      "pp_adresse_residence_quartier"
    ),
    pp_adresse_residence_tf: parseValue(
      collecte.prop_adresse_tf,
      "pp_adresse_residence_tf"
    ),
    pp_informations_complementaires: parseValue(
      collecte.prop_infos_complementaires,
      "pp_informations_complementaires"
    ),
    pp_situation_famille: parseValue(
      collecte.situation_familiale,
      "pp_situation_famille"
    ),
    pp_nombre_enfants_charge: parseValue(
      collecte.nombre_enfants,
      "pp_nombre_enfants_charge"
    ),

    pp_profession: parseValue(collecte.prof_profession, "pp_profession"),
    pp_service_employeur: parseValue(
      collecte.prof_service_employeur,
      "pp_service_employeur"
    ),
    pp_adresse_professionnelle_adresse_postale: parseValue(
      collecte.prof_adresse_postale,
      "pp_adresse_professionnelle_adresse_postale"
    ),
    pp_adresse_professionnelle_bp: parseValue(
      collecte.prof_bp,
      "pp_adresse_professionnelle_bp"
    ),
    pp_adresse_professionnelle_ville: parseValue(
      collecte.prof_ville,
      "pp_adresse_professionnelle_ville"
    ),
    pp_adresse_professionnelle_tel: parseValue(
      collecte.prof_tel,
      "pp_adresse_professionnelle_tel"
    ),
    pp_adresse_professionnelle_quartier: parseValue(
      collecte.prof_quartier,
      "pp_adresse_professionnelle_quartier"
    ),
    pp_date_signature: parseValue(collecte.prop_signature_date, "pp_date_signature"),
    pp_signataire: parseValue(collecte.prop_signature, "pp_signataire"),

    // Bloc propriétaire personne morale / entreprise individuelle
    pm_raison_sociale: parseValue(collecte.societe_raison_sociale, "pm_raison_sociale"),
    pm_numero_compte_contribuable: parseValue(
      collecte.societe_compte_contribuable,
      "pm_numero_compte_contribuable"
    ),
    pm_numero_registre_commerce: parseValue(
      collecte.societe_registre_commerce,
      "pm_numero_registre_commerce"
    ),
    pm_tel: parseValue(collecte.societe_tel, "pm_tel"),
    pm_adresse_postale: parseValue(collecte.societe_adresse_postale, "pm_adresse_postale"),
    pm_bp: parseValue(collecte.societe_bp, "pm_bp"),
    pm_ville: parseValue(collecte.societe_ville, "pm_ville"),
    pm_quartier: parseValue(collecte.societe_quartier, "pm_quartier"),
    pm_ilot: parseValue(collecte.societe_ilot, "pm_ilot"),
    pm_lot: parseValue(collecte.societe_lot, "pm_lot"),
    pm_tf: parseValue(collecte.societe_tf, "pm_tf"),

    // Bloc renseignements concernant le bien
    bien_nature_local: parseValue(collecte.bien_nature_local, "bien_nature_local"),
    bien_equipe_eau: parseValue(collecte.bien_equipe_eau, "bien_equipe_eau"),
    bien_equipe_electricite: parseValue(
      collecte.bien_equipe_electricite,
      "bien_equipe_electricite"
    ),
    bien_nombre_niveaux: parseValue(
      collecte.bien_nombre_niveaux,
      "bien_nombre_niveaux"
    ),
    bien_nombre_batiments: parseValue(
      collecte.bien_nombre_batiments,
      "bien_nombre_batiments"
    ),
    bien_annee_achevement_travaux: parseValue(
      collecte.bien_annee_achevement,
      "bien_annee_achevement_travaux"
    ),
    bien_nature_occupation: parseValue(
      collecte.bien_nature_occupation,
      "bien_nature_occupation"
    ),
    bien_valeur_locative_mensuelle: parseValue(
      collecte.bien_valeur_locative_mensuelle,
      "bien_valeur_locative_mensuelle"
    ),
    bien_nombre_pieces: parseValue(
      collecte.bien_nombre_pieces,
      "bien_nombre_pieces"
    ),
    bien_agent_recenseur: parseValue(collecte.signature_agent, "bien_agent_recenseur"),

    // Bloc tableau de synthèse
    synthese_annee_achevement_travaux: parseValue(
      syntheseData.synthese_annee_achevement_travaux,
      "synthese_annee_achevement_travaux"
    ),
    synthese_nature_occupation: parseValue(
      syntheseData.synthese_nature_occupation,
      "synthese_nature_occupation"
    ),
    synthese_valeur_locative_annuelle: parseValue(
      syntheseData.synthese_valeur_locative_annuelle,
      "synthese_valeur_locative_annuelle"
    ),
    synthese_nombre_pieces: parseValue(
      syntheseData.synthese_nombre_pieces,
      "synthese_nombre_pieces"
    ),

    // Bloc gestion
    gestion_nom_raison_sociale_agence: parseValue(
      collecte.agence_raison_sociale,
      "gestion_nom_raison_sociale_agence"
    ),
    gestion_numero_compte_contribuable: parseValue(
      collecte.agence_compte_contribuable,
      "gestion_numero_compte_contribuable"
    ),
    gestion_adresse_postale: parseValue(
      collecte.agence_adresse_postale,
      "gestion_adresse_postale"
    ),
    gestion_bp: parseValue(collecte.agence_bp, "gestion_bp"),
    gestion_ville: parseValue(collecte.agence_ville, "gestion_ville"),
    gestion_tel: parseValue(collecte.agence_tel, "gestion_tel"),
    gestion_quartier: parseValue(collecte.agence_quartier, "gestion_quartier"),

    // Photos / pièces jointes
    photo_piece_identite_recto: parseValue(
      collecte.prop_photo_carte_identite_recto,
      "photo_piece_identite_recto"
    ),
    photo_piece_identite_verso: parseValue(
      collecte.prop_photo_carte_identite_verso,
      "photo_piece_identite_verso"
    ),
    photo_immeuble_generale: parseValue(
      collecte.bien_photo_general,
      "photo_immeuble_generale"
    ),
    photo_immeuble_facade: parseValue(
      collecte.bien_photo_facade,
      "photo_immeuble_facade"
    ),
    photo_immeuble_entree: parseValue(
      collecte.bien_photo_entree,
      "photo_immeuble_entree"
    ),

    // Métadonnées
    date_export: new Date().toISOString().split("T")[0],
    id_unique: collecte.id,
  };

  return properties;
}

/**
 * Convertit un tableau de collectes en FeatureCollection GeoJSON valide
 */
export function collectesToGeoJSON(collectes) {
  const features = [];

  for (const collecte of collectes) {
    const lat = parseFloat(collecte.latitude);
    const lon = parseFloat(collecte.longitude);

    // Valider les coordonnées
    if (!validateCoordinates(lat, lon)) {
      continue;
    }

    const properties = buildProperties(collecte);

    const feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lon, lat], // [longitude, latitude]
      },
      properties,
    };

    features.push(feature);
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Télécharge un GeoJSON en fichier
 */
export function downloadGeoJSON(geoJson, filename = "recensement_complet.geojson") {
  const dataStr = JSON.stringify(geoJson, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/geo+json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valide un GeoJSON FeatureCollection
 */
export function validateGeoJSON(geoJson) {
  if (!geoJson || typeof geoJson !== "object") {
    return { valid: false, error: "Invalid GeoJSON object" };
  }

  if (geoJson.type !== "FeatureCollection") {
    return { valid: false, error: "Must be a FeatureCollection" };
  }

  if (!Array.isArray(geoJson.features)) {
    return { valid: false, error: "Features must be an array" };
  }

  for (const feature of geoJson.features) {
    if (feature.type !== "Feature") {
      return { valid: false, error: "Each item must be a Feature" };
    }

    if (!feature.geometry || feature.geometry.type !== "Point") {
      return { valid: false, error: "Geometry must be a Point" };
    }

    const [lon, lat] = feature.geometry.coordinates;
    if (typeof lon !== "number" || typeof lat !== "number") {
      return { valid: false, error: "Coordinates must be numbers" };
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { valid: false, error: "Invalid coordinate range" };
    }
  }

  return { valid: true };
}