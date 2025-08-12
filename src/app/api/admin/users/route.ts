// src/app/api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

// src/app/api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

// GET /api/admin/users - Liste des utilisateurs
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Construction des conditions de recherche
    const whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      whereConditions.role = role
    }

    if (status) {
      whereConditions.statut = status
    }

    // Récupération des utilisateurs avec leurs statistiques
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          telephone: true,
          role: true,
          statut: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          tickets: {
            where: { statut: { not: 'CANCELLED' } },
            select: { prix: true, createdAt: true }
          }
        }
      }),
      prisma.user.count({ where: whereConditions })
    ])

    // Enrichir avec des statistiques
    const usersWithStats = users.map(userData => {
      const validTickets = userData.tickets
      const totalTickets = validTickets.length
      const totalSpent = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
      const averageSpent = totalTickets > 0 ? totalSpent / totalTickets : 0

      // Calculer l'activité récente (derniers 30 jours)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentTickets = validTickets.filter(ticket => ticket.createdAt >= thirtyDaysAgo)

      return {
        id: userData.id,
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        telephone: userData.telephone,
        role: userData.role,
        statut: userData.statut,
        createdAt: userData.createdAt.toISOString(),
        updatedAt: userData.updatedAt.toISOString(),
        lastLogin: userData.lastLogin?.toISOString() || null,
        
        // Statistiques
        totalTickets,
        totalSpent,
        averageSpent: Math.round(averageSpent * 100) / 100,
        recentActivity: recentTickets.length,
        isActive: userData.lastLogin && userData.lastLogin > thirtyDaysAgo,
        freeTickets: validTickets.filter(t => Number(t.prix) === 0).length,
        paidTickets: validTickets.filter(t => Number(t.prix) > 0).length
      }
    })

    const response = {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        role,
        status,
        sortBy,
        sortOrder
      },
      summary: {
        totalUsers: total,
        activeUsers: usersWithStats.filter(u => u.isActive).length,
        adminUsers: usersWithStats.filter(u => u.role === 'ADMIN').length,
        bannedUsers: usersWithStats.filter(u => u.statut === 'BANNED').length,
        inactiveUsers: usersWithStats.filter(u => u.statut === 'INACTIVE').length
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin users GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/users - Créer un nouvel utilisateur (optionnel)
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { email, nom, prenom, telephone, role = 'USER', password } = body

    // Validation des champs requis
    if (!email || !nom || !prenom || !password) {
      return createApiError('VALIDATION_ERROR', 'Email, nom, prénom et mot de passe requis', 400)
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return createApiError('EMAIL_EXISTS', 'Cet email est déjà utilisé', 409)
    }

    // Hasher le mot de passe
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        nom,
        prenom,
        telephone: telephone || null,
        password: hashedPassword,
        role,
        statut: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        statut: true,
        createdAt: true
      }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: newUser.id,
        action: 'create',
        newData: {
          email: newUser.email,
          nom: newUser.nom,
          prenom: newUser.prenom,
          role: newUser.role
        },
        userId: user.id
      }
    })

    return createApiResponse(newUser, 201)

  } catch (error) {
    console.error('❌ Erreur API admin users POST:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// ===============================================
// Fonctions utilitaires réutilisées plus bas
// ===============================================
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