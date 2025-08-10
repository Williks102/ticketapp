// app/api/auth/logout/route.ts
import { 
  createApiResponse, 
  createApiError, 
  validateRequired,
  authenticateRequest,
  requireAdmin,
  comparePassword,
  generateToken,
  hashPassword,
  validateEmail,
  validatePassword,
  generateTicketNumber,
  generateQRCode
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError(
        'UNAUTHORIZED',
        'Token d\'authentification invalide',
        401
      )
    }

    // Dans une implémentation complète, on pourrait:
    // 1. Ajouter le token à une blacklist
    // 2. Invalider les refresh tokens
    // 3. Logger la déconnexion
    
    return createApiResponse(
      { message: 'Déconnexion réussie' },
      200
    )

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  }
}