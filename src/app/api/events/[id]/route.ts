// app/api/events/[id]/route.ts
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

    // Calculer les statistiques
    const ticketsVendus = event.tickets.filter(t => t.statut !== 'CANCELLED').length
    const revenue = event.tickets
      .filter(t => t.statut !== 'CANCELLED')
      .reduce((sum, ticket) => sum + ticket.prix, 0)

    const response: EventResponse = {
      id: event.id,
      titre: event.titre,
      description: event.description,
      lieu: event.lieu,
      adresse: event.adresse,
      dateDebut: event.dateDebut.toISOString(),
      dateFin: event.dateFin.toISOString(),
      prix: event.prix,
      nbPlaces: event.nbPlaces,
      placesRestantes: event.placesRestantes,
      statut: event.statut,
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

    const body = await request.json()

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

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date()
    }

    // Valider et ajouter les champs modifiables
    if (body.titre) updateData.titre = body.titre
    if (body.description) updateData.description = body.description
    if (body.lieu) updateData.lieu = body.lieu
    if (body.adresse) updateData.adresse = body.adresse
    if (body.organisateur) updateData.organisateur = body.organisateur
    if (body.image !== undefined) updateData.image = body.image
    if (body.statut) updateData.statut = body.statut

    // Validation spéciale pour les dates
    if (body.dateDebut || body.dateFin) {
      const dateDebut = body.dateDebut ? new Date(body.dateDebut) : existingEvent.dateDebut
      const dateFin = body.dateFin ? new Date(body.dateFin) : existingEvent.dateFin

      if (dateFin <= dateDebut) {
        return createApiError(
          'INVALID_DATE',
          'La date de fin doit être après la date de début',
          400
        )
      }

      if (body.dateDebut) updateData.dateDebut = dateDebut
      if (body.dateFin) updateData.dateFin = dateFin
    }

    // Validation du prix
    if (body.prix !== undefined) {
      if (body.prix < 0) {
        return createApiError(
          'INVALID_PRICE',
          'Le prix ne peut pas être négatif',
          400
        )
      }
      updateData.prix = body.prix
    }

    // Validation du nombre de places
    if (body.nbPlaces !== undefined) {
      if (body.nbPlaces < 1) {
        return createApiError(
          'INVALID_PLACES',
          'Le nombre de places doit être supérieur à 0',
          400
        )
      }

      // Vérifier qu'on ne réduit pas en dessous des billets déjà vendus
      const soldTickets = await prisma.ticket.count({
        where: {
          eventId: params.id,
          statut: { not: 'CANCELLED' }
        }
      })

      if (body.nbPlaces < soldTickets) {
        return createApiError(
          'INVALID_PLACES',
          `Impossible de réduire à ${body.nbPlaces} places car ${soldTickets} billets ont déjà été vendus`,
          400
        )
      }

      updateData.nbPlaces = body.nbPlaces
      updateData.placesRestantes = body.nbPlaces - soldTickets
    }

    // Mettre à jour l'événement
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData
    })

    const response: EventResponse = {
      id: updatedEvent.id,
      titre: updatedEvent.titre,
      description: updatedEvent.description,
      lieu: updatedEvent.lieu,
      adresse: updatedEvent.adresse,
      dateDebut: updatedEvent.dateDebut.toISOString(),
      dateFin: updatedEvent.dateFin.toISOString(),
      prix: updatedEvent.prix,
      nbPlaces: updatedEvent.nbPlaces,
      placesRestantes: updatedEvent.placesRestantes,
      statut: updatedEvent.statut,
      organisateur: updatedEvent.organisateur,
      image: updatedEvent.image,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString()
    }

    return createApiResponse(response, 200, 'Événement mis à jour avec succès')

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
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          where: { statut: { not: 'CANCELLED' } }
        }
      }
    })

    if (!existingEvent) {
      return createApiError(
        'EVENT_NOT_FOUND',
        'Événement non trouvé',
        404
      )
    }

    // Vérifier qu'il n'y a pas de billets vendus
    if (existingEvent.tickets.length > 0) {
      return createApiError(
        'CANNOT_DELETE',
        'Impossible de supprimer un événement avec des billets vendus',
        400
      )
    }

    // Supprimer l'événement (les billets annulés seront supprimés en cascade)
    await prisma.event.delete({
      where: { id: params.id }
    })

    return createApiResponse(
      { message: 'Événement supprimé avec succès' },
      200
    )

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