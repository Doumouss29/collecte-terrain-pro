import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';
import 'npm:jspdf-autotable@3.5.36';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { collecteId } = body;

    if (!collecteId) {
      return Response.json({ error: 'collecteId requis' }, { status: 400 });
    }

    const results = await base44.asServiceRole.entities.Collecte.filter({ id: collecteId });
    const collecte = results[0];

    if (!collecte) {
      return Response.json({ error: 'Collecte non trouvée' }, { status: 404 });
    }

    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('MINISTERE DE L\'ECONOMIE ET DES FINANCES', 105, yPosition, { align: 'center' });
    yPosition += 7;
    doc.text('DIRECTION GENERALE DES IMPOTS - DIRECTION DU CADASTRE', 105, yPosition, { align: 'center' });
    yPosition += 7;
    doc.text('OPERATION DE RECENSEMENT DES PROPRIETAIRES FONCIERS', 105, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('I - INFORMATIONS SUR LA PARCELLE', 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Champ', 'Valeur']],
      body: [
        ['Commune', collecte.commune || ''],
        ['Section', collecte.section || ''],
        ['Parcelle', collecte.parcelle || ''],
        ['Quartier', collecte.quartier || ''],
        ['Lot', collecte.lot || ''],
        ['Îlot', collecte.ilot || ''],
        ['Surface Imposable (m²)', String(collecte.surface_imposable || '')],
        ['Référence DGI', collecte.reference_dgi || '']
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    const proprietaireTitle = collecte.type_proprietaire === 'societe'
      ? 'II - RENSEIGNEMENTS SUR LE PROPRIETAIRE (Société/Personne Morale)'
      : 'II - RENSEIGNEMENTS SUR LE PROPRIETAIRE (Particulier)';
    doc.text(proprietaireTitle, 20, yPosition);
    yPosition += 10;

    // Ajouter les photos de la pièce d'identité si c'est un particulier
    if (collecte.type_proprietaire === 'particulier' && (collecte.prop_photo_carte_identite_recto || collecte.prop_photo_carte_identite_verso)) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Pièce d\'identité:', 20, yPosition);
      yPosition += 8;
      
      const imgWidth = 40;
      const imgHeight = 25;
      const spacing = 10;
      
      if (collecte.prop_photo_carte_identite_recto) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Recto:', 20, yPosition);
        yPosition += 3;
        try {
          doc.addImage(collecte.prop_photo_carte_identite_recto, 'JPEG', 20, yPosition, imgWidth, imgHeight);
        } catch (e) {
          doc.text('Impossible de charger l\'image', 20, yPosition);
        }
      }
      
      if (collecte.prop_photo_carte_identite_verso) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Verso:', 65, yPosition);
        yPosition += 3;
        try {
          doc.addImage(collecte.prop_photo_carte_identite_verso, 'JPEG', 65, yPosition, imgWidth, imgHeight);
        } catch (e) {
          doc.text('Impossible de charger l\'image', 65, yPosition);
        }
      }
      
      yPosition += imgHeight + spacing;
    }

    const proprietaireData = collecte.type_proprietaire === 'societe'
      ? [
          ['Raison sociale', collecte.societe_raison_sociale || ''],
          ['N° Registre de Commerce', collecte.societe_registre_commerce || ''],
          ['N° Compte contribuable', collecte.societe_compte_contribuable || ''],
          ['Adresse postale', collecte.societe_adresse_postale || ''],
          ['Ville', collecte.societe_ville || ''],
          ['Quartier', collecte.societe_quartier || ''],
          ['Téléphone', collecte.societe_tel || '']
        ]
      : [
          ['Nom', collecte.prop_nom || ''],
          ['Prénoms', collecte.prop_prenoms || ''],
          ['Date de naissance', collecte.prop_date_naissance || ''],
          ['Lieu de naissance', collecte.prop_lieu_naissance || ''],
          ['Nationalité', collecte.prop_nationalite || ''],
          ['N° Carte d\'identité', collecte.prop_carte_identite || ''],
          ['Adresse résidence', collecte.prop_adresse_postale || ''],
          ['Ville', collecte.prop_ville || ''],
          ['Quartier', collecte.prop_quartier_residence || ''],
          ['Téléphone', collecte.prop_tel || ''],
          ['Profession', collecte.prof_profession || ''],
          ['Situation familiale', collecte.situation_familiale || ''],
          ['Enfants à charge', String(collecte.nombre_enfants || '')],
          ['N° Compte contribuable', collecte.prop_compte_contribuable || '']
        ];

    doc.autoTable({
      startY: yPosition,
      head: [['Champ', 'Valeur']],
      body: proprietaireData,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('III - RENSEIGNEMENTS CONCERNANT LE BIEN', 20, yPosition);
    yPosition += 10;

    // Ajouter les photos de l'immeuble si disponibles
    if (collecte.bien_photo_facade || collecte.bien_photo_entree || collecte.bien_photo_general) {
      const photoFields = [
        { label: 'Façade', value: collecte.bien_photo_facade },
        { label: 'Entrée', value: collecte.bien_photo_entree },
        { label: 'Vue générale', value: collecte.bien_photo_general }
      ];

      const imgWidth = 45;
      const imgHeight = 35;
      let xPosition = 20;

      photoFields.forEach((photo) => {
        if (photo.value) {
          if (xPosition > 150) {
            doc.addPage();
            yPosition = 20;
            xPosition = 20;
          }

          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text(photo.label + ':', xPosition, yPosition);

          try {
            doc.addImage(photo.value, 'JPEG', xPosition, yPosition + 3, imgWidth, imgHeight);
          } catch (e) {
            doc.setFontSize(8);
            doc.text('Image non disponible', xPosition, yPosition + 15);
          }

          xPosition += imgWidth + 10;
        }
      });

      yPosition += imgHeight + 15;
    }

    doc.autoTable({
      startY: yPosition,
      head: [['Champ', 'Valeur']],
      body: [
        ['Nature du local', collecte.bien_nature_local || ''],
        ['Équipé en eau', collecte.bien_equipe_eau ? 'Oui' : 'Non'],
        ['Équipé en électricité', collecte.bien_equipe_electricite ? 'Oui' : 'Non'],
        ['Nombre de niveaux', String(collecte.bien_nombre_niveaux || '')],
        ['Nombre de bâtiments', String(collecte.bien_nombre_batiments || '')],
        ['Année d\'achèvement', collecte.bien_annee_achevement || ''],
        ['Nombre de pièces', String(collecte.bien_nombre_pieces || '')],
        ['Valeur locative mensuelle', String(collecte.bien_valeur_locative_mensuelle || '') + ' FCFA']
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    if (collecte.tableau_synthese && collecte.tableau_synthese.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('IV - TABLEAU DE SYNTHÈSE', 20, yPosition);
      yPosition += 10;

      const syntheseBody = collecte.tableau_synthese.map(row => [
        row.annee_achevement || '',
        row.nature_occupation || '',
        row.valeur_locative_annuelle ? `${row.valeur_locative_annuelle.toLocaleString('fr-FR')} FCFA` : '',
        String(row.nombre_pieces || '')
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Année achèvement', 'Nature occupation', 'Valeur locative annuelle', 'Nombre pièces']],
        body: syntheseBody,
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    if (collecte.gestion_par_agence && collecte.agence_raison_sociale) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('V - GESTION PAR AGENCE', 20, yPosition);
      yPosition += 10;

      doc.autoTable({
        startY: yPosition,
        head: [['Champ', 'Valeur']],
        body: [
          ['Raison sociale', collecte.agence_raison_sociale || ''],
          ['Ville', collecte.agence_ville || ''],
          ['Quartier', collecte.agence_quartier || ''],
          ['Téléphone', collecte.agence_tel || '']
        ],
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('VI - SIGNATURE AGENT RECENSEUR', 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Champ', 'Valeur']],
      body: [
        ['Date de collecte', collecte.date_collecte || ''],
        ['Nom et signature de l\'agent', collecte.signature_agent || '']
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });

    const pdfBuffer = doc.output('arraybuffer');
    const base64 = Buffer.from(pdfBuffer).toString('base64');

    return Response.json({
      success: true,
      file: base64,
      filename: `collecte_${collecte.commune || 'parcelle'}_${new Date().toISOString().split('T')[0]}.pdf`,
      mimeType: 'application/pdf'
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});