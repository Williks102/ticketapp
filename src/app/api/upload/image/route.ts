// src/app/api/upload/image/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from 'next/server'
import { 
  uploadImage, 
  validateImageFile, 
  UploadApiResponseSimple,
  CloudinaryUploadOptions 
} from '@/lib/cloudinary'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest 
} from '@/lib/api-utils'

// POST /api/upload/image - Upload d'image vers Cloudinary
export async function POST(request: NextRequest) {
  try {
    // Vérification optionnelle de l'authentification
    // const user = await authenticateRequest(request)
    // if (!user) {
    //   return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    // }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return createApiError(
        'VALIDATION_ERROR',
        'Aucun fichier fourni',
        400
      )
    }

    // Validation du fichier
    const validationErrors = validateImageFile(file, 5) // 5MB max
    if (validationErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Fichier invalide',
        400,
        validationErrors
      )
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Options d'upload Cloudinary
    const uploadOptions: CloudinaryUploadOptions = {
      folder: folder,
      resource_type: 'image',
      quality: 'auto',
      format: 'auto',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Limiter la taille max
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      tags: [folder, 'app-upload']
    }

    // Upload vers Cloudinary
    const uploadResult: UploadApiResponseSimple = await uploadImage(buffer, uploadOptions)

    // Réponse formatée
    const response = {
      success: true,
      data: {
        imageUrl: uploadResult.imageUrl,
        publicId: uploadResult.publicId,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        format: uploadResult.format
      },
      message: 'Image uploadée avec succès'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Erreur upload API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return createApiError(
      'UPLOAD_ERROR',
      `Erreur lors de l'upload: ${errorMessage}`,
      500
    )
  }
}

// Optionnel: GET pour récupérer les métadonnées d'une image
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return createApiError(
        'VALIDATION_ERROR',
        'Public ID requis',
        400
      )
    }

    // Récupérer les métadonnées depuis Cloudinary
    const cloudinary = (await import('@/lib/cloudinary')).default
    const result = await cloudinary.api.resource(publicId)

    const response = {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      createdAt: result.created_at
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur récupération métadonnées:', error)
    return createApiError(
      'FETCH_ERROR',
      'Erreur lors de la récupération des métadonnées',
      500
    )
  }
}