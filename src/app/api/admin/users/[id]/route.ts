// src/app/api/admin/users/[id]/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET /api/admin/users/[id] - Détails d'un utilisateur
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          include: {
            event: {
              select: {
                id: true,
                titre: true,
                dateDebut: true,
                lieu: true,
                prix: true
              }
            }
          }
        },
        activityLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            action: true,
            entity: true,
            createdAt: true,
            newData: true
          }
        }
      }
    })

    if (!targetUser) {
      return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    // Calculer les statistiques détaillées
    const validTickets = targetUser.tickets.filter(t => t.statut !== 'CANCELLED')
    const totalSpent = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)

    // Analyse par mois des achats
    const ticketsByMonth = validTickets.reduce((acc, ticket) => {
      const month = ticket.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, tickets: 0, spent: 0 }
      }
      acc[month].tickets++
      acc[month].spent += Number(ticket.prix)
      return acc
    }, {} as Record<string, any>)

    // Événements favoris (par fréquence de participation)
    const eventParticipation = validTickets.reduce((acc, ticket) => {
      const eventId = ticket.event.id
      if (!acc[eventId]) {
        acc[eventId] = {
          event: ticket.event,
          count: 0,
          totalSpent: 0
        }
      }
      acc[eventId].count++
      acc[eventId].totalSpent += Number(ticket.prix)
      return acc
    }, {} as Record<string, any>)

    const favoriteEvents = Object.values(eventParticipation)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)

    const response = {
      // Informations de base
      id: targetUser.id,
      email: targetUser.email,
      nom: targetUser.nom,
      prenom: targetUser.prenom,
      telephone: targetUser.telephone,
      role: targetUser.role,
      statut: targetUser.statut,
      createdAt: targetUser.createdAt.toISOString(),
      updatedAt: targetUser.updatedAt.toISOString(),
      lastLogin: targetUser.lastLogin?.toISOString() || null,

      // Statistiques
      totalTickets: validTickets.length,
      totalSpent,
      averageSpent: validTickets.length > 0 ? totalSpent / validTickets.length : 0,
      firstPurchase: validTickets.length > 0 ? validTickets[validTickets.length - 1].createdAt.toISOString() : null,
      lastPurchase: validTickets.length > 0 ? validTickets[0].createdAt.toISOString() : null,
      freeTickets: validTickets.filter(t => Number(t.prix) === 0).length,
      paidTickets: validTickets.filter(t => Number(t.prix) > 0).length,

      // Données pour graphiques
      purchasesByMonth: Object.values(ticketsByMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)),
      favoriteEvents,

      // Historique des billets (derniers 50)
      tickets: validTickets.slice(0, 50).map(ticket => ({
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        statut: ticket.statut,
        prix: Number(ticket.prix),
        isGratuit: Number(ticket.prix) === 0,
        createdAt: ticket.createdAt.toISOString(),
        validatedAt: ticket.validatedAt?.toISOString() || null,
        event: ticket.event
      })),

      // Activité récente
      recentActivity: targetUser.activityLogs.map(log => ({
        id: log.id,
        type: log.type,
        action: log.action,
        entity: log.entity,
        createdAt: log.createdAt.toISOString(),
        description: formatActivityDescription(log)
      }))
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin user detail:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/admin/users/[id] - Modifier un utilisateur
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    // Empêcher l'auto-modification du rôle admin
    if (user.id === params.id && body.role && body.role !== user.role) {
      return createApiError('FORBIDDEN', 'Vous ne pouvez pas modifier votre propre rôle', 403)
    }

    // Empêcher l'auto-bannissement
    if (user.id === params.id && body.statut === 'BANNED') {
      return createApiError('FORBIDDEN', 'Vous ne pouvez pas vous bannir vous-même', 403)
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    const allowedFields = ['nom', 'prenom', 'telephone', 'role', 'statut']

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Validation du rôle
    if (updateData.role && !['USER', 'ADMIN', 'MODERATOR'].includes(updateData.role)) {
      return createApiError('VALIDATION_ERROR', 'Rôle invalide', 400)
    }

    // Validation du statut
    if (updateData.statut && !['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'].includes(updateData.statut)) {
      return createApiError('VALIDATION_ERROR', 'Statut invalide', 400)
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        statut: true,
        updatedAt: true
      }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: params.id,
        action: 'update',
        oldData: {
          role: existingUser.role,
          statut: existingUser.statut,
          nom: existingUser.nom,
          prenom: existingUser.prenom
        },
        newData: {
          role: updatedUser.role,
          statut: updatedUser.statut,
          nom: updatedUser.nom,
          prenom: updatedUser.prenom
        },
        userId: user.id
      }
    })

    return createApiResponse(updatedUser)

  } catch (error) {
    console.error('❌ Erreur API admin user update:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/admin/users/[id] - Supprimer un utilisateur
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // Empêcher l'auto-suppression
    if (user.id === params.id) {
      return createApiError('FORBIDDEN', 'Vous ne pouvez pas supprimer votre propre compte', 403)
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tickets: { where: { statut: { not: 'CANCELLED' } } }
      }
    })

    if (!existingUser) {
      return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    // Vérifier s'il y a des billets actifs
    const activeTickets = existingUser.tickets
    if (activeTickets.length > 0) {
      return createApiError(
        'CONFLICT',
        `Impossible de supprimer un utilisateur avec ${activeTickets.length} billet(s) actif(s). Bannissez plutôt l'utilisateur.`,
        409
      )
    }

    // Supprimer l'utilisateur (suppression en cascade)
    await prisma.user.delete({
      where: { id: params.id }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: params.id,
        action: 'delete',
        oldData: {
          email: existingUser.email,
          nom: existingUser.nom,
          prenom: existingUser.prenom,
          role: existingUser.role
        },
        userId: user.id
      }
    })

    return createApiResponse({ 
      message: 'Utilisateur supprimé avec succès',
      deletedUserId: params.id 
    })

  } catch (error) {
    console.error('❌ Erreur API admin user delete:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction helper pour formater les descriptions d'activité
function formatActivityDescription(activity: any): string {
  switch (activity.action) {
    case 'purchase':
      return 'Achat de billet'
    case 'free_reservation':
      return 'Réservation gratuite'
    case 'validate':
      return 'Validation de billet'
    case 'cancel':
      return 'Annulation de billet'
    case 'login':
      return 'Connexion'
    case 'logout':
      return 'Déconnexion'
    case 'update':
      return `Mise à jour ${activity.entity}`
    case 'create':
      return `Création ${activity.entity}`
    default:
      return `Action ${activity.action}`
  }
}