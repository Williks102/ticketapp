import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError, 
  validateRequired,
  authenticateRequest,
  requireAdmin
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { 
  EventResponse, 
  UpdateEventRequest,
  EventStatus,  // ← NOUVEAU
  toPrismaNumber  // ← NOUVEAU (optionnel)
} from '@/types/api'

interface RouteParams {
  params: { id: string }
}

// GET /api/events/[id] - Récupérer un événement spécifique
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          select: {
            id: true,
            prix: true,
            statut: true
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

    // Calculer les statistiques avec conversion TypeScript
    const validTickets = event.tickets.filter(t => t.statut !== 'CANCELLED')
    const ticketsVendus = validTickets.length
    const revenue = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)

    const response: EventResponse = {
      id: event.id,
      titre: event.titre,
      description: event.description,
      lieu: event.lieu,
      adresse: event.adresse,
      dateDebut: event.dateDebut.toISOString(),
      dateFin: event.dateFin.toISOString(),
      prix: Number(event.prix),
      nbPlaces: event.nbPlaces,
      placesRestantes: event.placesRestantes,
      statut: event.statut as 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE',
      organisateur: event.organisateur,
      image: event.image,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      ticketsVendus,
      revenue
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/events/[id] - Mettre à jour un événement
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError(
        'UNAUTHORIZED',
        'Accès réservé aux administrateurs',
        403
      )
    }

    const body: UpdateEventRequest = await request.json()

    // Vérifier que l'événement existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id }
    })

    if (!existingEvent) {
      return createApiError(
        'EVENT_NOT_FOUND',
        'Événement non trouvé',
        404
      )
    }

    // Validation des dates si elles sont modifiées
    if (body.dateDebut || body.dateFin) {
      const dateDebut = body.dateDebut ? new Date(body.dateDebut) : existingEvent.dateDebut
      const dateFin = body.dateFin ? new Date(body.dateFin) : existingEvent.dateFin

      if (dateFin <= dateDebut) {
        return createApiError(
          'VALIDATION_ERROR',
          'La date de fin doit être après la date de début',
          400
        )
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (body.titre !== undefined) updateData.titre = body.titre
    if (body.description !== undefined) updateData.description = body.description
    if (body.lieu !== undefined) updateData.lieu = body.lieu
    if (body.adresse !== undefined) updateData.adresse = body.adresse
    if (body.dateDebut !== undefined) updateData.dateDebut = new Date(body.dateDebut)
    if (body.dateFin !== undefined) updateData.dateFin = new Date(body.dateFin)
    if (body.prix !== undefined) updateData.prix = body.prix
    if (body.nbPlaces !== undefined) {
      updateData.nbPlaces = body.nbPlaces
      // Recalculer les places restantes
      const ticketsVendus = await prisma.ticket.count({
        where: { 
          eventId: params.id,
          statut: { not: 'CANCELLED' }
        }
      })
      updateData.placesRestantes = body.nbPlaces - ticketsVendus
    }
    if (body.organisateur !== undefined) updateData.organisateur = body.organisateur
    if (body.image !== undefined) updateData.image = body.image
    if (body.statut !== undefined) updateData.statut = body.statut

    // Mettre à jour l'événement
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tickets: {
          select: {
            id: true,
            prix: true,
            statut: true
          }
        }
      }
    })

    // Calculer les statistiques
    const validTickets = updatedEvent.tickets.filter(t => t.statut !== 'CANCELLED')
    const ticketsVendus = validTickets.length
    const revenue = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)

    const response: EventResponse = {
      id: updatedEvent.id,
      titre: updatedEvent.titre,
      description: updatedEvent.description,
      lieu: updatedEvent.lieu,
      adresse: updatedEvent.adresse,
      dateDebut: updatedEvent.dateDebut.toISOString(),
      dateFin: updatedEvent.dateFin.toISOString(),
      prix: Number(updatedEvent.prix),
      nbPlaces: updatedEvent.nbPlaces,
      placesRestantes: updatedEvent.placesRestantes,
      statut: updatedEvent.statut as 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE',
      organisateur: updatedEvent.organisateur,
      image: updatedEvent.image,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString(),
      ticketsVendus,
      revenue
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/events/[id] - Supprimer un événement
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError(
        'UNAUTHORIZED',
        'Accès réservé aux administrateurs',
        403
      )
    }

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        tickets: true
      }
    })

    if (!event) {
      return createApiError(
        'EVENT_NOT_FOUND',
        'Événement non trouvé',
        404
      )
    }

    // Vérifier s'il y a des billets vendus
    const activeTickets = event.tickets.filter(t => t.statut !== 'CANCELLED')
    if (activeTickets.length > 0) {
      return createApiError(
        'CONFLICT',
        'Impossible de supprimer un événement avec des billets vendus',
        409
      )
    }

    // Supprimer l'événement (les billets seront supprimés en cascade)
    await prisma.event.delete({
      where: { id: params.id }
    })

    return createApiResponse({ message: 'Événement supprimé avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}