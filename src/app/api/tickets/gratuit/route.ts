// src/app/api/billets/gratuit/route.ts
import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError, 
  authenticateRequest,
  generateTicketNumber,
  generateQRCode
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError(
        'UNAUTHORIZED', 
        'Connexion requise pour réserver un billet gratuit', 
        401
      )
    }

    const { eventId } = await request.json()
    
    if (!eventId) {
      return createApiError(
        'VALIDATION_ERROR',
        'ID de l\'événement requis',
        400
      )
    }

    // Vérifier que l'événement existe et est gratuit
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: {
          where: { 
            userId: user.id,
            statut: { not: 'CANCELLED' }
          }
        }
      }
    })
    
    if (!event) {
      return createApiError(
        'EVENT_NOT_FOUND',
        'Événement non trouvé',
        404
      )
    }

    // Vérifier que l'événement est bien gratuit
    if (event.prix !== 0) {
      return createApiError(
        'INVALID_EVENT',
        'Cet événement n\'est pas gratuit',
        400
      )
    }

    // Vérifier que l'événement est actif
    if (event.statut !== 'ACTIVE') {
      return createApiError(
        'EVENT_INACTIVE',
        'Cet événement n\'est plus disponible',
        400
      )
    }

    // Vérifier qu'il reste des places
    if (event.placesRestantes <= 0) {
      return createApiError(
        'EVENT_FULL',
        'Plus de places disponibles pour cet événement',
        400
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà un billet pour cet événement
    if (event.tickets.length > 0) {
      return createApiError(
        'DUPLICATE_TICKET',
        'Vous avez déjà un billet pour cet événement',
        400
      )
    }

    // Générer les données du billet
    const numeroTicket = generateTicketNumber()
    const ticketData = {
      id: `ticket_${numeroTicket}`,
      eventId: event.id,
      userId: user.id,
      numeroTicket,
      prix: 0
    }
    const qrCode = await generateQRCode(JSON.stringify(ticketData))

    // Créer le billet dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer le billet
      const ticket = await tx.ticket.create({
        data: {
          numeroTicket,
          qrCode,
          prix: 0,
          eventId: event.id,
          userId: user.id,
          statut: 'VALID'
        },
        include: {
          event: {
            select: {
              id: true,
              titre: true,
              lieu: true,
              adresse: true,
              dateDebut: true,
              dateFin: true,
              organisateur: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true
            }
          }
        }
      })

      // Décrémenter les places restantes
      await tx.event.update({
        where: { id: event.id },
        data: {
          placesRestantes: {
            decrement: 1
          }
        }
      })

      // Log de l'activité
      await tx.activityLog.create({
        data: {
          type: 'USER_ACTION',
          entity: 'ticket',
          entityId: ticket.id,
          action: 'free_reservation',
          newData: {
            ticketNumber: numeroTicket,
            eventTitle: event.titre,
            amount: 0
          },
          userId: user.id
        }
      })

      return ticket
    })

    const response = {
      id: result.id,
      numeroTicket: result.numeroTicket,
      qrCode: result.qrCode,
      statut: result.statut,
      prix: result.prix,
      createdAt: result.createdAt.toISOString(),
      event: {
        id: result.event.id,
        titre: result.event.titre,
        lieu: result.event.lieu,
        adresse: result.event.adresse,
        dateDebut: result.event.dateDebut.toISOString(),
        dateFin: result.event.dateFin.toISOString(),
        organisateur: result.event.organisateur
      },
      user: result.user
    }

    return createApiResponse(response, 201)

  } catch (error) {
    console.error('❌ Erreur création billet gratuit:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}