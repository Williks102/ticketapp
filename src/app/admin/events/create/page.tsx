'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventFormData {
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: string
  heureDebut: string
  dateFin: string
  heureFin: string
  prix: string
  nbPlaces: string
  organisateur: string
  image: File | null
  categories: string[]
}

export default function CreateEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    titre: '',
    description: '',
    lieu: '',
    adresse: '',
    dateDebut: '',
    heureDebut: '',
    dateFin: '',
    heureFin: '',
    prix: '',
    nbPlaces: '',
    organisateur: '',
    image: null,
    categories: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    'Concerts',
    'Théâtre',
    'Festivals',
    'Expositions',
    'Spectacles',
    'Conférences',
    'Sport',
    'Gastronomie',
    'Danse',
    'Cinéma'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({
      ...prev,
      image: file
    }))
  }

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis'
    if (!formData.description.trim()) newErrors.description = 'La description est requise'
    if (!formData.lieu.trim()) newErrors.lieu = 'Le lieu est requis'
    if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est requise'
    if (!formData.dateDebut) newErrors.dateDebut = 'La date de début est requise'
    if (!formData.heureDebut) newErrors.heureDebut = 'L\'heure de début est requise'
    if (!formData.dateFin) newErrors.dateFin = 'La date de fin est requise'
    if (!formData.heureFin) newErrors.heureFin = 'L\'heure de fin est requise'
    if (!formData.organisateur.trim()) newErrors.organisateur = 'L\'organisateur est requis'

    const prix = parseFloat(formData.prix)
    if (!formData.prix || isNaN(prix) || prix < 0) {
      newErrors.prix = 'Le prix doit être un nombre positif'
    }

    const nbPlaces = parseInt(formData.nbPlaces)
    if (!formData.nbPlaces || isNaN(nbPlaces) || nbPlaces < 1) {
      newErrors.nbPlaces = 'Le nombre de places doit être supérieur à 0'
    }

    // Vérifier que la date de fin est après la date de début
    const debut = new Date(`${formData.dateDebut}T${formData.heureDebut}`)
    const fin = new Date(`${formData.dateFin}T${formData.heureFin}`)
    
    if (fin <= debut) {
      newErrors.dateFin = 'La date de fin doit être après la date de début'
    }

    // Vérifier que la date de début est dans le futur
    const now = new Date()
    if (debut <= now) {
      newErrors.dateDebut = 'La date de début doit être dans le futur'
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Sélectionnez au moins une catégorie'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Simuler la création de l'événement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Rediriger vers la liste des événements
      router.push('/admin/events')
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les modifications non sauvegardées seront perdues.')) {
      router.push('/admin/events')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Créer un nouvel événement</h1>
        <p className="text-gray-600">Remplissez les informations pour créer votre événement</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Informations générales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'événement *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                className={`input-field ${errors.titre ? 'border-red-500' : ''}`}
                placeholder="Ex: Concert de Jazz Exceptionnel"
              />
              {errors.titre && <p className="text-red-500 text-sm mt-1">{errors.titre}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Décrivez votre événement en détail..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organisateur *
              </label>
              <input
                type="text"
                name="organisateur"
                value={formData.organisateur}
                onChange={handleInputChange}
                className={`input-field ${errors.organisateur ? 'border-red-500' : ''}`}
                placeholder="Nom de l'organisateur"
              />
              {errors.organisateur && <p className="text-red-500 text-sm mt-1">{errors.organisateur}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de l'événement
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés: JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Lieu et localisation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Lieu et localisation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du lieu *
              </label>
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleInputChange}
                className={`input-field ${errors.lieu ? 'border-red-500' : ''}`}
                placeholder="Ex: Salle de spectacle Le Trianon"
              />
              {errors.lieu && <p className="text-red-500 text-sm mt-1">{errors.lieu}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                className={`input-field ${errors.adresse ? 'border-red-500' : ''}`}
                placeholder="123 Rue de la Musique, 75001 Paris"
              />
              {errors.adresse && <p className="text-red-500 text-sm mt-1">{errors.adresse}</p>}
            </div>
          </div>
        </div>

        {/* Dates et horaires */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Dates et horaires</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                name="dateDebut"
                value={formData.dateDebut}
                onChange={handleInputChange}
                className={`input-field ${errors.dateDebut ? 'border-red-500' : ''}`}
              />
              {errors.dateDebut && <p className="text-red-500 text-sm mt-1">{errors.dateDebut}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de début *
              </label>
              <input
                type="time"
                name="heureDebut"
                value={formData.heureDebut}
                onChange={handleInputChange}
                className={`input-field ${errors.heureDebut ? 'border-red-500' : ''}`}
              />
              {errors.heureDebut && <p className="text-red-500 text-sm mt-1">{errors.heureDebut}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                name="dateFin"
                value={formData.dateFin}
                onChange={handleInputChange}
                className={`input-field ${errors.dateFin ? 'border-red-500' : ''}`}
              />
              {errors.dateFin && <p className="text-red-500 text-sm mt-1">{errors.dateFin}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de fin *
              </label>
              <input
                type="time"
                name="heureFin"
                value={formData.heureFin}
                onChange={handleInputChange}
                className={`input-field ${errors.heureFin ? 'border-red-500' : ''}`}
              />
              {errors.heureFin && <p className="text-red-500 text-sm mt-1">{errors.heureFin}</p>}
            </div>
          </div>
        </div>

        {/* Billetterie */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Configuration de la billetterie</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix du billet (€) *
              </label>
              <input
                type="number"
                name="prix"
                step="0.01"
                min="0"
                value={formData.prix}
                onChange={handleInputChange}
                className={`input-field ${errors.prix ? 'border-red-500' : ''}`}
                placeholder="35.00"
              />
              {errors.prix && <p className="text-red-500 text-sm mt-1">{errors.prix}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de places *
              </label>
              <input
                type="number"
                name="nbPlaces"
                min="1"
                value={formData.nbPlaces}
                onChange={handleInputChange}
                className={`input-field ${errors.nbPlaces ? 'border-red-500' : ''}`}
                placeholder="300"
              />
              {errors.nbPlaces && <p className="text-red-500 text-sm mt-1">{errors.nbPlaces}</p>}
            </div>
          </div>
        </div>

        {/* Catégories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Catégories *</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.categories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
          {errors.categories && <p className="text-red-500 text-sm mt-2">{errors.categories}</p>}
        </div>

        {/* Aperçu */}
        {formData.titre && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Aperçu</h3>
            
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{formData.titre}</h4>
                  <p className="text-gray-600">{formData.lieu}</p>
                </div>
                {formData.prix && (
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">
                      {parseFloat(formData.prix).toFixed(2)}€
                    </span>
                  </div>
                )}
              </div>
              
              {formData.dateDebut && formData.heureDebut && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(`${formData.dateDebut}T${formData.heureDebut}`).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
              
              {formData.adresse && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {formData.adresse}
                </div>
              )}
              
              {formData.organisateur && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Organisé par {formData.organisateur}
                </div>
              )}
              
              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.categories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={isLoading}
            >
              Annuler
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Enregistrer comme brouillon
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </div>
                ) : (
                  'Créer l\'événement'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}