// src/app/admin/events/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EventForm from '@/components/admin/EventForm'
import { ArrowLeft } from 'lucide-react'

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

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  }

  const handleSubmit = async (formData: EventFormData) => {
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
        categories: formData.categories.length > 0 ? formData.categories : ['Divers']
      }

      console.log('Données à envoyer:', eventData)

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création de l\'événement')
      }

      const createdEvent = await response.json()
      console.log('Événement créé:', createdEvent)

      setSuccess(true)

      // Redirection après succès
      setTimeout(() => {
        router.push('/admin/events')
      }, 2000)

    } catch (err) {
      console.error('Erreur création événement:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

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
              Événement créé avec succès!
            </h2>
            <p className="text-gray-600 mb-6">
              Votre événement a été créé et est maintenant visible par les utilisateurs.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/admin/events')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Voir tous les événements
              </button>
              <button
                onClick={() => router.push('/admin/events/create')}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Créer un autre événement
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Créer un nouvel événement
              </h1>
              <p className="text-gray-600 mt-2">
                Ajoutez un nouvel événement à votre plateforme. Vous pouvez créer des événements gratuits ou payants.
              </p>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erreur lors de la création
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conseils pour les événements gratuits */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                💡 Astuce pour les événements gratuits
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p className="mb-2">
                  Les événements gratuits permettent d'attirer plus de participants et de faire découvrir votre organisation.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Aucun processus de paiement requis</li>
                  <li>Réservation instantanée pour les utilisateurs</li>
                  <li>Idéal pour les conférences, formations, et événements promotionnels</li>
                  <li>Vous pouvez toujours collecter des données sur vos participants</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <EventForm
          onSubmit={handleSubmit}
          loading={loading}
        />

        {/* Guide rapide */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Guide rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✨ Événements gratuits</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sélectionnez "Événement gratuit"</li>
                <li>• Le prix sera automatiquement mis à 0</li>
                <li>• Les utilisateurs pourront réserver instantanément</li>
                <li>• Parfait pour maximiser la participation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">💰 Événements payants</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sélectionnez "Événement payant"</li>
                <li>• Définissez le prix en FCFA</li>
                <li>• Paiement sécurisé via Stripe</li>
                <li>• Génération automatique des billets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}