// app/api/user/tickets/route.ts
import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { TicketsListResponse, TicketResponse } from '@/types/api'

// GET - Récupérer les billets de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Non autorisé', 401)
    }

    const userId = user.userId
    const { searchParams } = new URL(request.url)
    
    // Paramètres de pagination et filtres
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status') // 'upcoming', 'past', 'all'
    const search = searchParams.get('search')
    const eventId = searchParams.get('eventId')

    // Construction des filtres
    const where: any = {
      userId: userId
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
      where.event = {
        dateDebut: { gt: now }
      }
      where.statut = { in: ['VALID'] }
    } else if (status === 'past') {
      where.OR = [
        { event: { dateDebut: { lte: now } } },
        { statut: { in: ['USED', 'CANCELLED'] } }
      ]
    }

    // Calculs de pagination
    const skip = (page - 1) * limit

    // Récupérer les billets avec les informations de l'événement
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
              categories: true
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

    // Formatage des données
    const formattedTickets: TicketResponse[] = tickets.map(ticket => ({
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
      }
    }))

    const response: TicketsListResponse = {
      tickets: formattedTickets,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur récupération billets utilisateur:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur interne du serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}