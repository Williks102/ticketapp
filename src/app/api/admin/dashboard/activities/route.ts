// src/app/api/admin/dashboard/activities/route.ts - VERSION COMPLÈTE CORRIGÉE
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const type = searchParams.get('type') // Filtrer par type d'activité
    const period = searchParams.get('period') || '7d' // 24h, 7d, 30d
    const userId = searchParams.get('userId') // Filtrer par utilisateur

    console.log('🔄 Récupération des activités récentes...')

    // Calculer la date de début selon la période
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Construire les conditions de filtrage
    const whereClause: any = {
      createdAt: {
        gte: startDate
      }
    }

    if (type) {
      whereClause.type = type
    }

    if (userId) {
      whereClause.userId = userId
    }

    // Récupérer les logs d'activité avec filtres
    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Récupérer les statistiques d'activité pour la période
    const activityStats = await prisma.activityLog.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        type: true
      }
    })

    // Formatter les activités pour l'affichage
    const formattedActivities = activities.map(activity => {
      const description = formatActivityDescription(activity)
      const userName = activity.user 
        ? `${activity.user.prenom} ${activity.user.nom}`
        : null

      return {
        id: activity.id,
        type: activity.type,
        entity: activity.entity,
        entityId: activity.entityId,
        action: activity.action,
        description,
        userId: activity.userId,
        userName,
        userEmail: activity.user?.email || null,
        userRole: activity.user?.role || null,
        timestamp: activity.createdAt.toISOString(),
        metadata: activity.metadata,
        amount: extractAmountFromActivity(activity),
        priority: getActivityPriority(activity),
        icon: getActivityIcon(activity.type),
        color: getActivityColor(activity.type)
      }
    })

    // Calculer les tendances
    const trends = calculateActivityTrends(activities, period)

    const response = {
      activities: formattedActivities,
      stats: {
        totalActivities: activities.length,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        byType: activityStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.type
          return acc
        }, {} as Record<string, number>)
      },
      trends,
      filters: {
        type,
        period,
        userId,
        limit
      }
    }

    console.log(`✅ ${formattedActivities.length} activités récupérées pour la période ${period}`)

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin dashboard activities:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors du chargement des activités', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction pour formater la description d'une activité
function formatActivityDescription(activity: any): string {
  const { type, action, entity, newData, oldData } = activity

  switch (type) {
    case 'USER_ACTION':
      switch (action) {
        case 'login':
          return 'Connexion utilisateur'
        case 'logout':
          return 'Déconnexion utilisateur'
        case 'register':
          return 'Nouvel utilisateur inscrit'
        case 'purchase':
          const eventTitle = newData?.eventTitle || 'un événement'
          return `Achat de billet pour "${eventTitle}"`
        case 'free_reservation':
          const freeEventTitle = newData?.eventTitle || 'un événement'
          return `Réservation gratuite pour "${freeEventTitle}"`
        case 'profile_update':
          return 'Profil utilisateur mis à jour'
        case 'password_change':
          return 'Mot de passe modifié'
        default:
          return `Action utilisateur: ${action}`
      }

    case 'ADMIN_ACTION':
      switch (action) {
        case 'create':
          if (entity === 'event') {
            const eventTitle = newData?.title || newData?.titre || 'Événement'
            return `Nouvel événement créé: "${eventTitle}"`
          } else if (entity === 'user') {
            const userEmail = newData?.email || 'utilisateur'
            return `Nouvel utilisateur créé: ${userEmail}`
          } else {
            return `Création: ${entity}`
          }
        case 'update':
          if (entity === 'event') {
            const eventTitle = newData?.title || newData?.titre || oldData?.title || 'Événement'
            return `Événement modifié: "${eventTitle}"`
          } else if (entity === 'user') {
            const userEmail = newData?.email || oldData?.email || 'utilisateur'
            return `Utilisateur modifié: ${userEmail}`
          } else {
            return `Modification: ${entity}`
          }
        case 'delete':
          if (entity === 'event') {
            const eventTitle = oldData?.title || oldData?.titre || 'Événement'
            return `Événement supprimé: "${eventTitle}"`
          } else if (entity === 'user') {
            const userEmail = oldData?.email || 'utilisateur'
            return `Utilisateur supprimé: ${userEmail}`
          } else {
            return `Suppression: ${entity}`
          }
        case 'ban':
          const bannedUserEmail = newData?.email || oldData?.email || 'utilisateur'
          return `Utilisateur banni: ${bannedUserEmail}`
        case 'unban':
          const unbannedUserEmail = newData?.email || oldData?.email || 'utilisateur'
          return `Utilisateur débanni: ${unbannedUserEmail}`
        case 'view':
          return `Consultation ${entity}`
        default:
          return `Action admin: ${action} sur ${entity}`
      }

    case 'VALIDATION_ACTION':
      switch (action) {
        case 'validate':
          const ticketNumber = newData?.numeroTicket || 'billet'
          return `Billet validé: ${ticketNumber}`
        case 'scan':
          const scannedTicket = newData?.numeroTicket || 'billet'
          return `Scan de billet: ${scannedTicket}`
        case 'manual_validation':
          return 'Validation manuelle de billet'
        case 'bulk_validation':
          const count = newData?.count || 'plusieurs'
          return `Validation en lot: ${count} billets`
        default:
          return `Validation: ${action}`
      }

    case 'PAYMENT_ACTION':
      switch (action) {
        case 'payment_succeeded':
          const amount = newData?.amount ? `${(newData.amount / 100).toLocaleString()} FCFA` : ''
          return `Paiement réussi${amount ? ` - ${amount}` : ''}`
        case 'payment_failed':
          return 'Échec de paiement'
        case 'payment_pending':
          return 'Paiement en attente'
        case 'refund':
          const refundAmount = newData?.refundAmount ? `${(newData.refundAmount / 100).toLocaleString()} FCFA` : ''
          return `Remboursement effectué${refundAmount ? ` - ${refundAmount}` : ''}`
        case 'partial_refund':
          return 'Remboursement partiel'
        default:
          return `Paiement: ${action}`
      }

    case 'SYSTEM_ACTION':
      switch (action) {
        case 'event_expired':
          const expiredEvent = newData?.eventTitle || 'Événement'
          return `Événement expiré: "${expiredEvent}"`
        case 'ticket_expired':
          return 'Billets expirés automatiquement'
        case 'cleanup':
          return 'Nettoyage système effectué'
        case 'backup':
          return 'Sauvegarde système'
        case 'maintenance':
          return 'Maintenance système'
        case 'email_sent':
          const emailType = newData?.type || 'email'
          return `Email envoyé: ${emailType}`
        case 'notification_sent':
          return 'Notification envoyée'
        default:
          return `Système: ${action}`
      }

    default:
      return `${type}: ${action}${entity ? ` sur ${entity}` : ''}`
  }
}

// Fonction pour extraire le montant d'une activité
function extractAmountFromActivity(activity: any): number | null {
  const { newData, oldData, action } = activity

  // Essayer d'extraire le montant depuis newData
  if (newData && typeof newData === 'object') {
    if (newData.amount) return Number(newData.amount)
    if (newData.prix) return Number(newData.prix)
    if (newData.totalAmount) return Number(newData.totalAmount)
    if (newData.refundAmount) return Number(newData.refundAmount)
  }

  // Essayer d'extraire depuis oldData pour les suppressions
  if (oldData && typeof oldData === 'object') {
    if (oldData.amount) return Number(oldData.amount)
    if (oldData.prix) return Number(oldData.prix)
  }

  // Pour les actions spécifiques, essayer d'inférer
  if (action === 'purchase' || action === 'payment_succeeded') {
    // Ces actions devraient toujours avoir un montant
    return null
  }

  return null
}

// Fonction pour déterminer la priorité d'une activité
function getActivityPriority(activity: any): 'high' | 'medium' | 'low' {
  const { type, action } = activity

  // Priorité haute pour les actions critiques
  if (type === 'ADMIN_ACTION' && ['delete', 'ban'].includes(action)) {
    return 'high'
  }

  if (type === 'PAYMENT_ACTION' && action === 'payment_failed') {
    return 'high'
  }

  if (type === 'SYSTEM_ACTION' && ['maintenance', 'backup'].includes(action)) {
    return 'high'
  }

  // Priorité moyenne pour les actions importantes
  if (type === 'ADMIN_ACTION' && ['create', 'update'].includes(action)) {
    return 'medium'
  }

  if (type === 'PAYMENT_ACTION' && ['payment_succeeded', 'refund'].includes(action)) {
    return 'medium'
  }

  if (type === 'VALIDATION_ACTION') {
    return 'medium'
  }

  // Priorité basse pour les actions courantes
  return 'low'
}

// Fonction pour obtenir l'icône d'une activité
function getActivityIcon(type: string): string {
  switch (type) {
    case 'USER_ACTION':
      return '👤'
    case 'ADMIN_ACTION':
      return '⚙️'
    case 'PAYMENT_ACTION':
      return '💳'
    case 'VALIDATION_ACTION':
      return '✅'
    case 'SYSTEM_ACTION':
      return '🔧'
    default:
      return '📋'
  }
}

// Fonction pour obtenir la couleur d'une activité
function getActivityColor(type: string): string {
  switch (type) {
    case 'USER_ACTION':
      return 'blue'
    case 'ADMIN_ACTION':
      return 'orange'
    case 'PAYMENT_ACTION':
      return 'green'
    case 'VALIDATION_ACTION':
      return 'purple'
    case 'SYSTEM_ACTION':
      return 'gray'
    default:
      return 'gray'
  }
}

// Fonction pour calculer les tendances d'activité
function calculateActivityTrends(activities: any[], period: string): any {
  const now = new Date()
  const intervals: { [key: string]: Date[] } = {}

  // Définir les intervalles selon la période
  if (period === '24h') {
    // Intervalles de 1 heure sur 24h
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000)
      const key = date.getHours().toString().padStart(2, '0') + 'h'
      intervals[key] = [
        new Date(date.getTime() - 30 * 60 * 1000), // -30min
        new Date(date.getTime() + 30 * 60 * 1000)  // +30min
      ]
    }
  } else if (period === '7d') {
    // Intervalles de 1 jour sur 7 jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = date.toLocaleDateString('fr-FR', { weekday: 'short' })
      intervals[key] = [
        new Date(date.setHours(0, 0, 0, 0)),
        new Date(date.setHours(23, 59, 59, 999))
      ]
    }
  } else if (period === '30d') {
    // Intervalles de 1 jour sur 30 jours (sample les 7 derniers)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      intervals[key] = [
        new Date(date.setHours(0, 0, 0, 0)),
        new Date(date.setHours(23, 59, 59, 999))
      ]
    }
  }

  // Compter les activités par intervalle
  const trends = Object.entries(intervals).map(([label, [start, end]]) => {
    const count = activities.filter(activity => {
      const activityDate = new Date(activity.createdAt)
      return activityDate >= start && activityDate <= end
    }).length

    return {
      label,
      count,
      period: start.toISOString()
    }
  })

  return {
    data: trends,
    peak: trends.reduce((max, current) => current.count > max.count ? current : max, trends[0] || { label: '', count: 0 }),
    total: trends.reduce((sum, trend) => sum + trend.count, 0),
    average: trends.length > 0 ? Math.round(trends.reduce((sum, trend) => sum + trend.count, 0) / trends.length) : 0
  }
}