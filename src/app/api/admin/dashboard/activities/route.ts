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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // 📋 ACTIVITÉS RÉCENTES GLOBALES
    const activities = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { nom: true, prenom: true, email: true, role: true }
        }
      }
    })

    const recentActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: formatActivityDescription(activity),
      timestamp: activity.createdAt.toISOString(),
      user: activity.user ? {
        name: `${activity.user.prenom} ${activity.user.nom}`,
        email: activity.user.email,
        role: activity.user.role
      } : null,
      amount: extractAmountFromActivity(activity)
    }))

    return createApiResponse(recentActivities)

  } catch (error) {
    console.error('❌ Erreur API admin activities:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

function formatActivityDescription(activity: any) {
  switch (activity.action) {
    case 'purchase':
      return `Nouveau billet acheté`
    case 'create':
      if (activity.entity === 'event') return `Nouvel événement créé`
      if (activity.entity === 'user') return `Nouvel utilisateur inscrit`
      break
    case 'update':
      return `${activity.entity} mis à jour`
    case 'validate':
      return `Billet validé`
    case 'cancel':
      return `${activity.entity} annulé`
    default:
      return `Action ${activity.action} sur ${activity.entity}`
  }
}

function extractAmountFromActivity(activity: any) {
  if (activity.newData && typeof activity.newData === 'object') {
    return activity.newData.amount || activity.newData.prix || null
  }
  return null
}