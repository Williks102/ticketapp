import { authenticateRequest } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError(
        'UNAUTHORIZED',
        'Token d\'authentification invalide',
        401
      )
    }

    // Récupérer les informations complètes de l'utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        tickets: {
          select: {
            id: true,
            prix: true
          }
        }
      }
    })

    if (!userData) {
      return createApiError(
        'USER_NOT_FOUND',
        'Utilisateur non trouvé',
        404
      )
    }

    // Calculer les statistiques
    const ticketsAchetes = userData.tickets.length
    const totalDepense = userData.tickets.reduce((sum, ticket) => sum + ticket.prix, 0)

    const response = {
      ...userData,
      ticketsAchetes,
      totalDepense,
      tickets: undefined // Retirer les billets du retour
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}
