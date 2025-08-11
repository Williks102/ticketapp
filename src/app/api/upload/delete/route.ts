// src/app/api/upload/delete/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from 'next/server'
import { deleteEventImage, extractPublicIdFromUrl } from '@/lib/cloudinary'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest,
  requireAdmin 
} from '@/lib/api-utils'

// DELETE /api/upload/delete - Suppression d'image de Cloudinary
export async function DELETE(request: NextRequest) {
  try {
    // Optionnel: vérifier l'authentification
    // const user = await authenticateRequest(request)
    // if (!user) {
    //   return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    // }

    const body = await request.json()
    let { publicId, imageUrl } = body

    // Si on a une URL au lieu d'un publicId, l'extraire
    if (!publicId && imageUrl) {
      publicId = extractPublicIdFromUrl(imageUrl)
    }

    if (!publicId) {
      return createApiError(
        'VALIDATION_ERROR',
        'Public ID ou URL d\'image requis',
        400
      )
    }

    // Valider le format du publicId
    if (typeof publicId !== 'string' || publicId.trim().length === 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Public ID invalide',
        400
      )
    }

    // Supprimer l'image de Cloudinary
    await deleteEventImage(publicId.trim())

    const response = {
      success: true,
      message: 'Image supprimée avec succès',
      publicId: publicId.trim()
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur suppression API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    // Différents types d'erreurs
    if (errorMessage.includes('not found')) {
      return createApiError(
        'NOT_FOUND',
        'Image non trouvée',
        404
      )
    }
    
    if (errorMessage.includes('Invalid public_id')) {
      return createApiError(
        'VALIDATION_ERROR',
        'Public ID invalide',
        400
      )
    }

    return createApiError(
      'DELETE_ERROR',
      `Erreur lors de la suppression: ${errorMessage}`,
      500
    )
  }
}

// POST alternative pour la suppression (si certains clients ne supportent pas DELETE)
export async function POST(request: NextRequest) {
  return DELETE(request)
}