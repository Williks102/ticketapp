// app/api/tickets/[id]/pdf/route.ts - VERSION CORRIGÉE

import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest,
  requireAdmin
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { TicketStatus, toPrismaNumber } from '@/types/api'

// Interface pour typer les paramètres de route
interface RouteParams {
  params: { id: string }
}

// Interface pour les données du ticket PDF
interface TicketPdfData {
  id: string
  numeroTicket: string
  qrCode: string
  statut: TicketStatus
  prix: number
  createdAt: Date
  validatedAt?: Date | null
  validatedBy?: string | null
  event: {
    id: string
    titre: string
    description: string
    lieu: string
    adresse: string
    dateDebut: Date
    dateFin: Date
    organisateur: string
    image?: string | null
  }
  user?: {
    nom: string
    prenom: string
    email: string
  } | null
  guestEmail?: string | null
  guestNom?: string | null
  guestPrenom?: string | null
  guestTelephone?: string | null
}

// Fonction helper pour mapper les données Prisma
function mapTicketDataForPdf(prismaTicket: any): TicketPdfData {
  return {
    id: prismaTicket.id,
    numeroTicket: prismaTicket.numeroTicket,
    qrCode: prismaTicket.qrCode,
    statut: prismaTicket.statut as TicketStatus,
    prix: toPrismaNumber(prismaTicket.prix),
    createdAt: prismaTicket.createdAt,
    validatedAt: prismaTicket.validatedAt,
    validatedBy: prismaTicket.validatedBy,
    event: {
      id: prismaTicket.event.id,
      titre: prismaTicket.event.titre,
      description: prismaTicket.event.description,
      lieu: prismaTicket.event.lieu,
      adresse: prismaTicket.event.adresse,
      dateDebut: prismaTicket.event.dateDebut,
      dateFin: prismaTicket.event.dateFin,
      organisateur: prismaTicket.event.organisateur,
      image: prismaTicket.event.image
    },
    user: prismaTicket.user,
    guestEmail: prismaTicket.guestEmail,
    guestNom: prismaTicket.guestNom,
    guestPrenom: prismaTicket.guestPrenom,
    guestTelephone: prismaTicket.guestTelephone
  }
}

// Fonction pour générer le contenu HTML du PDF
function generateTicketHTML(ticket: TicketPdfData): string {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case 'VALID': return 'Valide'
      case 'USED': return 'Utilisé'
      case 'CANCELLED': return 'Annulé'
      case 'EXPIRED': return 'Expiré'
      default: return status
    }
  }

  const holderName = ticket.user 
    ? `${ticket.user.prenom} ${ticket.user.nom}`
    : `${ticket.guestPrenom} ${ticket.guestNom}`

  const holderEmail = ticket.user?.email || ticket.guestEmail

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Billet - ${ticket.event.titre}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .header h1 { font-size: 2em; margin-bottom: 10px; }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          background: white;
          color: #333;
          font-weight: bold;
          margin-top: 10px;
        }
        .content {
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 10px 10px;
          padding: 30px;
        }
        .section {
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .section:last-child { border-bottom: none; }
        .section h2 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 1.3em;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        .info-item {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 0.9em;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 1.1em;
          color: #333;
        }
        .qr-section {
          text-align: center;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
        }
        .qr-code {
          max-width: 200px;
          height: auto;
          border: 10px solid white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .ticket-number {
          font-family: 'Courier New', monospace;
          font-size: 1.2em;
          font-weight: bold;
          color: #667eea;
        }
        .description {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          text-align: center;
          color: #666;
          font-size: 0.9em;
        }
        @media print {
          body { padding: 0; }
          .header { border-radius: 0; }
          .content { border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${ticket.event.titre}</h1>
        <p>Billet électronique</p>
        <div class="status">${getStatusLabel(ticket.statut)}</div>
      </div>

      <div class="content">
        <div class="section">
          <h2>Informations du billet</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Numéro de billet</div>
              <div class="info-value ticket-number">${ticket.numeroTicket}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Prix</div>
              <div class="info-value">${formatPrice(ticket.prix)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date d'achat</div>
              <div class="info-value">${formatDate(ticket.createdAt)}</div>
            </div>
            ${ticket.validatedAt ? `
            <div class="info-item">
              <div class="info-label">Validé le</div>
              <div class="info-value">${formatDate(ticket.validatedAt)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h2>Détails de l'événement</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Date de début</div>
              <div class="info-value">${formatDate(ticket.event.dateDebut)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de fin</div>
              <div class="info-value">${formatDate(ticket.event.dateFin)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Lieu</div>
              <div class="info-value">${ticket.event.lieu}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Adresse</div>
              <div class="info-value">${ticket.event.adresse}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Organisateur</div>
              <div class="info-value">${ticket.event.organisateur}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Porteur du billet</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nom</div>
              <div class="info-value">${holderName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${holderEmail}</div>
            </div>
            ${ticket.guestTelephone ? `
            <div class="info-item">
              <div class="info-label">Téléphone</div>
              <div class="info-value">${ticket.guestTelephone}</div>
            </div>
            ` : ''}
            ${!ticket.user ? `
            <div class="info-item">
              <div class="info-label">Type</div>
              <div class="info-value">Invité</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="qr-section">
            <h2>Code QR</h2>
            <img src="${ticket.qrCode}" alt="QR Code" class="qr-code" />
            <p style="margin-top: 10px; color: #666;">
              Présentez ce code à l'entrée de l'événement
            </p>
          </div>
        </div>

        ${ticket.event.description ? `
        <div class="description">
          <h2>Description de l'événement</h2>
          <p>${ticket.event.description}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>
            Ce billet est personnel et non transférable. Toute reproduction est interdite.<br>
            Veuillez vous présenter 30 minutes avant le début avec une pièce d'identité.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validation du paramètre ID
    const ticketId = params.id
    if (!ticketId || typeof ticketId !== 'string') {
      return createApiError(
        'INVALID_PARAMETER',
        'ID de billet invalide',
        400
      )
    }

    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError(
        'UNAUTHORIZED',
        'Authentification requise',
        401
      )
    }

    // Récupérer le billet avec toutes les informations nécessaires
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            description: true,
            lieu: true,
            adresse: true,
            dateDebut: true,
            dateFin: true,
            organisateur: true,
            image: true
          }
        },
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiError(
        'TICKET_NOT_FOUND',
        'Billet non trouvé',
        404
      )
    }

    // Vérifier les permissions
    if (!requireAdmin(user) && ticket.userId !== user.userId) {
      return createApiError(
        'FORBIDDEN',
        'Accès interdit à ce billet',
        403
      )
    }

    // Mapper les données pour le PDF
    const ticketData = mapTicketDataForPdf(ticket)

    // Générer le HTML
    const htmlContent = generateTicketHTML(ticketData)

    // Déterminer le format de sortie
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'html'

    if (format === 'html') {
      // Retourner en HTML pour prévisualisation
      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        }
      })
    }

    // Pour une vraie génération PDF, vous pourriez utiliser puppeteer ou jsPDF
    // Ici on simule avec le HTML
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="billet-${ticket.numeroTicket}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}