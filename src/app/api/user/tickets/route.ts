import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, getPaginationParams } from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { TicketResponse, TicketsListResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)
    
    // Filtres
    const status = searchParams.get('status') // 'upcoming', 'past', 'used', 'valid', 'all'
    const search = searchParams.get('search')
    const eventId = searchParams.get('eventId')

    // Construction des filtres - SEULEMENT SES BILLETS
    const where: any = {
      userId: user.id // 🔒 Sécurité : seulement ses billets
    }

    if (eventId) {
      where.eventId = eventId
    }

    if (search) {
      where.OR = [
        { numeroTicket: { contains: search, mode: 'insensitive' } },
        { event: { titre: { contains: search, mode: 'insensitive' } } },
        { event: { lieu: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Filtres par statut temporel
    const now = new Date()
    if (status === 'upcoming') {
      where.event = { dateDebut: { gt: now } }
      where.statut = { in: ['VALID'] }
    } else if (status === 'past') {
      where.event = { dateFin: { lte: now } }
    } else if (status === 'used') {
      where.statut = 'USED'
    } else if (status === 'valid') {
      where.statut = 'VALID'
    }

    // Récupérer les billets avec pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
              statut: true
            }
          }
        },
        orderBy: [
          { event: { dateDebut: 'asc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.ticket.count({ where })
    ])

    // Formatage sécurisé des données
    const ticketsResponse: TicketResponse[] = tickets.map(ticket => ({
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut as any,
      prix: ticket.prix,
      validatedAt: ticket.validatedAt?.toISOString() || null,
      validatedBy: ticket.validatedBy || null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
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
        prix: ticket.prix, // Prix du billet acheté
        nbPlaces: 0, // Pas besoin pour l'utilisateur
        placesRestantes: 0, // Pas besoin pour l'utilisateur
        createdAt: '',
        updatedAt: ''
      },
      user: null, // Pas besoin de ses propres infos
      guestEmail: null,
      guestNom: null,
      guestPrenom: null,
      guestTelephone: null
    }))

    const response: TicketsListResponse = {
      tickets: ticketsResponse,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API user tickets:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}
