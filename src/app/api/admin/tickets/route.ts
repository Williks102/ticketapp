// src/app/api/admin/tickets/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

// GET /api/admin/tickets - Liste des billets pour admin
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const eventId = searchParams.get('eventId') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const priceType = searchParams.get('priceType') || '' // 'free', 'paid', ''

    const skip = (page - 1) * limit

    // Construction des conditions de recherche
    const whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { numeroTicket: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { nom: { contains: search, mode: 'insensitive' } } },
        { user: { prenom: { contains: search, mode: 'insensitive' } } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestNom: { contains: search, mode: 'insensitive' } },
        { event: { titre: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status) {
      whereConditions.statut = status
    }

    if (eventId) {
      whereConditions.eventId = eventId
    }

    if (priceType === 'free') {
      whereConditions.prix = 0
    } else if (priceType === 'paid') {
      whereConditions.prix = { gt: 0 }
    }

    // Récupération des billets avec relations
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
              telephone: true,
              role: true
            }
          },
          event: {
            select: {
              id: true,
              titre: true,
              lieu: true,
              dateDebut: true,
              dateFin: true,
              statut: true,
              organisateur: true
            }
          }
        }
      }),
      prisma.ticket.count({ where: whereConditions })
    ])

    // Enrichir les données
    const ticketsWithDetails = tickets.map(ticket => ({
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut,
      prix: Number(ticket.prix),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      validatedAt: ticket.validatedAt?.toISOString() || null,
      validatedBy: ticket.validatedBy,
      
      // Type de billet
      isGratuit: Number(ticket.prix) === 0,
      
      // Informations utilisateur ou invité
      user: ticket.user ? {
        id: ticket.user.id,
        email: ticket.user.email,
        nom: ticket.user.nom,
        prenom: ticket.user.prenom,
        telephone: ticket.user.telephone,
        role: ticket.user.role
      } : null,
      
      guest: !ticket.user ? {
        email: ticket.guestEmail,
        nom: ticket.guestNom,
        prenom: ticket.guestPrenom,
        telephone: ticket.guestTelephone
      } : null,
      
      // Informations événement
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString(),
        statut: ticket.event.statut,
        organisateur: ticket.event.organisateur,
        isEventPast: ticket.event.dateFin < new Date()
      }
    }))

    // Statistiques pour le dashboard
    const stats = {
      totalTickets: total,
      validTickets: tickets.filter(t => t.statut === 'VALID').length,
      usedTickets: tickets.filter(t => t.statut === 'USED').length,
      cancelledTickets: tickets.filter(t => t.statut === 'CANCELLED').length,
      freeTickets: tickets.filter(t => Number(t.prix) === 0).length,
      paidTickets: tickets.filter(t => Number(t.prix) > 0).length,
      totalRevenue: tickets.reduce((sum, t) => sum + Number(t.prix), 0)
    }

    const response = {
      tickets: ticketsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        status,
        eventId,
        priceType,
        sortBy,
        sortOrder
      },
      stats
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin tickets GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// src/app/api/admin/tickets/[id]/route.ts
interface TicketRouteParams {
  params: { id: string }
}

// GET /api/admin/tickets/[id] - Détails d'un billet
export async function GET_TICKET_DETAIL(request: NextRequest, { params }: TicketRouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        event: true
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    const response = {
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut,
      prix: Number(ticket.prix),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      validatedAt: ticket.validatedAt?.toISOString() || null,
      validatedBy: ticket.validatedBy,
      
      isGratuit: Number(ticket.prix) === 0,
      
      user: ticket.user ? {
        id: ticket.user.id,
        email: ticket.user.email,
        nom: ticket.user.nom,
        prenom: ticket.user.prenom,
        telephone: ticket.user.telephone,
        role: ticket.user.role,
        createdAt: ticket.user.createdAt.toISOString()
      } : null,
      
      guest: !ticket.user ? {
        email: ticket.guestEmail,
        nom: ticket.guestNom,
        prenom: ticket.guestPrenom,
        telephone: ticket.guestTelephone
      } : null,
      
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        description: ticket.event.description,
        lieu: ticket.event.lieu,
        adresse: ticket.event.adresse,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString(),
        prix: Number(ticket.event.prix),
        nbPlaces: ticket.event.nbPlaces,
        placesRestantes: ticket.event.placesRestantes,
        statut: ticket.event.statut,
        organisateur: ticket.event.organisateur,
        image: ticket.event.image,
        categories: ticket.event.categories
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin ticket detail:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/admin/tickets/[id] - Modifier un billet (validation, annulation)
export async function PUT_TICKET(request: NextRequest, { params }: TicketRouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()

    // Vérifier que le billet existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { event: true }
    })

    if (!existingTicket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Préparer les données de mise à jour
    const updateData: any = {}

    // Gestion du changement de statut
    if (body.statut && body.statut !== existingTicket.statut) {
      if (!['VALID', 'USED', 'CANCELLED'].includes(body.statut)) {
        return createApiError('VALIDATION_ERROR', 'Statut invalide', 400)
      }

      updateData.statut = body.statut

      // Si validation du billet
      if (body.statut === 'USED' && existingTicket.statut === 'VALID') {
        updateData.validatedAt = new Date()
        updateData.validatedBy = user.id
      }

      // Si annulation du billet
      if (body.statut === 'CANCELLED') {
        // Rendre la place disponible
        await prisma.event.update({
          where: { id: existingTicket.eventId },
          data: {
            placesRestantes: {
              increment: 1
            }
          }
        })
      }
    }

    // Mettre à jour le billet
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'ticket',
        entityId: params.id,
        action: body.statut === 'USED' ? 'validate' : 'update',
        oldData: {
          statut: existingTicket.statut
        },
        newData: {
          statut: updatedTicket.statut,
          validatedBy: updateData.validatedBy
        },
        userId: user.id
      }
    })

    const response = {
      id: updatedTicket.id,
      numeroTicket: updatedTicket.numeroTicket,
      statut: updatedTicket.statut,
      validatedAt: updatedTicket.validatedAt?.toISOString() || null,
      validatedBy: updatedTicket.validatedBy,
      updatedAt: updatedTicket.updatedAt.toISOString()
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin ticket update:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/admin/tickets/[id] - Supprimer un billet (rare, seulement si erreur)
export async function DELETE_TICKET(request: NextRequest, { params }: TicketRouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // Vérifier que le billet existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { event: true }
    })

    if (!existingTicket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Vérifier que le billet peut être supprimé (pas encore utilisé)
    if (existingTicket.statut === 'USED') {
      return createApiError('CONFLICT', 'Impossible de supprimer un billet déjà utilisé', 409)
    }

    // Supprimer le billet et rendre la place disponible
    await prisma.$transaction(async (tx) => {
      await tx.ticket.delete({
        where: { id: params.id }
      })

      if (existingTicket.statut !== 'CANCELLED') {
        await tx.event.update({
          where: { id: existingTicket.eventId },
          data: {
            placesRestantes: {
              increment: 1
            }
          }
        })
      }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'ticket',
        entityId: params.id,
        action: 'delete',
        oldData: {
          numeroTicket: existingTicket.numeroTicket,
          statut: existingTicket.statut,
          prix: existingTicket.prix
        },
        userId: user.id
      }
    })

    return createApiResponse({ 
      message: 'Billet supprimé avec succès',
      deletedTicketId: params.id 
    })

  } catch (error) {
    console.error('❌ Erreur API admin ticket delete:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}