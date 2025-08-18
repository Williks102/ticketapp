// src/app/admin/events/[id]/edit/page.tsx - PAGE ÉDITION ÉVÉNEMENT
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/ImageUpload'

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
  statut: 'ACTIVE' | 'DRAFT' | 'CANCELLED' | 'COMPLETED'
}

interface EventDetails extends EventFormData {
  id: string
  placesRestantes: number
  ticketsVendus: number
  revenue: number
  createdAt: string
  updatedAt: string
}

const CATEGORIES_OPTIONS = [
  'Musique', 'Théâtre', 'Danse', 'Cinéma', 'Art', 'Sport',
  'Conférence', 'Formation', 'Networking', 'Festival', 'Divers'
]

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon', color: 'gray' },
  { value: 'ACTIVE', label: 'Actif', color: 'green' },
  { value: 'CANCELLED', label: 'Annulé', color: 'red' },
  { value: 'COMPLETED', label: 'Terminé', color: 'blue' }
]

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [eventType, setEventType] = useState<'free' | 'paid'>('paid')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [originalEvent, setOriginalEvent] = useState<EventDetails | null>(null)
  
  const [formData, setFormData] = useState<EventFormData>({
    titre: '',
    description: '',
    lieu: '',
    adresse: '',
    dateDebut: '',
    dateFin: '',
    prix: 0,
    nbPlaces: 100,
    organisateur: '',
    image: '',
    categories: [],
    statut: 'ACTIVE'
  })

  const [priceInFCFA, setPriceInFCFA] = useState(0)

  // ✅ CORRECTION - Fonction token unifiée
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  // Charger les données de l'événement
  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoadingData(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/admin/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Événement non trouvé')
        }
        throw new Error('Erreur lors du chargement de l\'événement')
      }

      const { data: event } = await response.json()
      setOriginalEvent(event)

      // Convertir les dates ISO en format datetime-local
      const dateDebut = new Date(event.dateDebut)
      const dateFin = new Date(event.dateFin)

      const formatDateForInput = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setFormData({
        titre: event.titre,
        description: event.description,
        lieu: event.lieu,
        adresse: event.adresse || '',
        dateDebut: formatDateForInput(dateDebut),
        dateFin: formatDateForInput(dateFin),
        prix: event.prix,
        nbPlaces: event.nbPlaces,
        organisateur: event.organisateur || '',
        image: event.image || '',
        categories: event.categories || [],
        statut: event.statut
      })

      // Déterminer le type d'événement et prix
      const isGratuit = event.prix === 0
      setEventType(isGratuit ? 'free' : 'paid')
      setPriceInFCFA(isGratuit ? 0 : event.prix / 100)

    } catch (err) {
      console.error('Erreur chargement événement:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoadingData(false)
    }
  }

  // Gestion du changement de type d'événement
  const handleEventTypeChange = (type: 'free' | 'paid') => {
    setEventType(type)
    if (type === 'free') {
      setFormData(prev => ({ ...prev, prix: 0 }))
      setPriceInFCFA(0)
    }
  }

  // Gestion du prix en FCFA
  const handlePriceChange = (fcfaPrice: number) => {
    setPriceInFCFA(fcfaPrice)
    // Stocker en centimes pour l'API
    setFormData(prev => ({ ...prev, prix: fcfaPrice * 100 }))
  }

  // Gestion des catégories
  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  // Gestion de l'image uploadée
  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }))
  }

  // Validation du formulaire
  const validateForm = (): boolean => {
    if (!formData.titre.trim()) {
      setError('Le titre est requis')
      return false
    }
    if (!formData.description.trim()) {
      setError('La description est requise')
      return false
    }
    if (!formData.lieu.trim()) {
      setError('Le lieu est requis')
      return false
    }
    if (!formData.dateDebut) {
      setError('La date de début est requise')
      return false
    }
    if (!formData.dateFin) {
      setError('La date de fin est requise')
      return false
    }
    if (new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
      setError('La date de fin doit être postérieure à la date de début')
      return false
    }
    if (formData.nbPlaces <= 0) {
      setError('Le nombre de places doit être supérieur à 0')
      return false
    }
    if (eventType === 'paid' && formData.prix <= 0) {
      setError('Le prix doit être supérieur à 0 pour un événement payant')
      return false
    }

    // Validation spécifique pour la modification
    if (originalEvent && formData.nbPlaces < originalEvent.ticketsVendus) {
      setError(`Impossible de réduire le nombre de places en dessous de ${originalEvent.ticketsVendus} (billets déjà vendus)`)
      return false
    }

    return true
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Préparer les données pour l'API
      const eventData = {
        ...formData,
        dateDebut: new Date(formData.dateDebut).toISOString(),
        dateFin: new Date(formData.dateFin).toISOString(),
        categories: formData.categories.length > 0 ? formData.categories : ['Divers'],
        prix: eventType === 'free' ? 0 : formData.prix
      }

      console.log('Données à modifier:', eventData)

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la modification de l\'événement')
      }

      const updatedEvent = await response.json()
      console.log('Événement modifié:', updatedEvent)

      setSuccess(true)

      // Redirection après succès
      setTimeout(() => {
        router.push(`/admin/events/${eventId}`)
      }, 2000)

    } catch (err) {
      console.error('Erreur modification événement:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Suppression de l'événement
  const handleDelete = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la suppression')
      }

      router.push('/admin/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
    }
  }

  // Chargement initial
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-32 bg-gray-300 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Page de succès
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Événement modifié avec succès!
            </h2>
            <p className="text-gray-600 mb-6">
              Redirection vers les détails de l'événement...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Modifier l'événement
              </h1>
              <p className="text-gray-600 mt-2">
                {originalEvent?.titre}
              </p>
            </div>
            
            {/* Statut et actions */}
            <div className="flex items-center space-x-3">
              {originalEvent && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">
                    {originalEvent.ticketsVendus} billets vendus
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">
                    {originalEvent.placesRestantes} places restantes
                  </span>
                </div>
              )}
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700 p-2"
                title="Supprimer l'événement"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Statut de l'événement */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Statut de l'événement
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, statut: status.value as any }))}
                    className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                      formData.statut === status.value
                        ? `bg-${status.color}-500 text-white border-${status.color}-500`
                        : `bg-white text-gray-700 border-gray-300 hover:border-${status.color}-400`
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Informations de base */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Informations générales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'événement *
                  </label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu *
                  </label>
                  <input
                    type="text"
                    value={formData.lieu}
                    onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisateur
                  </label>
                  <input
                    type="text"
                    value={formData.organisateur}
                    onChange={(e) => setFormData(prev => ({ ...prev, organisateur: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de places *
                  </label>
                  <input
                    type="number"
                    min={originalEvent?.ticketsVendus || 1}
                    value={formData.nbPlaces}
                    onChange={(e) => setFormData(prev => ({ ...prev, nbPlaces: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                  {originalEvent && (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum : {originalEvent.ticketsVendus} (billets déjà vendus)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Dates et horaires
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date et heure de début *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Type d'événement et prix */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Tarification
              </h3>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Type d'événement *
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="eventType"
                      value="free"
                      checked={eventType === 'free'}
                      onChange={() => handleEventTypeChange('free')}
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Gratuit</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="eventType"
                      value="paid"
                      checked={eventType === 'paid'}
                      onChange={() => handleEventTypeChange('paid')}
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Payant</span>
                  </label>
                </div>

                {eventType === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix par billet (FCFA) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={priceInFCFA}
                      onChange={(e) => handlePriceChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Prix affiché aux utilisateurs : {priceInFCFA.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload d'image */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Image de l'événement
              </h3>
              
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImage={formData.image}
                folder="events"
                maxSize={5}
                aspectRatio="landscape"
                className="w-full"
              />
            </div>

            {/* Catégories */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Catégories
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {CATEGORIES_OPTIONS.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                      formData.categories.includes(category)
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Boutons de soumission */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Modification en cours...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder les modifications
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Supprimer l'événement
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
                {originalEvent?.ticketsVendus > 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    ⚠️ {originalEvent.ticketsVendus} billets ont déjà été vendus pour cet événement.
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}