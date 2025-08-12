// app/api/user/tickets/[id]/route.ts
import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { TicketResponse } from '@/types/api'

interface RouteParams {
  params: { id: string }
}

// GET - Récupérer un billet spécifique de l'utilisateur
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Non autorisé', 401)
    }

    const ticketId = params.id
    const userId = user.id

    // Récupérer le billet avec toutes les informations
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId: userId // S'assurer que l'utilisateur possède ce billet
      },
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
            image: true,
            categories: true
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
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Formatage de la réponse
    const formattedTicket: TicketResponse = {
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut as any,
      prix: ticket.prix,
      validatedAt: ticket.validatedAt?.toISOString() || null,
      validatedBy: ticket.validatedBy || null,
      createdAt: ticket.createdAt.toISOString(),
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString()
      },
      user: ticket.user ? {
        id: user.id,
        nom: ticket.user.nom,
        prenom: ticket.user.prenom,
        email: ticket.user.email
      } : undefined
    }

    return createApiResponse(formattedTicket)

  } catch (error) {
    console.error('Erreur récupération billet:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur interne du serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}