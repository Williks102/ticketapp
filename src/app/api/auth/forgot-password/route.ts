import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { 
  createApiResponse, 
  createApiError, 
  validateEmail,
  generateToken
} from '@/lib/api-utils'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email || !validateEmail(email)) {
      return createApiError(
        'INVALID_EMAIL',
        'Email invalide',
        400
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Pour des raisons de sécurité, on retourne toujours un succès
    // même si l'email n'existe pas
    
    if (user) {
      // Générer un token de réinitialisation
      const resetToken = generateToken({
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role as 'USER' | 'ADMIN'
      })
      
      // Dans une implémentation complète, on enverrait un email
      // avec le lien de réinitialisation
      console.log(`Reset token for ${email}: ${resetToken}`)
    }

    return createApiResponse(
      { message: 'Si votre email existe, vous recevrez un lien de réinitialisation' },
      200
    )

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}