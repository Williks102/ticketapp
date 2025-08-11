// src/lib/cloudinary.ts - VERSION CORRIGÉE COMPLÈTE
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// ========================================
// TYPES CORRIGÉS POUR CLOUDINARY
// ========================================

// Interface complète pour les résultats d'upload Cloudinary
export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  format: string
  bytes: number
  etag: string
  signature: string
  version: number
  version_id: string
  folder?: string
  created_at?: string
  resource_type?: string
  type?: string
  placeholder?: boolean
  tags?: string[]
  original_filename?: string
  // Nouvelles propriétés qui peuvent manquer
  asset_id?: string
  display_name?: string
  access_mode?: string
}

// Interface simplifiée pour les réponses API
export interface UploadApiResponseSimple {
  imageUrl: string
  publicId: string
  width: number
  height: number
  bytes?: number
  format?: string
}

// Type pour les options d'upload
export interface CloudinaryUploadOptions {
  folder?: string
  public_id?: string
  transformation?: any[]
  tags?: string[]
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  quality?: string | number
  format?: string
  width?: number
  height?: number
  crop?: string
}

// ========================================
// FONCTIONS UTILITAIRES CORRIGÉES
// ========================================

/**
 * Upload une image vers Cloudinary
 * @param file Buffer ou string (base64 ou URL)
 * @param options Options d'upload
 * @returns Résultat d'upload typé
 */
export async function uploadEventImage(
  file: Buffer | string,
  eventId: string,
  options?: {
    folder?: string
    transformation?: any[]
    tags?: string[]
  }
): Promise<CloudinaryUploadResult> {
  const uploadOptions: CloudinaryUploadOptions = {
    folder: options?.folder || 'events',
    public_id: `event_${eventId}_${Date.now()}`,
    transformation: options?.transformation || [
      { width: 800, height: 600, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    tags: options?.tags || ['event', eventId],
    resource_type: 'image'
  }

  try {
    let result: UploadApiResponse

    if (Buffer.isBuffer(file)) {
      // Upload depuis un Buffer
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error)
            else if (result) resolve(result)
            else reject(new Error('Aucun résultat d\'upload'))
          }
        ).end(file)
      })
    } else {
      // Upload depuis une string (URL ou base64)
      result = await cloudinary.uploader.upload(file, uploadOptions)
    }

    // Mapper vers notre interface avec toutes les propriétés
    const mappedResult: CloudinaryUploadResult = {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      etag: result.etag,
      signature: result.signature,
      version: result.version,
      version_id: result.version_id || '', // Propriété qui peut manquer
      folder: result.folder,
      created_at: result.created_at,
      resource_type: result.resource_type,
      type: result.type,
      placeholder: result.placeholder,
      tags: result.tags,
      original_filename: result.original_filename,
      asset_id: result.asset_id,
      display_name: result.display_name,
      access_mode: result.access_mode
    }

    return mappedResult
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error)
    throw new Error(`Erreur lors de l'upload de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

/**
 * Upload générique avec gestion des erreurs améliorée
 * @param file Fichier à uploader
 * @param options Options d'upload
 * @returns Résultat simplifié
 */
export async function uploadImage(
  file: Buffer | string,
  options?: CloudinaryUploadOptions
): Promise<UploadApiResponseSimple> {
  const defaultOptions: CloudinaryUploadOptions = {
    folder: 'uploads',
    resource_type: 'image',
    quality: 'auto',
    format: 'auto',
    ...options
  }

  try {
    let result: UploadApiResponse

    if (Buffer.isBuffer(file)) {
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          defaultOptions,
          (error, uploadResult) => {
            if (error) {
              reject(error)
            } else if (uploadResult) {
              resolve(uploadResult)
            } else {
              reject(new Error('Aucun résultat d\'upload reçu'))
            }
          }
        ).end(file)
      })
    } else {
      result = await cloudinary.uploader.upload(file, defaultOptions)
    }

    return {
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format
    }
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error)
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Supprime une image de Cloudinary
 * @param publicId ID public de l'image à supprimer
 * @returns Promise<void>
 */
export async function deleteEventImage(publicId: string): Promise<void> {
  try {
    if (!publicId) {
      throw new Error('Public ID requis pour la suppression')
    }

    const result = await cloudinary.uploader.destroy(publicId)
    
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Échec de suppression: ${result.result}`)
    }
    
    console.log(`Image supprimée avec succès: ${publicId}`)
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error)
    throw new Error(`Erreur lors de la suppression de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

/**
 * Génère une URL optimisée pour une image
 * @param publicId ID public de l'image
 * @param options Options de transformation
 * @returns URL optimisée
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
    format?: string
  }
): string {
  if (!publicId) {
    return ''
  }

  const transformationOptions = {
    width: options?.width || 400,
    height: options?.height || 300,
    crop: options?.crop || 'fill',
    quality: options?.quality || 'auto',
    fetch_format: options?.format || 'auto'
  }

  return cloudinary.url(publicId, transformationOptions)
}

/**
 * Génère plusieurs tailles d'une même image
 * @param publicId ID public de l'image
 * @returns Object avec différentes tailles
 */
export function getImageSizes(publicId: string) {
  if (!publicId) {
    return {
      thumbnail: '',
      small: '',
      medium: '',
      large: '',
      original: ''
    }
  }

  return {
    thumbnail: cloudinary.url(publicId, { 
      width: 150, height: 150, crop: 'fill', quality: 'auto', fetch_format: 'auto' 
    }),
    small: cloudinary.url(publicId, { 
      width: 300, height: 200, crop: 'fill', quality: 'auto', fetch_format: 'auto' 
    }),
    medium: cloudinary.url(publicId, { 
      width: 600, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' 
    }),
    large: cloudinary.url(publicId, { 
      width: 1200, height: 800, crop: 'fill', quality: 'auto', fetch_format: 'auto' 
    }),
    original: cloudinary.url(publicId, { 
      quality: 'auto', fetch_format: 'auto' 
    })
  }
}

/**
 * Extrait le public_id d'une URL Cloudinary
 * @param url URL Cloudinary
 * @returns Public ID ou null
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null
    }

    const parts = url.split('/')
    const uploadIndex = parts.findIndex(part => part === 'upload')
    
    if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) {
      return null
    }

    // Récupérer la partie après /upload/v{version}/
    const pathParts = parts.slice(uploadIndex + 2)
    const fullPath = pathParts.join('/')
    
    // Enlever l'extension du fichier
    const publicId = fullPath.split('.')[0]
    
    return publicId
  } catch (error) {
    console.error('Erreur extraction public_id:', error)
    return null
  }
}

/**
 * Valide si une URL est une URL Cloudinary valide
 * @param url URL à vérifier
 * @returns boolean
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') && url.includes('upload')
}

/**
 * Transforme une image existante sans la re-uploader
 * @param publicId ID public de l'image
 * @param transformations Transformations à appliquer
 * @returns URL de l'image transformée
 */
export function transformExistingImage(
  publicId: string,
  transformations: any[]
): string {
  return cloudinary.url(publicId, {
    transformation: transformations,
    fetch_format: 'auto',
    quality: 'auto'
  })
}

// ========================================
// HELPERS POUR LA VALIDATION
// ========================================

/**
 * Valide un fichier image avant upload
 * @param file Fichier à valider
 * @param maxSizeMB Taille max en MB
 * @returns Array d'erreurs ou array vide si valide
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): string[] {
  const errors: string[] = []
  
  // Types MIME autorisés
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Format non supporté. Utilisez JPEG, PNG, WebP ou GIF')
  }
  
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux (max ${maxSizeMB}MB)`)
  }
  
  if (file.size === 0) {
    errors.push('Fichier vide')
  }
  
  return errors
}