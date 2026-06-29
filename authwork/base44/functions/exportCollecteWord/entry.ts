import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, AlignmentType, HeadingLevel, VerticalAlign } from 'npm:docx@8.12.6';

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

    const createBorderedCell = (content, width = null, options = {}) => {
      return new TableCell({
        children: [
          new Paragraph({
            text: content || '',
            alignment: options.alignment || AlignmentType.LEFT,
            bold: options.bold || false
          })
        ],
        width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
        borders: {
          top: { color: '000000', space: 1, style: BorderStyle.SINGLE },
          bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE },
          left: { color: '000000', space: 1, style: BorderStyle.SINGLE },
          right: { color: '000000', space: 1, style: BorderStyle.SINGLE }
        },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
      });
    };

    const sections = [];

    sections.push(
      new Paragraph({
        text: 'MINISTERE DE L\'ECONOMIE ET DES FINANCES',
        bold: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 }
      }),
      new Paragraph({
        text: 'DIRECTION GENERALE DES IMPOTS - DIRECTION DU CADASTRE',
        bold: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: 'OPERATION DE RECENSEMENT DES PROPRIETAIRES FONCIERS',
        bold: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    sections.push(
      new Paragraph({
        text: 'I - INFORMATIONS SUR LA PARCELLE',
        bold: true,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            height: { value: 300, rule: 'auto' },
            children: [
              createBorderedCell('Commune', 50, { bold: true }),
              createBorderedCell(collecte.commune || '', 50)
            ]
          }),
          new TableRow({
            height: { value: 300, rule: 'auto' },
            children: [
              createBorderedCell('Section', 50, { bold: true }),
              createBorderedCell(collecte.section || '', 50)
            ]
          }),
          new TableRow({
            height: { value: 300, rule: 'auto' },
            children: [
              createBorderedCell('Parcelle', 50, { bold: true }),
              createBorderedCell(collecte.parcelle || '', 50)
            ]
          }),
          new TableRow({
            height: { value: 300, rule: 'auto' },
            children: [
              createBorderedCell('Quartier', 50, { bold: true }),
              createBorderedCell(collecte.quartier || '', 50)
            ]
          }),
          new TableRow({
            height: { value: 300, rule: 'auto' },
            children: [
              createBorderedCell('Lot', 25, { bold: true }),
              createBorderedCell(collecte.lot || '', 25),
              createBorderedCell('Îlot', 25, { bold: true }),
              createBorderedCell(collecte.ilot || '', 25)
            ]
          }),
          new TableRow({
            height: { value: 300, rule: 'auto' },
            children: [
              createBorderedCell('Surface Imposable (m²)', 50, { bold: true }),
              createBorderedCell(String(collecte.surface_imposable || ''), 50)
            ]
          }),
          new TableRow({
            height: { value: 300, rule: 'auto' },
            children: [
              createBorderedCell('Référence DGI', 50, { bold: true }),
              createBorderedCell(collecte.reference_dgi || '', 50)
            ]
          })
        ]
      })
    );

    const proprietaireTitle = collecte.type_proprietaire === 'societe'
      ? 'II - RENSEIGNEMENTS SUR LE PROPRIETAIRE (Société/Personne Morale)'
      : 'II - RENSEIGNEMENTS SUR LE PROPRIETAIRE (Particulier)';

    sections.push(
      new Paragraph({
        text: proprietaireTitle,
        bold: true,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    if (collecte.type_proprietaire === 'societe') {
      sections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createBorderedCell('Raison sociale', 50, { bold: true }),
                createBorderedCell(collecte.societe_raison_sociale || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('N° Registre de Commerce', 50, { bold: true }),
                createBorderedCell(collecte.societe_registre_commerce || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('N° Compte contribuable', 50, { bold: true }),
                createBorderedCell(collecte.societe_compte_contribuable || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Adresse postale', 50, { bold: true }),
                createBorderedCell(collecte.societe_adresse_postale || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Ville', 25, { bold: true }),
                createBorderedCell(collecte.societe_ville || '', 25),
                createBorderedCell('Quartier', 25, { bold: true }),
                createBorderedCell(collecte.societe_quartier || '', 25)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Téléphone', 50, { bold: true }),
                createBorderedCell(collecte.societe_tel || '', 50)
              ]
            })
          ]
        })
      );
    } else {
      sections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createBorderedCell('Nom', 25, { bold: true }),
                createBorderedCell(collecte.prop_nom || '', 25),
                createBorderedCell('Prénoms', 25, { bold: true }),
                createBorderedCell(collecte.prop_prenoms || '', 25)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Date de naissance', 25, { bold: true }),
                createBorderedCell(collecte.prop_date_naissance || '', 25),
                createBorderedCell('Lieu de naissance', 25, { bold: true }),
                createBorderedCell(collecte.prop_lieu_naissance || '', 25)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Nationalité', 50, { bold: true }),
                createBorderedCell(collecte.prop_nationalite || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('N° Carte d\'identité', 50, { bold: true }),
                createBorderedCell(collecte.prop_carte_identite || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Adresse résidence', 50, { bold: true }),
                createBorderedCell(collecte.prop_adresse_postale || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Ville', 25, { bold: true }),
                createBorderedCell(collecte.prop_ville || '', 25),
                createBorderedCell('Quartier', 25, { bold: true }),
                createBorderedCell(collecte.prop_quartier_residence || '', 25)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Téléphone', 50, { bold: true }),
                createBorderedCell(collecte.prop_tel || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Profession', 50, { bold: true }),
                createBorderedCell(collecte.prof_profession || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Situation familiale', 25, { bold: true }),
                createBorderedCell(collecte.situation_familiale || '', 25),
                createBorderedCell('Enfants à charge', 25, { bold: true }),
                createBorderedCell(String(collecte.nombre_enfants || ''), 25)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('N° Compte contribuable', 50, { bold: true }),
                createBorderedCell(collecte.prop_compte_contribuable || '', 50)
              ]
            })
          ]
        })
      );
    }

    sections.push(
      new Paragraph({
        text: 'III - RENSEIGNEMENTS CONCERNANT LE BIEN',
        bold: true,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createBorderedCell('Nature du local', 50, { bold: true }),
              createBorderedCell(collecte.bien_nature_local || '', 50)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell('Équipé en eau', 25, { bold: true }),
              createBorderedCell(collecte.bien_equipe_eau ? 'Oui' : 'Non', 25),
              createBorderedCell('Équipé en électricité', 25, { bold: true }),
              createBorderedCell(collecte.bien_equipe_electricite ? 'Oui' : 'Non', 25)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell('Nombre de niveaux', 25, { bold: true }),
              createBorderedCell(String(collecte.bien_nombre_niveaux || ''), 25),
              createBorderedCell('Nombre de bâtiments', 25, { bold: true }),
              createBorderedCell(String(collecte.bien_nombre_batiments || ''), 25)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell('Année d\'achèvement', 50, { bold: true }),
              createBorderedCell(collecte.bien_annee_achevement || '', 50)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell('Nombre de pièces', 25, { bold: true }),
              createBorderedCell(String(collecte.bien_nombre_pieces || ''), 25),
              createBorderedCell('Val. locative mensuelle', 25, { bold: true }),
              createBorderedCell(String(collecte.bien_valeur_locative_mensuelle || '') + ' FCFA', 25)
            ]
          })
        ]
      })
    );

    if (collecte.tableau_synthese && collecte.tableau_synthese.length > 0) {
      sections.push(
        new Paragraph({
          text: 'IV - TABLEAU DE SYNTHÈSE',
          bold: true,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createBorderedCell('Année achèvement', 25, { bold: true }),
                createBorderedCell('Nature occupation', 25, { bold: true }),
                createBorderedCell('Valeur locative annuelle', 25, { bold: true }),
                createBorderedCell('Nombre pièces', 25, { bold: true })
              ]
            }),
            ...collecte.tableau_synthese.map(row =>
              new TableRow({
                children: [
                  createBorderedCell(row.annee_achevement || ''),
                  createBorderedCell(row.nature_occupation || ''),
                  createBorderedCell(String(row.valeur_locative_annuelle || '')),
                  createBorderedCell(String(row.nombre_pieces || ''))
                ]
              })
            )
          ]
        })
      );
    }

    if (collecte.gestion_par_agence && collecte.agence_raison_sociale) {
      sections.push(
        new Paragraph({
          text: 'V - GESTION PAR AGENCE',
          bold: true,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createBorderedCell('Raison sociale', 50, { bold: true }),
                createBorderedCell(collecte.agence_raison_sociale || '', 50)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Ville', 25, { bold: true }),
                createBorderedCell(collecte.agence_ville || '', 25),
                createBorderedCell('Quartier', 25, { bold: true }),
                createBorderedCell(collecte.agence_quartier || '', 25)
              ]
            }),
            new TableRow({
              children: [
                createBorderedCell('Téléphone', 50, { bold: true }),
                createBorderedCell(collecte.agence_tel || '', 50)
              ]
            })
          ]
        })
      );
    }

    sections.push(
      new Paragraph({
        text: 'VI - SIGNATURE AGENT RECENSEUR',
        bold: true,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createBorderedCell('Date de collecte', 50, { bold: true }),
              createBorderedCell(collecte.date_collecte || '', 50)
            ]
          }),
          new TableRow({
            children: [
              createBorderedCell('Nom et signature de l\'agent', 50, { bold: true }),
              createBorderedCell(collecte.signature_agent || '', 50)
            ]
          })
        ]
      }),
      new Paragraph({ text: '', spacing: { after: 400 } })
    );

    const doc = new Document({
      sections: [
        {
          children: sections
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = buffer.toString('base64');

    return Response.json({
      success: true,
      file: base64,
      filename: `collecte_${collecte.commune || 'parcelle'}_${new Date().toISOString().split('T')[0]}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});