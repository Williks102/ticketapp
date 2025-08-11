
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Types pour l'upload d'images
export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
  url: string
  etag: string
  signature: string
  version: number
  version_id: string
  folder?: string
}

// Fonction utilitaire pour uploader une image
export async function uploadEventImage(
  file: Buffer | string,
  eventId: string,
  options?: {
    folder?: string
    transformation?: any[]
  }
): Promise<CloudinaryUploadResult> {
  const uploadOptions = {
    folder: options?.folder || 'events',
    public_id: `event_${eventId}_${Date.now()}`,
    transformation: options?.transformation || [
      { width: 800, height: 600, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    tags: ['event', eventId]
  }

  try {
    const result = await cloudinary.uploader.upload(file as string, uploadOptions)
    return result as CloudinaryUploadResult
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error)
    throw new Error('Erreur lors de l\'upload de l\'image')
  }
}

// Fonction pour supprimer une image
export async function deleteEventImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error)
    throw new Error('Erreur lors de la suppression de l\'image')
  }
}

// Fonction pour générer une URL optimisée
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: string
    quality?: string
  }
): string {
  return cloudinary.url(publicId, {
    width: options?.width || 400,
    height: options?.height || 300,
    crop: options?.crop || 'fill',
    quality: options?.quality || 'auto',
    fetch_format: 'auto'
  })
}