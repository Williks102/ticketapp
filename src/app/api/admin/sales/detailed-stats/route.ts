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

    console.log(`🔄 Calcul des statistiques détaillées pour: ${period}`)

    // Calculer les dates selon la période
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

    // Récupérer tous les billets valides pour la période
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        },
        statut: {
          not: 'CANCELLED'
        }
      }
    })

    // Calculer les métriques
    const totalTickets = tickets.length
    const totalRevenue = tickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    const averageTicketPrice = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0

    // Calculer le taux de croissance (période précédente)
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousTickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        },
        statut: { not: 'CANCELLED' }
      }
    })

    const previousRevenue = previousTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    const growthRate = previousRevenue > 0 
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100) 
      : totalRevenue > 0 ? 100 : 0

    // Taux de conversion simulé (billets vendus / événements actifs)
    const activeEvents = await prisma.event.count({
      where: { statut: 'ACTIVE' }
    })
    const conversionRate = activeEvents > 0 ? Math.round((totalTickets / (activeEvents * 10)) * 100) / 100 : 0

    const response = {
      totalRevenue,
      totalTickets,
      averageTicketPrice,
      conversionRate,
      growthRate,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    }

    console.log(`✅ Stats calculées: ${totalTickets} billets, ${totalRevenue} revenue`)

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API sales detailed-stats:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors du calcul des statistiques', 500)
  }
}