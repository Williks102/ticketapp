// src/app/api/admin/users/route.ts - CORRECTION PROPRIÉTÉ DUPLIQUÉE LIGNE 348
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { 
  createApiResponse, 
  createApiError, 
  authenticateRequest, 
  requireAdmin,
  hashPassword,
  validateEmail
} from '@/lib/api-utils'
import { JWTPayload } from '@/types/api'

const prisma = new PrismaClient()

// ✅ Helper function pour validateRequired corrigée
function validateRequired(data: any, fields: string[]): string[] {
  const errors: string[] = []
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} requis`)
    }
  }
  
  return errors
}

// GET /api/admin/users - Lister les utilisateurs avec pagination et filtres
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

    // Construction des filtres
    const filters: any = {}
    
    if (search) {
      filters.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role && ['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
      filters.role = role
    }

    if (status && ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'].includes(status)) {
      filters.statut = status
    }

    // Compter le total
    const total = await prisma.user.count({ where: filters })

    // Récupérer les utilisateurs avec leurs statistiques
    const users = await prisma.user.findMany({
      where: filters,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tickets: {
          select: {
            id: true,
            prix: true,
            statut: true
          }
        }
      }
    })

    // Calculer les statistiques pour chaque utilisateur
    const usersWithStats = users.map(userData => {
      const validTickets = userData.tickets.filter(t => t.statut !== 'CANCELLED')
      const totalTickets = validTickets.length
      const totalSpent = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
      const averageSpent = totalTickets > 0 ? 
        Math.round(totalSpent / totalTickets) : 0
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

    // ✅ Log de l'activité admin - CORRIGÉ
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'users',
        entityId: 'list',
        action: 'view',
        newData: { 
          count: users.length,
          filters: { search, role, status, page, limit }
        },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          adminName: user.nom ? 
            `${user.nom} ${user.prenom}` : user.email,
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

    // ✅ Validations CORRIGÉES
    const validationErrors: string[] = []

    // Validation des champs requis
    if (!email || email.trim() === '') validationErrors.push('Email requis')
    if (!nom || nom.trim() === '') validationErrors.push('Nom requis')
    if (!prenom || prenom.trim() === '') validationErrors.push('Prénom requis')
    if (!password || password.trim() === '') validationErrors.push('Mot de passe requis')
    
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
      return createApiError('VALIDATION_ERROR', validationErrors.join(', '), 400)
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return createApiError('EMAIL_EXISTS', 'Cet email est déjà utilisé', 409)
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone?.trim() || null,
        role,
        password: hashedPassword,
        statut: 'ACTIVE'
      }
    })

    // Log de l'activité admin
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
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          createdUserRole: newUser.role,
          sendWelcomeEmail
        }
      }
    })

    // TODO: Envoyer un email de bienvenue si demandé
    if (sendWelcomeEmail) {
      // Logique d'envoi d'email à implémenter
      console.log(`📧 Email de bienvenue à envoyer à ${newUser.email}`)
    }

    // Préparer la réponse (sans le mot de passe)
    const response = {
      id: newUser.id,
      email: newUser.email,
      nom: newUser.nom,
      prenom: newUser.prenom,
      telephone: newUser.telephone,
      role: newUser.role,
      statut: newUser.statut,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
      lastLogin: null
    }

    return createApiResponse(response, 201)

  } catch (error) {
    console.error('❌ Erreur API admin users POST:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/admin/users/bulk - Actions en lot sur les utilisateurs
export async function PUT(request: NextRequest) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { userIds, action, data } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return createApiError('VALIDATION_ERROR', 'Liste d\'utilisateurs requise', 400)
    }

    if (!action) {
      return createApiError('VALIDATION_ERROR', 'Action requise', 400)
    }

    let updateData: any = {}
    let actionType = ''

    switch (action) {
      case 'activate':
        updateData = { statut: 'ACTIVE' }
        actionType = 'bulk_activate'
        break
      case 'deactivate':
        updateData = { statut: 'INACTIVE' }
        actionType = 'bulk_deactivate'
        break
      case 'ban':
        updateData = { statut: 'BANNED' }
        actionType = 'bulk_ban'
        break
      case 'promote':
        updateData = { role: 'ADMIN' }
        actionType = 'bulk_promote'
        break
      case 'demote':
        updateData = { role: 'USER' }
        actionType = 'bulk_demote'
        break
      default:
        return createApiError('VALIDATION_ERROR', 'Action non supportée', 400)
    }

    // Effectuer la mise à jour en lot
    const result = await prisma.user.updateMany({
      where: { 
        id: { in: userIds },
        // Empêcher l'admin de se modifier lui-même
        NOT: { id: user.id }
      },
      data: updateData
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'users',
        entityId: 'bulk',
        action: actionType,
        newData: {
          affectedUsers: result.count,
          userIds: userIds.filter(id => id !== user.id), // Exclure l'admin
          action,
          updateData
        },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          timestamp: new Date().toISOString()
        }
      }
    })

    return createApiResponse({
      message: `${result.count} utilisateur(s) mis à jour avec succès`,
      affectedCount: result.count,
      action,
      excludedSelf: userIds.includes(user.id)
    })

  } catch (error) {
    console.error('❌ Erreur API admin users bulk PUT:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}