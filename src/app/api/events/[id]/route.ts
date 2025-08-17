// src/app/api/events/[id]/route.ts - VERSION COMPLÈTEMENT CORRIGÉE (API PUBLIQUE)
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, validateRequired, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { EventResponse, UpdateEventRequest } from '@/types/api'

interface RouteParams {
  params: { id: string }
}

// GET /api/events/[id] - Récupérer un événement spécifique (publique)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('🔄 Récupération de l\'événement:', params.id)

    // Validation de l'ID
    if (!params.id || params.id.trim() === '') {
      return createApiError('INVALID_ID', 'ID d\'événement invalide', 400)
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          where: { statut: { not: 'CANCELLED' } },
          select: {
            id: true,
            prix: true,
            statut: true,
            createdAt: true
          }
        },
        eventStats: {
          select: {
            ticketsSold: true,
            revenue: true,
            conversionRate: true,
            averagePrice: true,
            salesByDay: true,
            hourlyStats: true
          }
        }
      }
    })

    if (!event) {
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    // Vérifier si l'événement est visible publiquement
    const user = await authenticateRequest(request).catch(() => null)
    const isAdmin = user && requireAdmin(user)

    // Seuls les admins peuvent voir les événements non-actifs
    if (event.statut !== 'ACTIVE' && !isAdmin) {
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    // Calculer les statistiques avec conversion TypeScript
    const validTickets = event.tickets
    const ticketsVendus = validTickets.length
    const revenue = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    const tauxRemplissage = event.nbPlaces > 0 ? Math.round((ticketsVendus / event.nbPlaces) * 100) : 0

    // ✅ CORRECTION PRINCIPALE - Créer const response avec types corrects pour l'API publique
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
      statut: event.statut,
      organisateur: event.organisateur,
      image: event.image,
      categories: event.categories,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),

      // Propriétés calculées
      ticketsVendus,
      revenue,
      tauxRemplissage,
      isGratuit: event.prix === 0,
      isComplet: event.placesRestantes === 0,
      isUpcoming: event.dateDebut > new Date(),
      isPast: event.dateFin < new Date(),
      isOngoing: new Date() >= event.dateDebut && new Date() <= event.dateFin,

      // ✅ CORRECTION pour eventStats avec casting correct de JsonValue
      stats: event.eventStats ? {
        conversionRate: event.eventStats.conversionRate,
        averagePrice: Number(event.eventStats.averagePrice),
        
        // ✅ CASTING CORRECT pour salesByDay - résout l'erreur JsonValue
        salesByDay: event.eventStats.salesByDay ? 
          (event.eventStats.salesByDay as Array<{
            date: string
            sales: number
            revenue: number
          }>) : undefined,
        
        // ✅ CASTING CORRECT pour hourlyStats
        hourlyStats: event.eventStats.hourlyStats ? 
          (event.eventStats.hourlyStats as Array<{
            hour: number
            sales: number
            revenue: number
          }>) : undefined
      } : undefined
    }

    console.log('✅ Événement récupéré:', event.titre)

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API events/[id] GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la récupération de l\'événement', 500)
  }
}

// PUT /api/events/[id] - Mettre à jour un événement (admin seulement)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    console.log('🔄 Modification de l\'événement:', params.id)

    const body: UpdateEventRequest = await request.json()

    // Validation de l'ID
    if (!params.id || params.id.trim() === '') {
      return createApiError('INVALID_ID', 'ID d\'événement invalide', 400)
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
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    const ticketsVendus = existingEvent.tickets.length

    // Validation des données modifiées
    const updateData: any = {}

    // Validation et assignation des champs texte
    if (body.titre !== undefined) {
      if (!body.titre.trim()) {
        return createApiError('VALIDATION_ERROR', 'Le titre ne peut pas être vide', 400)
      }
      updateData.titre = body.titre.trim()
    }

    if (body.description !== undefined) {
      if (!body.description.trim()) {
        return createApiError('VALIDATION_ERROR', 'La description ne peut pas être vide', 400)
      }
      updateData.description = body.description.trim()
    }

    if (body.lieu !== undefined) {
      if (!body.lieu.trim()) {
        return createApiError('VALIDATION_ERROR', 'Le lieu ne peut pas être vide', 400)
      }
      updateData.lieu = body.lieu.trim()
    }

    if (body.adresse !== undefined) {
      updateData.adresse = body.adresse.trim()
    }

    if (body.organisateur !== undefined) {
      if (!body.organisateur.trim()) {
        return createApiError('VALIDATION_ERROR', 'L\'organisateur ne peut pas être vide', 400)
      }
      updateData.organisateur = body.organisateur.trim()
    }

    // Validation des dates
    if (body.dateDebut !== undefined || body.dateFin !== undefined) {
      const dateDebut = body.dateDebut ? new Date(body.dateDebut) : existingEvent.dateDebut
      const dateFin = body.dateFin ? new Date(body.dateFin) : existingEvent.dateFin

      if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
        return createApiError('VALIDATION_ERROR', 'Format de date invalide', 400)
      }

      if (dateFin <= dateDebut) {
        return createApiError('VALIDATION_ERROR', 'La date de fin doit être après la date de début', 400)
      }

      // Empêcher la modification des dates si l'événement a commencé
      const now = new Date()
      if (existingEvent.dateDebut <= now) {
        return createApiError(
          'VALIDATION_ERROR', 
          'Impossible de modifier les dates d\'un événement qui a déjà commencé', 
          400
        )
      }

      if (body.dateDebut !== undefined) updateData.dateDebut = dateDebut
      if (body.dateFin !== undefined) updateData.dateFin = dateFin
    }

    // Validation du prix
    if (body.prix !== undefined) {
      if (typeof body.prix !== 'number' || body.prix < 0) {
        return createApiError('VALIDATION_ERROR', 'Le prix doit être un nombre positif', 400)
      }

      // Empêcher la modification du prix si des billets sont vendus
      if (ticketsVendus > 0 && Number(existingEvent.prix) !== body.prix) {
        return createApiError(
          'VALIDATION_ERROR',
          'Impossible de modifier le prix après la vente de billets',
          400
        )
      }

      updateData.prix = Number(body.prix)
    }

    // Validation du nombre de places
    if (body.nbPlaces !== undefined) {
      if (typeof body.nbPlaces !== 'number' || body.nbPlaces < 1) {
        return createApiError('VALIDATION_ERROR', 'Le nombre de places doit être au moins 1', 400)
      }

      if (body.nbPlaces < ticketsVendus) {
        return createApiError(
          'VALIDATION_ERROR',
          `Impossible de réduire à ${body.nbPlaces} places (${ticketsVendus} billets déjà vendus)`,
          400
        )
      }

      updateData.nbPlaces = body.nbPlaces
      updateData.placesRestantes = body.nbPlaces - ticketsVendus
    }

    // Validation du statut
    if (body.statut !== undefined) {
      const statusValides = ['DRAFT', 'ACTIVE', 'INACTIVE', 'COMPLET', 'ANNULE', 'TERMINE']
      if (!statusValides.includes(body.statut)) {
        return createApiError('VALIDATION_ERROR', 'Statut invalide', 400)
      }
      updateData.statut = body.statut
    }

    // Autres champs optionnels
    if (body.image !== undefined) {
      updateData.image = body.image
    }

    if (body.categories !== undefined) {
      if (Array.isArray(body.categories)) {
        updateData.categories = body.categories
      }
    }

    // Mettre à jour l'événement
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'event',
        entityId: params.id,
        action: 'update',
        oldData: {
          titre: existingEvent.titre,
          statut: existingEvent.statut,
          prix: existingEvent.prix
        },
        newData: updateData,
        userId: user.id
      }
    })

    // Réponse avec les données mises à jour
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
      statut: updatedEvent.statut,
      organisateur: updatedEvent.organisateur,
      image: updatedEvent.image,
      categories: updatedEvent.categories,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString(),
      isGratuit: updatedEvent.prix === 0
    }

    console.log('✅ Événement modifié:', updatedEvent.titre)

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API events/[id] PUT:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la modification de l\'événement', 500)
  }
}

// DELETE /api/events/[id] - Supprimer un événement (admin seulement)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    console.log('🔄 Suppression de l\'événement:', params.id)

    // Validation de l'ID
    if (!params.id || params.id.trim() === '') {
      return createApiError('INVALID_ID', 'ID d\'événement invalide', 400)
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
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    // Vérifier s'il y a des billets actifs
    const activeTickets = existingEvent.tickets
    if (activeTickets.length > 0) {
      return createApiError(
        'CONFLICT',
        `Impossible de supprimer un événement avec ${activeTickets.length} billet(s) actif(s)`,
        409
      )
    }

    // Supprimer l'événement
    await prisma.event.delete({
      where: { id: params.id }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'event',
        entityId: params.id,
        action: 'delete',
        oldData: {
          titre: existingEvent.titre,
          prix: existingEvent.prix
        },
        userId: user.id
      }
    })

    console.log('✅ Événement supprimé:', existingEvent.titre)

    return createApiResponse({ 
      message: 'Événement supprimé avec succès',
      deletedEventId: params.id,
      deletedEventTitle: existingEvent.titre
    })

  } catch (error) {
    console.error('❌ Erreur API events/[id] DELETE:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la suppression de l\'événement', 500)
  }
}