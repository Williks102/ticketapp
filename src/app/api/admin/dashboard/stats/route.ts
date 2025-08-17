// src/app/api/admin/dashboard/stats/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    console.log('🔄 Récupération des statistiques dashboard admin...')

    // Calculer la date du début du mois pour les statistiques mensuelles
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Récupérer toutes les statistiques en parallèle
    const [
      totalUsers,
      totalEvents,
      totalTickets,
      totalRevenue,
      newUsersThisMonth,
      activeEvents,
      pendingValidations,
      revenueThisMonth
    ] = await Promise.all([
      // Total des utilisateurs
      prisma.user.count(),
      
      // Total des événements
      prisma.event.count(),
      
      // Total des billets (non annulés)
      prisma.ticket.count({
        where: { statut: { not: 'CANCELLED' } }
      }),
      
      // Revenus totaux (billets non annulés)
      prisma.ticket.aggregate({
        _sum: { prix: true },
        where: { statut: { not: 'CANCELLED' } }
      }),
      
      // Nouveaux utilisateurs ce mois
      prisma.user.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Événements actifs (en cours ou à venir)
      prisma.event.count({
        where: {
          statut: 'ACTIVE',
          dateFin: { gte: now }
        }
      }),
      
      // Billets en attente de validation
      prisma.ticket.count({
        where: { statut: 'VALID' }
      }),
      
      // Revenus de ce mois
      prisma.ticket.aggregate({
        _sum: { prix: true },
        where: {
          statut: { not: 'CANCELLED' },
          createdAt: { gte: startOfMonth }
        }
      })
    ])

    const stats = {
      totalUsers,
      totalEvents,
      totalTickets,
      totalRevenue: Number(totalRevenue._sum.prix || 0),
      newUsersThisMonth,
      activeEvents,
      pendingValidations,
      revenueThisMonth: Number(revenueThisMonth._sum.prix || 0)
    }

    console.log('✅ Statistiques dashboard récupérées:', stats)

    return createApiResponse(stats)

  } catch (error) {
    console.error('❌ Erreur API admin dashboard stats:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors du chargement des statistiques', 500)
  } finally {
    await prisma.$disconnect()
  }
}