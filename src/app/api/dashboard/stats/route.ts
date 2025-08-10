// Créer le fichier: src/app/api/dashboard/stats/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les statistiques de base
    const [totalEvents, totalTickets, totalUsers] = await Promise.all([
      prisma.event.count({
        where: { statut: 'ACTIVE' }
      }),
      prisma.ticket.count({
        where: { statut: { not: 'CANCELLED' } }
      }),
      prisma.user.count()
    ])

    // Statistiques aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTickets = await prisma.ticket.count({
      where: {
        createdAt: { gte: today },
        statut: { not: 'CANCELLED' }
      }
    })

    // Revenue du mois
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthTickets = await prisma.ticket.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        statut: { not: 'CANCELLED' }
      },
      select: { prix: true }
    })

    const thisMonthRevenue = thisMonthTickets.reduce((sum, ticket) => 
      sum + Number(ticket.prix), 0
    )

    const stats = {
      totalEvents,
      totalTickets,
      totalUsers,
      todayTickets,
      thisMonthRevenue,
      activeEvents: totalEvents,
      conversionRate: totalEvents > 0 ? (totalTickets / totalEvents) * 100 : 0
    }

    return createApiResponse(stats)

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    
    // Retourner des statistiques par défaut en cas d'erreur
    const defaultStats = {
      totalEvents: 0,
      totalTickets: 0,
      totalUsers: 0,
      todayTickets: 0,
      thisMonthRevenue: 0,
      activeEvents: 0,
      conversionRate: 0
    }
    
    return createApiResponse(defaultStats)
  } finally {
    await prisma.$disconnect()
  }
}
