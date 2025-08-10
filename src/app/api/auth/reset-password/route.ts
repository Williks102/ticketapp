// app/api/auth/reset-password/route.ts
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()
    
    if (!token || !newPassword) {
      return createApiError(
        'VALIDATION_ERROR',
        'Token et nouveau mot de passe requis',
        400
      )
    }

    // Valider le nouveau mot de passe
    const passwordErrors = validatePassword(newPassword)
    if (passwordErrors.length > 0) {
      return createApiError(
        'INVALID_PASSWORD',
        'Mot de passe invalide',
        400,
        passwordErrors
      )
    }

    // Vérifier le token
    const decoded = await authenticateRequest(request)
    if (!decoded) {
      return createApiError(
        'INVALID_TOKEN',
        'Token de réinitialisation invalide ou expiré',
        400
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    return createApiResponse(
      { message: 'Mot de passe réinitialisé avec succès' },
      200
    )

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}