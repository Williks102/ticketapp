import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    console.log(`👨‍💼 Admin ${user.email} accède aux statistiques globales`)

    // 📊 STATISTIQUES GLOBALES
    const [totalEvents, totalTickets, totalUsers] = await Promise.all([
      prisma.event.count(),
      prisma.ticket.count({ where: { statut: { not: 'CANCELLED' } } }),
      prisma.user.count({ where: { role: 'USER' } }) // Exclure les admins du compte
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTickets = await prisma.ticket.count({
      where: { createdAt: { gte: today }, statut: { not: 'CANCELLED' } }
    })

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthTickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: startOfMonth }, statut: { not: 'CANCELLED' } },
      select: { prix: true }
    })

    const thisMonthRevenue = thisMonthTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)

    const allTickets = await prisma.ticket.findMany({
      where: { statut: { not: 'CANCELLED' } },
      select: { prix: true }
    })

    const totalRevenue = allTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    
    const activeEvents = await prisma.event.count({
      where: { statut: 'ACTIVE', dateDebut: { gt: new Date() } }
    })

    // Métriques avancées
    const [revenueGrowth, userGrowth, topPromoters] = await Promise.all([
      calculateRevenueGrowth(),
      calculateUserGrowth(), 
      getTopPromoters()
    ])

    const adminStats = {
      totalEvents,
      totalTickets,
      totalRevenue,
      totalUsers,
      todayTickets,
      thisMonthRevenue,
      activeEvents,
      conversionRate: totalEvents > 0 ? Math.round((totalTickets / (totalEvents * 100)) * 10000) / 100 : 0,
      
      platformMetrics: {
        averageTicketPrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        userGrowthRate: Math.round(userGrowth * 100) / 100,
        topPromoters
      }
    }

    return createApiResponse(adminStats)

  } catch (error) {
    console.error('❌ Erreur API admin stats:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

async function calculateRevenueGrowth() {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const [thisMonth, previousMonth] = await Promise.all([
    prisma.ticket.aggregate({
      where: { createdAt: { gte: lastMonth }, statut: { not: 'CANCELLED' } },
      _sum: { prix: true }
    }),
    prisma.ticket.aggregate({
      where: { createdAt: { lt: lastMonth }, statut: { not: 'CANCELLED' } },
      _sum: { prix: true }
    })
  ])
  
  const current = Number(thisMonth._sum.prix) || 0
  const previous = Number(previousMonth._sum.prix) || 0
  
  return previous > 0 ? ((current / previous) - 1) * 100 : 0
}

async function calculateUserGrowth() {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const [thisMonth, previousMonth] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: lastMonth }, role: 'USER' } }),
    prisma.user.count({ where: { createdAt: { lt: lastMonth }, role: 'USER' } })
  ])
  
  return previousMonth > 0 ? ((thisMonth / previousMonth) - 1) * 100 : 0
}

async function getTopPromoters() {
  const events = await prisma.event.findMany({
    include: {
      tickets: { where: { statut: { not: 'CANCELLED' } } }
    }
  })
  
  const promoterStats = events.reduce((acc: any, event) => {
    const organisateur = event.organisateur
    if (!acc[organisateur]) {
      acc[organisateur] = { name: organisateur, eventsCount: 0, totalRevenue: 0 }
    }
    acc[organisateur].eventsCount++
    acc[organisateur].totalRevenue += event.tickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    return acc
  }, {})
  
  return Object.values(promoterStats)
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
}