// src/components/admin/EventForm.tsx
'use client'

import { useState } from 'react'
import { formatEventPrice } from '@/lib/api-utils'

interface EventFormData {
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: string
  dateFin: string
  prix: number
  nbPlaces: number
  organisateur: string
  image?: string
  categories: string[]
}

interface EventFormProps {
  initialData?: Partial<EventFormData>
  onSubmit: (data: EventFormData) => Promise<void>
  loading?: boolean
}

export default function EventForm({ initialData, onSubmit, loading = false }: EventFormProps) {
  const [eventType, setEventType] = useState<'free' | 'paid'>(
    initialData?.prix === 0 ? 'free' : 'paid'
  )
  
  const [formData, setFormData] = useState<EventFormData>({
    titre: initialData?.titre || '',
    description: initialData?.description || '',
    lieu: initialData?.lieu || '',
    adresse: initialData?.adresse || '',
    dateDebut: initialData?.dateDebut || '',
    dateFin: initialData?.dateFin || '',
    prix: initialData?.prix || 0,
    nbPlaces: initialData?.nbPlaces || 100,
    organisateur: initialData?.organisateur || '',
    image: initialData?.image || '',
    categories: initialData?.categories || []
  })

  const [priceInFCFA, setPriceInFCFA] = useState(
    initialData?.prix ? initialData.prix / 100 : 0
  )

  const [errors, setErrors] = useState<string[]>([])

  const handleEventTypeChange = (type: 'free' | 'paid') => {
    setEventType(type)
    if (type === 'free') {
      setFormData(prev => ({ ...prev, prix: 0 }))
      setPriceInFCFA(0)
    }
  }

  const handlePriceChange = (fcfaPrice: number) => {
    setPriceInFCFA(fcfaPrice)
    setFormData(prev => ({ ...prev, prix: fcfaPrice * 100 })) // Convertir en centimes
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.titre.trim()) newErrors.push('Le titre est requis')
    if (!formData.description.trim()) newErrors.push('La description est requise')
    if (!formData.lieu.trim()) newErrors.push('Le lieu est requis')
    if (!formData.adresse.trim()) newErrors.push('L\'adresse est requise')
    if (!formData.dateDebut) newErrors.push('La date de début est requise')
    if (!formData.dateFin) newErrors.push('La date de fin est requise')
    if (!formData.organisateur.trim()) newErrors.push('L\'organisateur est requis')
    if (formData.nbPlaces <= 0) newErrors.push('Le nombre de places doit être positif')

    // Validation spécifique pour les événements payants
    if (eventType === 'paid' && priceInFCFA <= 0) {
      newErrors.push('Le prix est requis pour un événement payant')
    }

    // Validation des dates
    const dateDebut = new Date(formData.dateDebut)
    const dateFin = new Date(formData.dateFin)
    const now = new Date()

    if (dateDebut <= now) {
      newErrors.push('La date de début doit être dans le futur')
    }

    if (dateFin <= dateDebut) {
      newErrors.push('La date de fin doit être après la date de début')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900">
        {initialData ? 'Modifier l\'événement' : 'Créer un nouvel événement'}
      </h2>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Erreurs détectées :</h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Type d'événement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'événement *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="eventType"
                value="paid"
                checked={eventType === 'paid'}
                onChange={() => handleEventTypeChange('paid')}
                className="mr-2"
              />
              <span className="text-sm">Événement payant</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="eventType"
                value="free"
                checked={eventType === 'free'}
                onChange={() => handleEventTypeChange('free')}
                className="mr-2"
              />
              <span className="text-sm font-medium text-green-600">Événement gratuit</span>
            </label>
          </div>
        </div>

        {/* Prix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix {eventType === 'paid' && '*'}
          </label>
          {eventType === 'free' ? (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md">
              <span className="text-green-800 font-medium">GRATUIT</span>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="number"
                min="0"
                step="100"
                value={priceInFCFA}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 5000"
              />
              <p className="text-xs text-gray-500">
                Aperçu : {formatEventPrice(formData.prix)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Informations de base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre *
          </label>
          <input
            type="text"
            value={formData.titre}
            onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom de l'événement"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organisateur *
          </label>
          <input
            type="text"
            value={formData.organisateur}
            onChange={(e) => setFormData(prev => ({ ...prev, organisateur: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom de l'organisateur"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description détaillée de l'événement"
        />
      </div>

      {/* Lieu et adresse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lieu *
          </label>
          <input
            type="text"
            value={formData.lieu}
            onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom du lieu"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse *
          </label>
          <input
            type="text"
            value={formData.adresse}
            onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Adresse complète"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date et heure de début *
          </label>
          <input
            type="datetime-local"
            value={formData.dateDebut}
            onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date et heure de fin *
          </label>
          <input
            type="datetime-local"
            value={formData.dateFin}
            onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Nombre de places */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de places *
          </label>
          <input
            type="number"
            min="1"
            value={formData.nbPlaces}
            onChange={(e) => setFormData(prev => ({ ...prev, nbPlaces: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (URL)
          </label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://exemple.com/image.jpg"
          />
        </div>
      </div>

      {/* Boutons */}
      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={() => window.history.back()}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'En cours...' : (initialData ? 'Mettre à jour' : 'Créer l\'événement')}
        </button>
      </div>
    </form>
  )
}