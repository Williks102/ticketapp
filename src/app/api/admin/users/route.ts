// src/app/api/admin/users/route.ts - VERSION COMPLÈTE CORRIGÉE
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { 
  createApiResponse, 
  createApiError, 
  authenticateRequest, 
  requireAdmin,
  hashPassword,
  validateEmail,
  validateRequired 
} from '@/lib/api-utils'
import { JWTPayload } from '@/types/api'

const prisma = new PrismaClient()

// GET /api/admin/users - Liste des utilisateurs avec statistiques
export async function GET(request: NextRequest) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
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

    if (role && role !== 'all') {
      whereConditions.role = role
    }

    if (status && status !== 'all') {
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
            select: { 
              prix: true, 
              createdAt: true,
              statut: true 
            }
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
      const averageSpent = totalTickets > 0 ? Math.round(totalSpent / totalTickets) : 0
      const freeTickets = validTickets.filter(t => Number(t.prix) === 0).length
      const paidTickets = validTickets.filter(t => Number(t.prix) > 0).length

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
        stats: {
          totalTickets,
          totalSpent,
          averageSpent,
          freeTickets,
          paidTickets,
          eventsAttended: validTickets.filter(t => t.statut === 'USED').length,
          upcomingEvents: validTickets.filter(t => t.statut === 'VALID').length
        }
      }
    })

    // Log de l'activité admin
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'users',
        entityId: 'list',
        action: 'view',
        oldData: undefined,
        newData: { 
          count: users.length,
          filters: { search, role, status, page, limit }
        },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          adminName: user.nom ? `${user.nom} ${user.prenom}` : user.email,
          timestamp: new Date().toISOString()
        }
      }
    }).catch(err => console.error('❌ Erreur log activité:', err))

    const response = {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
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
        newUsersThisMonth: 0, // À calculer si nécessaire
        activeUsers: users.filter(u => u.statut === 'ACTIVE').length,
        bannedUsers: users.filter(u => u.statut === 'BANNED').length
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

// POST /api/admin/users - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { email, nom, prenom, telephone, role = 'USER', password, sendWelcomeEmail = false } = body

    // Validations
    const validationErrors: string[] = []

    if (!validateRequired(email)) validationErrors.push('Email requis')
    if (!validateRequired(nom)) validationErrors.push('Nom requis')
    if (!validateRequired(prenom)) validationErrors.push('Prénom requis')
    if (!validateRequired(password)) validationErrors.push('Mot de passe requis')
    
    if (email && !validateEmail(email)) {
      validationErrors.push('Format d\'email invalide')
    }

    if (password && password.length < 6) {
      validationErrors.push('Le mot de passe doit contenir au moins 6 caractères')
    }

    if (role && !['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
      validationErrors.push('Rôle invalide')
    }

    if (validationErrors.length > 0) {
      return createApiError('VALIDATION_ERROR', 'Données invalides', 400, validationErrors)
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return createApiError('EMAIL_EXISTS', 'Cet email est déjà utilisé', 409)
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone?.trim() || null,
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
        createdAt: true,
        updatedAt: true
      }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: newUser.id,
        action: 'create',
        oldData: null,
        newData: {
          email: newUser.email,
          nom: newUser.nom,
          prenom: newUser.prenom,
          role: newUser.role
        },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          createdUserEmail: newUser.email,
          timestamp: new Date().toISOString()
        }
      }
    }).catch(err => console.error('❌ Erreur log activité:', err))

    const response = {
      user: {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString()
      },
      message: `Utilisateur ${newUser.email} créé avec succès`
    }

    return createApiResponse(response, 201)

  } catch (error) {
    console.error('❌ Erreur API admin users POST:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la création de l\'utilisateur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/admin/users - Mise à jour en lot (optionnel)
export async function PUT(request: NextRequest) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { userIds, action, value } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return createApiError('VALIDATION_ERROR', 'Liste d\'utilisateurs requise', 400)
    }

    if (!action || !['updateStatus', 'updateRole', 'delete'].includes(action)) {
      return createApiError('VALIDATION_ERROR', 'Action invalide', 400)
    }

    let updatedCount = 0

    switch (action) {
      case 'updateStatus':
        if (!['ACTIVE', 'INACTIVE', 'BANNED'].includes(value)) {
          return createApiError('VALIDATION_ERROR', 'Statut invalide', 400)
        }

        // Empêcher l'auto-bannissement
        if (value === 'BANNED' && userIds.includes(user.id)) {
          return createApiError('FORBIDDEN', 'Vous ne pouvez pas vous bannir vous-même', 403)
        }

        const statusUpdate = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            id: { not: user.id } // Empêcher l'auto-modification
          },
          data: { statut: value }
        })
        updatedCount = statusUpdate.count
        break

      case 'updateRole':
        if (!['USER', 'ADMIN', 'MODERATOR'].includes(value)) {
          return createApiError('VALIDATION_ERROR', 'Rôle invalide', 400)
        }

        // Empêcher l'auto-modification du rôle
        const roleUpdate = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            id: { not: user.id }
          },
          data: { role: value }
        })
        updatedCount = roleUpdate.count
        break

      case 'delete':
        // Empêcher l'auto-suppression
        const deleteUpdate = await prisma.user.deleteMany({
          where: { 
            id: { in: userIds },
            id: { not: user.id }
          }
        })
        updatedCount = deleteUpdate.count
        break
    }

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'users',
        entityId: 'batch_update',
        action: `batch_${action}`,
        oldData: { userIds },
        newData: { action, value, updatedCount },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          timestamp: new Date().toISOString()
        }
      }
    }).catch(err => console.error('❌ Erreur log activité:', err))

    return createApiResponse({
      updatedCount,
      action,
      value: action !== 'delete' ? value : undefined,
      message: `${updatedCount} utilisateur(s) mis à jour`
    })

  } catch (error) {
    console.error('❌ Erreur API admin users PUT:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la mise à jour', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/admin/users - Suppression en lot (optionnel)
export async function DELETE(request: NextRequest) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return createApiError('VALIDATION_ERROR', 'Liste d\'utilisateurs requise', 400)
    }

    // Empêcher l'auto-suppression
    if (userIds.includes(user.id)) {
      return createApiError('FORBIDDEN', 'Vous ne pouvez pas vous supprimer vous-même', 403)
    }

    // Supprimer les utilisateurs
    const deleteResult = await prisma.user.deleteMany({
      where: { 
        id: { in: userIds },
        id: { not: user.id }
      }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'users',
        entityId: 'batch_delete',
        action: 'batch_delete',
        oldData: { userIds },
        newData: { deletedCount: deleteResult.count },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          timestamp: new Date().toISOString()
        }
      }
    }).catch(err => console.error('❌ Erreur log activité:', err))

    return createApiResponse({
      deletedCount: deleteResult.count,
      message: `${deleteResult.count} utilisateur(s) supprimé(s)`
    })

  } catch (error) {
    console.error('❌ Erreur API admin users DELETE:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la suppression', 500)
  } finally {
    await prisma.$disconnect()
  }
}