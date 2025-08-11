// components/ImageUpload.tsx
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  currentImage?: string
  className?: string
  folder?: string // Dossier Cloudinary (ex: 'events', 'users')
  maxSize?: number // Taille max en MB (défaut: 5)
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'free' // Ratio d'aspect suggéré
}

export function ImageUpload({ 
  onImageUploaded, 
  currentImage, 
  className = '',
  folder = 'events',
  maxSize = 5,
  aspectRatio = 'landscape'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validation du fichier
  const validateFile = (file: File): string | null => {
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      return 'Veuillez sélectionner une image valide (JPG, PNG, WebP, GIF)'
    }

    // Vérifier la taille
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `L'image ne doit pas dépasser ${maxSize}MB`
    }

    return null
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validation
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setUploading(true)

      // Créer un preview local immédiat
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Préparer les données pour l'upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      // Upload vers notre API
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'upload')
      }

      const { imageUrl, publicId } = await response.json()
      
      // Informer le composant parent
      onImageUploaded(imageUrl)
      
      console.log('Image uploadée avec succès:', { imageUrl, publicId })

    } catch (error) {
      console.error('Erreur upload:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
      // Restaurer l'image précédente en cas d'erreur
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    try {
      setError(null)
      
      // Si il y a une image actuelle, on peut essayer de la supprimer de Cloudinary
      if (currentImage && currentImage.includes('cloudinary')) {
        // Extraire le public_id de l'URL Cloudinary
        const publicId = extractPublicIdFromUrl(currentImage)
        if (publicId) {
          await fetch('/api/upload/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId })
          })
        }
      }

      setPreview(null)
      onImageUploaded('')
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      // On continue même si la suppression échoue
      setPreview(null)
      onImageUploaded('')
    }
  }

  // Fonction utilitaire pour extraire le public_id d'une URL Cloudinary
  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      const parts = url.split('/')
      const uploadIndex = parts.findIndex(part => part === 'upload')
      if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
        const pathParts = parts.slice(uploadIndex + 2)
        const filename = pathParts.join('/').split('.')[0]
        return filename
      }
    } catch (error) {
      console.error('Erreur extraction public_id:', error)
    }
    return null
  }

  // Gérer le drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile && fileInputRef.current) {
      // Simuler la sélection de fichier
      const dt = new DataTransfer()
      dt.items.add(imageFile)
      fileInputRef.current.files = dt.files
      
      // Déclencher l'événement change
      const event = new Event('change', { bubbles: true })
      fileInputRef.current.dispatchEvent(event)
    }
  }

  // Classes CSS pour le ratio d'aspect
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square'
      case 'portrait': return 'aspect-[3/4]'
      case 'landscape': return 'aspect-[4/3]'
      default: return 'h-48'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {preview ? (
          // Zone avec image existante
          <div className="relative">
            <div className={`relative w-full ${getAspectRatioClass()} mb-4 overflow-hidden rounded-lg`}>
              <Image
                src={preview}
                alt="Preview de l'image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Upload en cours...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                disabled={uploading}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Upload...' : 'Changer l\'image'}
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
                disabled={uploading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          // Zone pour ajouter une image
          <div className="py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ajouter une image
            </h3>
            
            <p className="text-gray-500 mb-4">
              Glissez-déposez une image ou cliquez pour sélectionner
            </p>
            
            {!uploading && (
              <button
                type="button"
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Sélectionner une image
              </button>
            )}

            {uploading && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mr-2"></div>
                <span className="text-orange-600">Upload en cours...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Informations sur les formats acceptés */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Formats acceptés: JPG, PNG, WebP, GIF</p>
        <p>Taille maximum: {maxSize}MB</p>
        {aspectRatio !== 'free' && (
          <p>Ratio recommandé: {aspectRatio === 'square' ? '1:1' : aspectRatio === 'landscape' ? '4:3' : '3:4'}</p>
        )}
      </div>
    </div>
  )
}

// ========================================
// COMPOSANT EXEMPLE D'UTILISATION
// ========================================

export function ImageUploadExample() {
  const [eventImage, setEventImage] = useState<string>('')

  const handleImageUploaded = (imageUrl: string) => {
    setEventImage(imageUrl)
    console.log('Nouvelle image d\'événement:', imageUrl)
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Ajouter une image d'événement</h2>
      
      <ImageUpload 
        onImageUploaded={handleImageUploaded}
        currentImage={eventImage}
        folder="events"
        maxSize={5}
        aspectRatio="landscape"
        className="mb-4"
      />
      
      {eventImage && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✅ Image sauvegardée: {eventImage.substring(0, 50)}...
          </p>
        </div>
      )}
    </div>
  )
}