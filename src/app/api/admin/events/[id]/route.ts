// src/app/api/admin/events/[id]/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET /api/admin/events/[id] - Détails d'un événement pour admin
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          include: {
            user: {
              select: { id: true, email: true, nom: true, prenom: true }
            }
          }
        },
        eventStats: true
      }
    })

    if (!event) {
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    // Calculer les statistiques détaillées
    const validTickets = event.tickets.filter(t => t.statut !== 'CANCELLED')
    const ticketsVendus = validTickets.length
    const revenue = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    const tauxRemplissage = event.nbPlaces > 0 ? (ticketsVendus / event.nbPlaces) * 100 : 0

    // Statistiques par statut
    const ticketsByStatus = event.tickets.reduce((acc, ticket) => {
      acc[ticket.statut] = (acc[ticket.statut] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Ventes par jour (derniers 30 jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTickets = validTickets.filter(ticket => ticket.createdAt >= thirtyDaysAgo)
    const salesByDay = recentTickets.reduce((acc, ticket) => {
      const date = ticket.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, tickets: 0, revenue: 0 }
      }
      acc[date].tickets++
      acc[date].revenue += Number(ticket.prix)
      return acc
    }, {} as Record<string, any>)

    const response = {
      // Informations de base
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

      // Statistiques calculées
      ticketsVendus,
      revenue,
      tauxRemplissage: Math.round(tauxRemplissage * 100) / 100,
      isGratuit: Number(event.prix) === 0,
      ticketsByStatus,
      averageTicketPrice: ticketsVendus > 0 ? revenue / ticketsVendus : 0,

      // Données pour graphiques
      salesByDay: Object.values(salesByDay).sort((a: any, b: any) => a.date.localeCompare(b.date)),

      // Liste des billets avec détails utilisateurs
      tickets: event.tickets.map(ticket => ({
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        statut: ticket.statut,
        prix: Number(ticket.prix),
        createdAt: ticket.createdAt.toISOString(),
        validatedAt: ticket.validatedAt?.toISOString() || null,
        user: ticket.user ? {
          id: ticket.user.id,
          email: ticket.user.email,
          nom: ticket.user.nom,
          prenom: ticket.user.prenom
        } : {
          guestEmail: ticket.guestEmail,
          guestNom: ticket.guestNom,
          guestPrenom: ticket.guestPrenom
        }
      }))
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin event detail GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/admin/events/[id] - Modifier un événement
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()

    // Vérifier que l'événement existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: { tickets: { where: { statut: { not: 'CANCELLED' } } } }
    })

    if (!existingEvent) {
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    // Validation des dates si modifiées
    if (body.dateDebut && body.dateFin) {
      const dateDebut = new Date(body.dateDebut)
      const dateFin = new Date(body.dateFin)

      if (dateFin <= dateDebut) {
        return createApiError('VALIDATION_ERROR', 'La date de fin doit être après la date de début', 400)
      }
    }

    // Validation du nombre de places
    if (body.nbPlaces !== undefined) {
      const ticketsVendus = existingEvent.tickets.length
      if (body.nbPlaces < ticketsVendus) {
        return createApiError(
          'VALIDATION_ERROR', 
          `Impossible de réduire le nombre de places en dessous du nombre de billets vendus (${ticketsVendus})`, 
          400
        )
      }
    }

    // Validation du prix
    if (body.prix !== undefined && body.prix < 0) {
      return createApiError('VALIDATION_ERROR', 'Le prix ne peut pas être négatif', 400)
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    const allowedFields = [
      'titre', 'description', 'lieu', 'adresse', 'dateDebut', 'dateFin',
      'prix', 'nbPlaces', 'organisateur', 'image', 'categories', 'statut'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'dateDebut' || field === 'dateFin') {
          updateData[field] = new Date(body[field])
        } else if (field === 'prix' || field === 'nbPlaces') {
          updateData[field] = Number(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    })

    // Recalculer les places restantes si nécessaire
    if (updateData.nbPlaces !== undefined) {
      const ticketsVendus = existingEvent.tickets.length
      updateData.placesRestantes = updateData.nbPlaces - ticketsVendus
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
        entityId: updatedEvent.id,
        action: 'update',
        oldData: {
          titre: existingEvent.titre,
          prix: existingEvent.prix,
          statut: existingEvent.statut
        },
        newData: {
          titre: updatedEvent.titre,
          prix: updatedEvent.prix,
          statut: updatedEvent.statut,
          isGratuit: updatedEvent.prix === 0
        },
        userId: user.id
      }
    })

    const response = {
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
      updatedAt: updatedEvent.updatedAt.toISOString(),
      isGratuit: updatedEvent.prix === 0
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin event update:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/admin/events/[id] - Supprimer un événement
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        tickets: { where: { statut: { not: 'CANCELLED' } } }
      }
    })

    if (!event) {
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    // Vérifier s'il y a des billets actifs
    const activeTickets = event.tickets
    if (activeTickets.length > 0) {
      return createApiError(
        'CONFLICT',
        `Impossible de supprimer un événement avec ${activeTickets.length} billet(s) actif(s). Annulez d'abord l'événement.`,
        409
      )
    }

    // Supprimer l'événement (suppression en cascade des billets annulés, stats, etc.)
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
          titre: event.titre,
          prix: event.prix,
          nbPlaces: event.nbPlaces
        },
        userId: user.id
      }
    })

    return createApiResponse({ 
      message: 'Événement supprimé avec succès',
      deletedEventId: params.id 
    })

  } catch (error) {
    console.error('❌ Erreur API admin event delete:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}