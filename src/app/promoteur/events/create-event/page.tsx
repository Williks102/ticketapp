'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EventForm {
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
  categories: string[]
}

const categoriesOptions = [
  'Concert', 'Théâtre', 'Conférence', 'Atelier', 'Festival', 
  'Sport', 'Exposition', 'Gastronomie', 'Danse', 'Formation'
]

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<EventForm>({
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
    organisateur: 'Marie Dubois',
    categories: []
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Dans un vrai projet, appelez votre API
      // const response = await fetch('/api/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     dateDebut: `${formData.dateDebut}T${formData.heureDebut}:00`,
      //     dateFin: `${formData.dateFin}T${formData.heureFin}:00`,
      //     prix: parseFloat(formData.prix),
      //     nbPlaces: parseInt(formData.nbPlaces)
      //   })
      // })

      // Simulation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirection vers la liste des événements
      router.push('/promoteur/events?created=true')
      
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      alert('Erreur lors de la création de l\'événement')
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.titre && formData.description && formData.categories.length > 0
      case 2:
        return formData.lieu && formData.adresse && formData.dateDebut && formData.dateFin
      case 3:
        return formData.prix && formData.nbPlaces
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un nouvel événement</h1>
          <p className="text-gray-600">Remplissez les informations pour créer votre événement</p>
        </div>
        
        <Link
          href="/promoteur/events"
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Annuler
        </Link>
      </div>

      {/* Indicateur d'étapes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  step <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step === 1 && 'Informations générales'}
                  {step === 2 && 'Lieu et dates'}
                  {step === 3 && 'Tarification'}
                </p>
              </div>
              
              {step < 3 && (
                <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                  step < currentStep ? 'bg-orange-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          
          {/* Étape 1: Informations générales */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
              
              <div>
                <label className="form-label">Titre de l'événement *</label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="Ex: Concert jazz en plein air"
                  required
                />
              </div>

              <div>
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-primary"
                  placeholder="Décrivez votre événement en détail..."
                  required
                />
              </div>

              <div>
                <label className="form-label">Organisateur</label>
                <input
                  type="text"
                  name="organisateur"
                  value={formData.organisateur}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="Nom de l'organisateur"
                />
              </div>

              <div>
                <label className="form-label">Catégories * (sélectionnez au moins une)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {categoriesOptions.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        formData.categories.includes(category)
                          ? 'bg-orange-50 border-orange-300 text-orange-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Lieu et dates */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lieu et dates</h2>
              
              <div>
                <label className="form-label">Lieu *</label>
                <input
                  type="text"
                  name="lieu"
                  value={formData.lieu}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="Ex: Salle des fêtes, Parc municipal..."
                  required
                />
              </div>

              <div>
                <label className="form-label">Adresse complète *</label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className="input-primary"
                  placeholder="123 Rue de la République, 75001 Paris"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Date de début *</label>
                  <input
                    type="date"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleInputChange}
                    className="input-primary"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Heure de début *</label>
                  <input
                    type="time"
                    name="heureDebut"
                    value={formData.heureDebut}
                    onChange={handleInputChange}
                    className="input-primary"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Date de fin *</label>
                  <input
                    type="date"
                    name="dateFin"
                    value={formData.dateFin}
                    onChange={handleInputChange}
                    className="input-primary"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Heure de fin *</label>
                  <input
                    type="time"
                    name="heureFin"
                    value={formData.heureFin}
                    onChange={handleInputChange}
                    className="input-primary"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Tarification */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarification et places</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Prix du billet (€) *</label>
                  <input
                    type="number"
                    name="prix"
                    value={formData.prix}
                    onChange={handleInputChange}
                    className="input-primary"
                    placeholder="25.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="form-help">Prix en euros, ex: 25.50</p>
                </div>

                <div>
                  <label className="form-label">Nombre de places *</label>
                  <input
                    type="number"
                    name="nbPlaces"
                    value={formData.nbPlaces}
                    onChange={handleInputChange}
                    className="input-primary"
                    placeholder="100"
                    min="1"
                    required
                  />
                  <p className="form-help">Nombre total de places disponibles</p>
                </div>
              </div>

              {/* Résumé */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Résumé de votre événement</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Titre:</span> {formData.titre || 'Non défini'}</p>
                  <p><span className="font-medium">Lieu:</span> {formData.lieu || 'Non défini'}</p>
                  <p><span className="font-medium">Date:</span> {formData.dateDebut || 'Non définie'} à {formData.heureDebut || 'Non définie'}</p>
                  <p><span className="font-medium">Prix:</span> {formData.prix ? `${formData.prix}€` : 'Non défini'}</p>
                  <p><span className="font-medium">Places:</span> {formData.nbPlaces || 'Non défini'}</p>
                  <p><span className="font-medium">Catégories:</span> {formData.categories.join(', ') || 'Aucune'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Boutons de navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>

          <div className="flex space-x-3">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                disabled={!isStepValid(currentStep)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !isStepValid(3)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Créer l'événement
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Conseils */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">💡 Conseils pour créer un événement réussi</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choisissez un titre accrocheur et descriptif</li>
              <li>• Ajoutez une description détaillée avec le programme</li>
              <li>• Vérifiez la disponibilité du lieu avant de valider</li>
              <li>• Définissez un prix attractif par rapport à la concurrence</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}