// app/api/auth/login/route.ts - Version corrigée
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { 
  createApiResponse, 
  createApiError, 
  validateRequired,
  comparePassword,
  generateToken
} from '@/lib/api-utils'
import { LoginRequest, AuthResponse } from '@/types/api'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    
    // Validation des champs requis
    const requiredFields = ['email', 'password']
    const validationErrors = validateRequired(body, requiredFields)
    
    if (validationErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Email et mot de passe requis',
        400
      )
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (!user) {
      return createApiError(
        'INVALID_CREDENTIALS',
        'Email ou mot de passe incorrect',
        401
      )
    }

    // Vérifier le mot de passe
    const isValidPassword = await comparePassword(body.password, user.password)
    
    if (!isValidPassword) {
      return createApiError(
        'INVALID_CREDENTIALS',
        'Email ou mot de passe incorrect',
        401
      )
    }

    // Vérifier le statut du compte
    if (user.statut === 'BANNED') {
      return createApiError(
        'ACCOUNT_BANNED',
        'Votre compte a été suspendu',
        403
      )
    }

    if (user.statut === 'INACTIVE') {
      return createApiError(
        'ACCOUNT_INACTIVE',
        'Votre compte est inactif',
        403
      )
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Générer le token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN'
    })

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role as 'USER' | 'ADMIN'
      },
      token
    }

    return createApiResponse(response, 200, 'Connexion réussie')

  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}