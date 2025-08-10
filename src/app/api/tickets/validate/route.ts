// app/api/tickets/validate/route.ts
import { 
  createApiResponse, 
  createApiError, 
  validateRequired,
  authenticateRequest,
  requireAdmin,
  comparePassword,
  generateToken,
  hashPassword,
  validateEmail,
  validatePassword,
  generateTicketNumber,
  generateQRCode
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'

import { ValidateTicketRequest, ValidateTicketResponse } from '@/types/api'

// POST /api/tickets/validate - Valider un billet
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError(
        'UNAUTHORIZED',
        'Accès réservé aux administrateurs',
        403
      )
    }

    const body: ValidateTicketRequest = await request.json()

    if (!body.ticketCode) {
      return createApiError(
        'VALIDATION_ERROR',
        'Code de billet requis',
        400
      )
    }

    // Rechercher le billet par numéro de ticket
    const ticket = await prisma.ticket.findUnique({
      where: { numeroTicket: body.ticketCode },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            lieu: true,
            dateDebut: true,
            dateFin: true
          }
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    if (!ticket) {
      const response: ValidateTicketResponse = {
        success: false,
        message: 'Billet non trouvé. Vérifiez le code QR ou le numéro de billet.'
      }
      return createApiResponse(response)
    }

    // Vérifier le statut du billet
    if (ticket.statut === 'CANCELLED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: {
          id: ticket.id,
          numeroTicket: ticket.numeroTicket,
          qrCode: ticket.qrCode,
          statut: ticket.statut,
          prix: ticket.prix,
          createdAt: ticket.createdAt.toISOString(),
          event: {
            id: ticket.event.id,
            titre: ticket.event.titre,
            lieu: ticket.event.lieu,
            dateDebut: ticket.event.dateDebut.toISOString(),
            dateFin: ticket.event.dateFin.toISOString()
          },
          user: ticket.user ? {
            id: ticket.user.id,
            nom: ticket.user.nom,
            prenom: ticket.user.prenom,
            email: ticket.user.email
          } : undefined,
          guestInfo: !ticket.user ? {
            email: ticket.guestEmail || '',
            nom: ticket.guestNom || '',
            prenom: ticket.guestPrenom || '',
            telephone: ticket.guestTelephone
          } : undefined
        },
        message: 'Ce billet a été annulé et ne peut pas être utilisé.'
      }
      return createApiResponse(response)
    }

    if (ticket.statut === 'USED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: {
          id: ticket.id,
          numeroTicket: ticket.numeroTicket,
          qrCode: ticket.qrCode,
          statut: ticket.statut,
          prix: ticket.prix,
          createdAt: ticket.createdAt.toISOString(),
          event: {
            id: ticket.event.id,
            titre: ticket.event.titre,
            lieu: ticket.event.lieu,
            dateDebut: ticket.event.dateDebut.toISOString(),
            dateFin: ticket.event.dateFin.toISOString()
          },
          user: ticket.user ? {
            id: ticket.user.id,
            nom: ticket.user.nom,
            prenom: ticket.user.prenom,
            email: ticket.user.email
          } : undefined,
          guestInfo: !ticket.user ? {
            email: ticket.guestEmail || '',
            nom: ticket.guestNom || '',
            prenom: ticket.guestPrenom || '',
            telephone: ticket.guestTelephone
          } : undefined
        },
        message: 'Ce billet a déjà été utilisé.'
      }
      return createApiResponse(response)
    }

    // Vérifier la date de l'événement (optionnel, selon la politique)
    const now = new Date()
    const eventDate = ticket.event.dateDebut
    const timeDiff = Math.abs(now.getTime() - eventDate.getTime())
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    // Permettre la validation 1 jour avant et après l'événement
    if (daysDiff > 1) {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: {
          id: ticket.id,
          numeroTicket: ticket.numeroTicket,
          qrCode: ticket.qrCode,
          statut: ticket.statut,
          prix: ticket.prix,
          createdAt: ticket.createdAt.toISOString(),
          event: {
            id: ticket.event.id,
            titre: ticket.event.titre,
            lieu: ticket.event.lieu,
            dateDebut: ticket.event.dateDebut.toISOString(),
            dateFin: ticket.event.dateFin.toISOString()
          }
        },
        message: `Ce billet est valide mais l'événement a lieu le ${eventDate.toLocaleDateString('fr-FR')}.`
      }
      return createApiResponse(response)
    }

    // Marquer le billet comme utilisé
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { 
        statut: 'USED',
        updatedAt: new Date()
      },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            lieu: true,
            dateDebut: true,
            dateFin: true
          }
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    const response: ValidateTicketResponse = {
      success: true,
      ticket: {
        id: updatedTicket.id,
        numeroTicket: updatedTicket.numeroTicket,
        qrCode: updatedTicket.qrCode,
        statut: updatedTicket.statut,
        prix: updatedTicket.prix,
        createdAt: updatedTicket.createdAt.toISOString(),
        event: {
          id: updatedTicket.event.id,
          titre: updatedTicket.event.titre,
          lieu: updatedTicket.event.lieu,
          dateDebut: updatedTicket.event.dateDebut.toISOString(),
          dateFin: updatedTicket.event.dateFin.toISOString()
        },
        user: updatedTicket.user ? {
          id: updatedTicket.user.id,
          nom: updatedTicket.user.nom,
          prenom: updatedTicket.user.prenom,
          email: updatedTicket.user.email
        } : undefined,
        guestInfo: !updatedTicket.user ? {
          email: updatedTicket.guestEmail || '',
          nom: updatedTicket.guestNom || '',
          prenom: updatedTicket.guestPrenom || '',
          telephone: updatedTicket.guestTelephone
        } : undefined
      },
      message: 'Billet validé avec succès ! Accès autorisé.',
      scannedAt: new Date().toISOString()
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la validation du billet:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}