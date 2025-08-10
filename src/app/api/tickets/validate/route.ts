// src/app/api/tickets/validate/route.ts - VERSION CORRIGÉE

import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest,
  requireAdmin
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { 
  ValidateTicketRequest, 
  ValidateTicketResponse, 
  TicketResponse, 
  TicketStatus,
  toPrismaNumber
} from '@/types/api'

// Fonction helper pour créer la réponse ticket avec types corrects
function createTicketResponse(ticketData: any): TicketResponse {
  return {
    id: ticketData.id,
    numeroTicket: ticketData.numeroTicket,
    qrCode: ticketData.qrCode,
    statut: ticketData.statut as TicketStatus,
    prix: toPrismaNumber(ticketData.prix),
    createdAt: ticketData.createdAt.toISOString(),
    event: {
      id: ticketData.event.id,
      titre: ticketData.event.titre,
      lieu: ticketData.event.lieu,
      dateDebut: ticketData.event.dateDebut.toISOString(),
      dateFin: ticketData.event.dateFin.toISOString()
    },
    user: ticketData.user ? {
      id: ticketData.user.id,
      nom: ticketData.user.nom,
      prenom: ticketData.user.prenom,
      email: ticketData.user.email
    } : undefined,
    guestInfo: !ticketData.user ? {
      email: ticketData.guestEmail || null,
      nom: ticketData.guestNom || null,
      prenom: ticketData.guestPrenom || null,
      telephone: ticketData.guestTelephone || null
    } : undefined
  }
}

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

    // Vérifier le statut du billet - ANNULÉ
    if (ticket.statut === 'CANCELLED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: 'Ce billet a été annulé et ne peut pas être utilisé.'
      }
      return createApiResponse(response)
    }

    // Vérifier le statut du billet - EXPIRÉ
    if (ticket.statut === 'EXPIRED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: 'Ce billet a expiré et ne peut plus être utilisé.'
      }
      return createApiResponse(response)
    }

    // Vérifier le statut du billet - DÉJÀ UTILISÉ
    if (ticket.statut === 'USED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: 'Ce billet a déjà été utilisé.'
      }
      return createApiResponse(response)
    }

    // Vérifier si l'événement correspond (si spécifié)
    if (body.eventId && ticket.event.id !== body.eventId) {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: 'Ce billet n\'est pas valide pour cet événement.'
      }
      return createApiResponse(response)
    }

    // Vérifier la date de l'événement
    const now = new Date()
    const eventStart = new Date(ticket.event.dateDebut)
    const eventEnd = new Date(ticket.event.dateFin)

    if (now < eventStart) {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: `L'événement n'a pas encore commencé. Début prévu le ${eventStart.toLocaleDateString('fr-FR')}.`
      }
      return createApiResponse(response)
    }

    if (now > eventEnd) {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: `L'événement est terminé depuis le ${eventEnd.toLocaleDateString('fr-FR')}.`
      }
      return createApiResponse(response)
    }

    // Valider le billet
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        statut: 'USED',
        validatedAt: new Date(),
        validatedBy: user.userId
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
      message: 'Billet validé avec succès !',
      ticket: createTicketResponse(updatedTicket),
      validationInfo: {
        validatedAt: updatedTicket.validatedAt!.toISOString(),
        validatedBy: updatedTicket.validatedBy!
      }
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