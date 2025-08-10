import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  createApiResponse,
  createApiError,
  authenticateRequest,
  requireAdmin,
  getPaginationParams
} from '@/lib/api-utils'
import { TicketResponse, TicketStatus } from '@/types/api'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError(
        'UNAUTHORIZED',
        'Authentification requise',
        401
      )
    }

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)

    // Construire les filtres
    const where: any = {}
    
    // Si ce n'est pas un admin, ne montrer que ses propres billets
    if (!requireAdmin(user)) {
      where.userId = user.userId
    }

    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { numeroTicket: { contains: search, mode: 'insensitive' } },
        { event: { titre: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const statut = searchParams.get('statut')
    if (statut) {
      where.statut = statut
    }

    const eventId = searchParams.get('eventId')
    if (eventId) {
      where.eventId = eventId
    }

    // Récupérer les billets avec pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          event: {
            select: {
              id: true,
              titre: true,
              lieu: true,
              dateDebut: true,
              dateFin: true
            }
          },
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          }
        }
      }),
      prisma.ticket.count({ where })
    ])

    // Transformer les données avec conversion de types appropriée
    const ticketsResponse: TicketResponse[] = tickets.map(ticket => ({
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut as TicketStatus,  // Cast vers notre type
      prix: Number(ticket.prix),  // Conversion Decimal vers number
      createdAt: ticket.createdAt.toISOString(),
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString()
      },
      user: ticket.user ? {
        id: ticket.user.id,
        nom: ticket.user.nom,
        prenom: ticket.user.prenom,
        email: ticket.user.email
      } : undefined,
      guestInfo: !ticket.user ? {
        email: ticket.guestEmail || '',
        nom: ticket.guestNom || '',
        prenom: ticket.guestPrenom || '',
        telephone: ticket.guestTelephone || undefined
      } : undefined
    }))

    const response = {
      tickets: ticketsResponse,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la récupération des billets:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}
