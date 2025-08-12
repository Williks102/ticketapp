import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // 🏆 TOP ÉVÉNEMENTS PAR VENTES
    const events = await prisma.event.findMany({
      include: {
        tickets: { where: { statut: { not: 'CANCELLED' } } },
        eventStats: true
      }
    })

    const topEvents = events
      .map(event => {
        const ticketsSold = event.tickets.length
        const revenue = event.tickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
        
        return {
          id: event.id,
          title: event.titre,
          ticketsSold,
          revenue,
          date: event.dateDebut.toISOString().split('T')[0],
          status: event.statut,
          organizer: event.organisateur,
          totalPlaces: event.nbPlaces,
          placesRestantes: event.placesRestantes
        }
      })
      .sort((a, b) => b.ticketsSold - a.ticketsSold)
      .slice(0, limit)

    return createApiResponse(topEvents)

  } catch (error) {
    console.error('❌ Erreur API admin top events:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}