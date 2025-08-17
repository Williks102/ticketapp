// src/app/api/events/[id]/route.ts - VERSION COMPLÈTE CORRIGÉE
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, validateRequired, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { EventResponse, UpdateEventRequest } from '@/types/api'

interface RouteParams {
  params: { id: string }
}

// GET /api/events/[id] - Récupérer un événement spécifique (publique)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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
            salesByDay: true
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
    const tauxRemplissage = event.nbPlaces > 0 ? (ticketsVendus / event.nbPlaces) * 100 : 0
    const placesRestantes = Math.max(0, event.nbPlaces - ticketsVendus)

    // Déterminer l'état de l'événement
    const now = new Date()
    const isUpcoming = event.dateDebut > now
    const isPast = event.dateFin < now
    const isOngoing = event.dateDebut <= now && event.dateFin > now
    const isComplet = placesRestantes === 0

    // Calculer les ventes récentes (derniers 7 jours)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentSales = validTickets.filter(ticket => 
      new Date(ticket.createdAt) >= weekAgo
    ).length

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
      placesRestantes,
      statut: event.statut as 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE' | 'TERMINE',
      organisateur: event.organisateur,
      image: event.image,
      categories: event.categories,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      ticketsVendus,
      revenue,
      tauxRemplissage: Math.round(tauxRemplissage * 100) / 100,
      isGratuit: Number(event.prix) === 0,
      isComplet,
      isUpcoming,
      isPast,
      isOngoing,
      recentSales,
      // Données supplémentaires pour les détails
      stats: event.eventStats ? {
        conversionRate: event.eventStats.conversionRate,
        averagePrice: Number(event.eventStats.averagePrice),
        salesByDay: event.eventStats.salesByDay
      } : undefined
    }

    console.log('✅ Événement récupéré:', event.titre)

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API events/[id] GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la récupération de l\'événement', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/events/[id] - Mettre à jour un événement (admin seulement)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
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
      if (ticketsVendus > 0 && Number(existingEvent.prix) !== body.prix * 100) {
        return createApiError(
          'VALIDATION_ERROR',
          'Impossible de modifier le prix après la vente de billets',
          400
        )
      }

      updateData.prix = Math.round(body.prix * 100) // Convertir en centimes
    }

    // Validation du nombre de places
    if (body.nbPlaces !== undefined) {
      if (typeof body.nbPlaces !== 'number' || body.nbPlaces <= 0) {
        return createApiError('VALIDATION_ERROR', 'Le nombre de places doit être un nombre positif', 400)
      }

      if (body.nbPlaces < ticketsVendus) {
        return createApiError(
          'VALIDATION_ERROR',
          `Impossible de réduire le nombre de places en dessous du nombre de billets vendus (${ticketsVendus})`,
          400
        )
      }

      updateData.nbPlaces = body.nbPlaces
      updateData.placesRestantes = body.nbPlaces - ticketsVendus
    }

    // Validation de l'image
    if (body.image !== undefined) {
      if (body.image && !isValidImageUrl(body.image)) {
        return createApiError('VALIDATION_ERROR', 'URL d\'image invalide', 400)
      }
      updateData.image = body.image?.trim() || null
    }

    // Validation des catégories
    if (body.categories !== undefined) {
      const validCategories = [
        'concert', 'theatre', 'festival', 'sport', 'conference', 
        'exposition', 'cinema', 'danse', 'spectacle', 'autre'
      ]
      if (body.categories.some((cat: string) => !validCategories.includes(cat))) {
        return createApiError('VALIDATION_ERROR', 'Catégorie invalide', 400)
      }
      updateData.categories = body.categories
    }

    // Validation du statut
    if (body.statut !== undefined) {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'COMPLET', 'ANNULE', 'TERMINE']
      if (!validStatuses.includes(body.statut)) {
        return createApiError('VALIDATION_ERROR', 'Statut invalide', 400)
      }

      // Logique métier pour les changements de statut
      if (body.statut === 'ANNULE' && ticketsVendus > 0) {
        // L'annulation nécessite une gestion des remboursements
        updateData.statut = 'ANNULE'
        // TODO: Déclencher le processus de remboursement
      } else {
        updateData.statut = body.statut
      }
    }

    // Si aucune modification, retourner l'événement actuel
    if (Object.keys(updateData).length === 0) {
      const response: EventResponse = {
        id: existingEvent.id,
        titre: existingEvent.titre,
        description: existingEvent.description,
        lieu: existingEvent.lieu,
        adresse: existingEvent.adresse,
        dateDebut: existingEvent.dateDebut.toISOString(),
        dateFin: existingEvent.dateFin.toISOString(),
        prix: Number(existingEvent.prix),
        nbPlaces: existingEvent.nbPlaces,
        placesRestantes: existingEvent.placesRestantes,
        statut: existingEvent.statut as any,
        organisateur: existingEvent.organisateur,
        image: existingEvent.image,
        categories: existingEvent.categories,
        createdAt: existingEvent.createdAt.toISOString(),
        updatedAt: existingEvent.updatedAt.toISOString(),
        ticketsVendus,
        revenue: existingEvent.tickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0),
        tauxRemplissage: existingEvent.nbPlaces > 0 ? (ticketsVendus / existingEvent.nbPlaces) * 100 : 0,
        isGratuit: Number(existingEvent.prix) === 0
      }

      return createApiResponse(response, 200, 'Aucune modification apportée')
    }

    // Effectuer la mise à jour
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tickets: {
          where: { statut: { not: 'CANCELLED' } },
          select: {
            id: true,
            prix: true,
            statut: true
          }
        }
      }
    })

    // Log de l'activité admin
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'event',
        entityId: params.id,
        action: 'update',
        oldData: {
          titre: existingEvent.titre,
          prix: existingEvent.prix,
          nbPlaces: existingEvent.nbPlaces,
          statut: existingEvent.statut
        },
        newData: updateData,
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          changedFields: Object.keys(updateData),
          timestamp: new Date().toISOString()
        }
      }
    })

    // Formater la réponse
    const updatedTicketsVendus = updatedEvent.tickets.length
    const updatedRevenue = updatedEvent.tickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    const updatedTauxRemplissage = updatedEvent.nbPlaces > 0 ? (updatedTicketsVendus / updatedEvent.nbPlaces) * 100 : 0

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
      placesRestantes: Math.max(0, updatedEvent.nbPlaces - updatedTicketsVendus),
      statut: updatedEvent.statut as any,
      organisateur: updatedEvent.organisateur,
      image: updatedEvent.image,
      categories: updatedEvent.categories,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString(),
      ticketsVendus: updatedTicketsVendus,
      revenue: updatedRevenue,
      tauxRemplissage: Math.round(updatedTauxRemplissage * 100) / 100,
      isGratuit: Number(updatedEvent.prix) === 0,
      isComplet: updatedTicketsVendus >= updatedEvent.nbPlaces,
      isUpcoming: updatedEvent.dateDebut > new Date(),
      isPast: updatedEvent.dateFin < new Date()
    }

    console.log('✅ Événement modifié avec succès:', updatedEvent.titre)

    return createApiResponse(response, 200, 'Événement modifié avec succès')

  } catch (error) {
    console.error('❌ Erreur API events/[id] PUT:', error)
    
    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return createApiError('DUPLICATE_ERROR', 'Données dupliquées détectées', 409)
      }
      if (error.message.includes('Foreign key')) {
        return createApiError('REFERENCE_ERROR', 'Référence invalide', 400)
      }
    }

    return createApiError('INTERNAL_ERROR', 'Erreur lors de la modification de l\'événement', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/events/[id] - Supprimer un événement (admin seulement)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const ticketsVendus = existingEvent.tickets.length

    // Empêcher la suppression si des billets sont vendus
    if (ticketsVendus > 0) {
      return createApiError(
        'CANNOT_DELETE_EVENT',
        `Impossible de supprimer un événement avec ${ticketsVendus} billet(s) vendu(s). Annulez l'événement à la place.`,
        409
      )
    }

    // Empêcher la suppression si l'événement a commencé
    const now = new Date()
    if (existingEvent.dateDebut <= now) {
      return createApiError(
        'CANNOT_DELETE_EVENT',
        'Impossible de supprimer un événement qui a déjà commencé',
        409
      )
    }

    // Supprimer l'événement (suppression en cascade des statistiques)
    await prisma.event.delete({
      where: { id: params.id }
    })

    // Log de l'activité admin
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'event',
        entityId: params.id,
        action: 'delete',
        oldData: {
          titre: existingEvent.titre,
          prix: existingEvent.prix,
          nbPlaces: existingEvent.nbPlaces,
          organisateur: existingEvent.organisateur,
          dateDebut: existingEvent.dateDebut.toISOString()
        },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          eventTitle: existingEvent.titre,
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log('✅ Événement supprimé avec succès:', existingEvent.titre)

    return createApiResponse(
      { 
        message: 'Événement supprimé avec succès',
        deletedEventId: params.id,
        eventTitle: existingEvent.titre
      }, 
      200, 
      'Événement supprimé avec succès'
    )

  } catch (error) {
    console.error('❌ Erreur API events/[id] DELETE:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la suppression de l\'événement', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction utilitaire pour valider une URL d'image
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const validProtocols = ['http:', 'https:']
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    
    if (!validProtocols.includes(parsedUrl.protocol)) {
      return false
    }

    const pathname = parsedUrl.pathname.toLowerCase()
    return validExtensions.some(ext => pathname.endsWith(ext)) || 
           pathname.includes('/upload/') || // Cloudinary ou similaire
           parsedUrl.hostname.includes('cloudinary') ||
           parsedUrl.hostname.includes('amazonaws') ||
           parsedUrl.hostname.includes('unsplash') ||
           parsedUrl.hostname.includes('pixabay')
  } catch {
    return false
  }
}