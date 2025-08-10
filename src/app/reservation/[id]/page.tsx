'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Event {
  id: string
  titre: string
  lieu: string
  dateDebut: Date
  prix: number
}

interface FormData {
  email: string
  nom: string
  prenom: string
  telephone: string
  createAccount: boolean
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

// Données d'exemple
const eventExemple: Event = {
  id: '1',
  titre: 'Concert de Jazz Exceptionnel',
  lieu: 'Salle de spectacle Le Trianon',
  dateDebut: new Date('2024-12-15T20:00:00'),
  prix: 35.00
}

export default function ReservationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    createAccount: false,
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Récupérer les données de l'événement
    setEvent(eventExemple)
    
    // Récupérer la quantité depuis les paramètres URL
    const qty = searchParams.get('quantity')
    if (qty) setQuantity(Number(qty))
  }, [params.id, searchParams])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (!formData.nom) newErrors.nom = 'Nom requis'
    if (!formData.prenom) newErrors.prenom = 'Prénom requis'
    if (!formData.telephone) newErrors.telephone = 'Téléphone requis'

    if (formData.createAccount) {
      if (!formData.password) {
        newErrors.password = 'Mot de passe requis'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
      }
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions d\'utilisation'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleNextStep = () => {
    if (currentStep === 1 && validateForm()) {
      setCurrentStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Rediriger vers la page de confirmation
      window.location.href = '/confirmation/success'
    } catch (error) {
      console.error('Erreur lors de la réservation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Événement non trouvé</h1>
          <Link href="/evenements" className="btn-primary mt-4">
            Retour aux événements
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Réservation</h1>
        
        {/* Indicateur d'étapes */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Informations</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-300"></div>
          
          <div className={`flex items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Paiement</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6">Vos informations</h2>
              
              <div className="space-y-6">
                {/* Informations personnelles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      className={`input-field ${errors.prenom ? 'border-red-500' : ''}`}
                      placeholder="Votre prénom"
                    />
                    {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className={`input-field ${errors.nom ? 'border-red-500' : ''}`}
                      placeholder="Votre nom"
                    />
                    {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="votre@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className={`input-field ${errors.telephone ? 'border-red-500' : ''}`}
                    placeholder="06 12 34 56 78"
                  />
                  {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>}
                </div>

                {/* Création de compte optionnelle */}
                <div className="border-t pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="createAccount"
                      checked={formData.createAccount}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm">Créer un compte pour gérer mes billets</span>
                  </label>

                  {formData.createAccount && (
                    <div className="mt-4 space-y-4 pl-6 border-l-2 border-primary-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mot de passe *
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                          placeholder="Minimum 6 caractères"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmer le mot de passe *
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                          placeholder="Répétez votre mot de passe"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Conditions d'utilisation */}
                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="mr-2 mt-1"
                    />
                    <span className="text-sm text-gray-600">
                      J'accepte les{' '}
                      <Link href="/conditions" className="text-primary-600 hover:underline">
                        conditions d'utilisation
                      </Link>{' '}
                      et la{' '}
                      <Link href="/confidentialite" className="text-primary-600 hover:underline">
                        politique de confidentialité
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button onClick={handleNextStep} className="btn-primary">
                  Continuer vers le paiement
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6">Paiement sécurisé</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-blue-800 font-medium">Paiement sécurisé avec cryptage SSL</span>
                </div>
              </div>

              {/* Simulateur de formulaire de paiement */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de carte
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="input-field"
                    disabled
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'expiration
                    </label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="input-field"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="input-field"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Traitement en cours...
                    </div>
                  ) : (
                    `Payer ${formatPrice(event.prix * quantity)}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800">{event.titre}</h4>
                <p className="text-sm text-gray-600">{event.lieu}</p>
                <p className="text-sm text-gray-600">{formatDate(event.dateDebut)}</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span>{quantity} billet{quantity > 1 ? 's' : ''}</span>
                  <span>{formatPrice(event.prix * quantity)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Frais de service</span>
                  <span>Gratuit</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(event.prix * quantity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}