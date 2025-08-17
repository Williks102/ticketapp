// src/app/api/user/billets/route.ts - API complète pour la gestion des billets utilisateur
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest } from '@/lib/api-utils'
import { JWTPayload } from '@/types/api'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    // Seuls les USER peuvent accéder
    if (user.role !== 'USER') {
      return createApiError('FORBIDDEN', 'Accès réservé aux utilisateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search')?.trim()
    const status = searchParams.get('status') // 'upcoming', 'past', 'all'
    const includeQR = searchParams.get('includeQR') === 'true' // Inclure les données QR

    console.log(`👤 User ${user.email} récupère ses billets (includeQR: ${includeQR})`)

    // 👤 BILLETS DE L'UTILISATEUR UNIQUEMENT
    let whereClause: any = {
      userId: user.id,
      statut: { not: 'CANCELLED' } // Exclure les billets annulés
    }

    // Recherche textuelle
    if (search) {
      whereClause.OR = [
        { numeroTicket: { contains: search, mode: 'insensitive' } },
        { event: { titre: { contains: search, mode: 'insensitive' } } },
        { event: { lieu: { contains: search, mode: 'insensitive' } } },
        { event: { organisateur: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Filtrage par statut temporel
    const now = new Date()
    if (status === 'upcoming') {
      whereClause.AND = [
        { event: { dateDebut: { gt: now } } },
        { statut: 'VALID' }
      ]
    } else if (status === 'past') {
      whereClause.OR = [
        { event: { dateFin: { lte: now } } },
        { statut: { in: ['USED', 'EXPIRED'] } }
      ]
    }

    // Compter le total
    const total = await prisma.ticket.count({ where: whereClause })

    // Récupérer les billets avec les détails des événements
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
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
            categories: true,
            statut: true,
            prix: true,
            nbPlaces: true,
            placesRestantes: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Formater les billets pour la réponse
    const ticketsResponse = tickets.map(ticket => ({
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: includeQR ? ticket.qrCode : undefined, // QR code seulement si demandé
      statut: ticket.statut,
      prix: Number(ticket.prix),
      validatedAt: ticket.validatedAt?.toISOString() || null,
      validatedBy: ticket.validatedBy || null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      
      // Informations événement
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        description: ticket.event.description,
        lieu: ticket.event.lieu,
        adresse: ticket.event.adresse,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString(),
        organisateur: ticket.event.organisateur,
        image: ticket.event.image,
        categories: ticket.event.categories,
        statut: ticket.event.statut,
        prix: Number(ticket.event.prix),
        nbPlaces: ticket.event.nbPlaces,
        placesRestantes: ticket.event.placesRestantes,
        createdAt: ticket.event.createdAt.toISOString(),
        updatedAt: ticket.event.updatedAt.toISOString()
      },
      
      // Métadonnées utiles
      canShowQR: ticket.statut === 'VALID',
      canDownload: ['VALID', 'USED'].includes(ticket.statut),
      isExpired: ticket.event.dateFin < now && ticket.statut === 'VALID',
      daysUntilEvent: ticket.event.dateDebut > now 
        ? Math.ceil((ticket.event.dateDebut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null
    }))

    const response = {
      tickets: ticketsResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        search,
        status,
        includeQR
      },
      summary: {
        totalTickets: total,
        validTickets: tickets.filter(t => t.statut === 'VALID').length,
        usedTickets: tickets.filter(t => t.statut === 'USED').length,
        upcomingEvents: tickets.filter(t => t.event.dateDebut > now && t.statut === 'VALID').length
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API user billets:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}