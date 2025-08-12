import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, validateRequired, validateEmail, hashPassword } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

// GET - Récupérer le profil utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    // Récupérer les informations du profil
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
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
        lastLogin: true
      }
    })

    if (!userProfile) {
      return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    const profileResponse = {
      id: userProfile.id,
      email: userProfile.email,
      nom: userProfile.nom,
      prenom: userProfile.prenom,
      telephone: userProfile.telephone,
      role: userProfile.role,
      statut: userProfile.statut,
      createdAt: userProfile.createdAt.toISOString(),
      updatedAt: userProfile.updatedAt.toISOString(),
      lastLogin: userProfile.lastLogin?.toISOString() || null
    }

    return createApiResponse(profileResponse)

  } catch (error) {
    console.error('❌ Erreur API user profile GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mettre à jour le profil utilisateur
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    const body = await request.json()
    const updateData: any = {}

    // Validation et préparation des données
    if (body.nom) {
      if (body.nom.trim().length < 2) {
        return createApiError('VALIDATION_ERROR', 'Le nom doit contenir au moins 2 caractères', 400)
      }
      updateData.nom = body.nom.trim()
    }

    if (body.prenom) {
      if (body.prenom.trim().length < 2) {
        return createApiError('VALIDATION_ERROR', 'Le prénom doit contenir au moins 2 caractères', 400)
      }
      updateData.prenom = body.prenom.trim()
    }

    if (body.email) {
      if (!validateEmail(body.email)) {
        return createApiError('VALIDATION_ERROR', 'Format d\'email invalide', 400)
      }
      
      // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: body.email,
          id: { not: user.userId }
        }
      })
      
      if (existingUser) {
        return createApiError('EMAIL_EXISTS', 'Cet email est déjà utilisé', 409)
      }
      
      updateData.email = body.email.toLowerCase().trim()
    }

    if (body.telephone) {
      updateData.telephone = body.telephone.trim()
    }

    // Gestion du changement de mot de passe
    if (body.currentPassword && body.newPassword) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { password: true }
      })
      
      if (!currentUser) {
        return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
      }
      
      const isValidPassword = await comparePassword(body.currentPassword, currentUser.password)
      if (!isValidPassword) {
        return createApiError('INVALID_PASSWORD', 'Mot de passe actuel incorrect', 400)
      }
      
      const passwordErrors = validatePassword(body.newPassword)
      if (passwordErrors.length > 0) {
        return createApiError('INVALID_PASSWORD', 'Nouveau mot de passe invalide', 400, passwordErrors)
      }
      
      updateData.password = await hashPassword(body.newPassword)
    }

    // Si rien à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return createApiError('VALIDATION_ERROR', 'Aucune donnée à mettre à jour', 400)
    }

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
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
        lastLogin: true
      }
    })

    const profileResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      nom: updatedUser.nom,
      prenom: updatedUser.prenom,
      telephone: updatedUser.telephone,
      role: updatedUser.role,
      statut: updatedUser.statut,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      lastLogin: updatedUser.lastLogin?.toISOString() || null
    }

    return createApiResponse(profileResponse, 200, 'Profil mis à jour avec succès')

  } catch (error) {
    console.error('❌ Erreur API user profile PUT:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}