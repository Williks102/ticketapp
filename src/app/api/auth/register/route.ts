// app/api/auth/register/route.ts
import { RegisterRequest, AuthResponse, JWTPayload } from '@/types/api'
import { NextRequest } from 'next/server'
import { EventResponse, TicketResponse } from '@/types/api' 
import { PrismaClient } from '@prisma/client'
import { 
  createApiResponse, 
  createApiError, 
  validateEmail, 
  validatePassword,
  hashPassword,
  generateToken,
  validateRequired 
} from '@/lib/api-utils'



const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    
    // Validation des champs requis
    const requiredFields = ['email', 'nom', 'prenom', 'password']
    const validationErrors = validateRequired(body, requiredFields)
    
    if (validationErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Données manquantes',
        400,
        validationErrors
      )
    }

    // Validation de l'email
    if (!validateEmail(body.email)) {
      return createApiError(
        'INVALID_EMAIL',
        'Format d\'email invalide',
        400
      )
    }

    // Validation du mot de passe
    const passwordErrors = validatePassword(body.password)
    if (passwordErrors.length > 0) {
      return createApiError(
        'INVALID_PASSWORD',
        'Mot de passe invalide',
        400,
        passwordErrors
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return createApiError(
        'USER_EXISTS',
        'Un compte avec cet email existe déjà',
        409
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(body.password)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: body.email,
        nom: body.nom,
        prenom: body.prenom,
        telephone: body.telephone,
        password: hashedPassword,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true
      }
    })

    const tokenPayload: JWTPayload = {
  id: user.id,
  email: user.email,
  role: user.role,
  nom: user.nom,      // ✅ AJOUTER
  prenom: user.prenom // ✅ AJOUTER
}

    const token = generateToken(tokenPayload)

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

    return createApiResponse(response, 201, 'Compte créé avec succès')

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}
