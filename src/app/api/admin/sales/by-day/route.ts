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
    const period = searchParams.get('period') || '30d'

    console.log(`🔄 Calcul des ventes par jour pour: ${period}`)

    // Calculer les dates
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Récupérer les tickets pour la période
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        },
        statut: { not: 'CANCELLED' }
      },
      select: {
        createdAt: true,
        prix: true,
        eventId: true
      }
    })

    // Grouper par jour
    const salesByDay = new Map<string, { tickets: number; revenue: number; events: Set<string> }>()

    // Initialiser tous les jours avec 0
    const currentDate = new Date(startDate)
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split('T')[0]
      salesByDay.set(dateKey, { tickets: 0, revenue: 0, events: new Set() })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Remplir avec les vraies données
    tickets.forEach(ticket => {
      const dateKey = ticket.createdAt.toISOString().split('T')[0]
      const existing = salesByDay.get(dateKey) || { tickets: 0, revenue: 0, events: new Set() }
      
      existing.tickets += 1
      existing.revenue += Number(ticket.prix)
      existing.events.add(ticket.eventId)
      
      salesByDay.set(dateKey, existing)
    })

    // Convertir en array ordonné
    const salesArray = Array.from(salesByDay.entries())
      .map(([date, data]) => ({
        date,
        tickets: data.tickets,
        revenue: data.revenue,
        events: data.events.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const response = {
      salesByDay: salesArray,
      period,
      totalDays: salesArray.length,
      summary: {
        totalTickets: tickets.length,
        totalRevenue: tickets.reduce((sum, t) => sum + Number(t.prix), 0)
      }
    }

    console.log(`✅ Ventes par jour calculées: ${salesArray.length} jours`)

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API sales by-day:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors du calcul des ventes par jour', 500)
  }
}