'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { EventResponse } from '@/types/api'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<EventResponse | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // ✅ VRAI APPEL API au lieu des données en dur
        const response = await fetch(`/api/events/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Événement non trouvé')
            return
          }
          throw new Error('Erreur lors du chargement de l\'événement')
        }

        const data = await response.json()
        
        if (data.success) {
          setEvent(data.data)
        } else {
          throw new Error(data.message || 'Erreur lors du chargement')
        }

      } catch (err) {
        console.error('Erreur:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchEvent()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString))
  }

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(priceInCents / 100)
  }

  const handleReservation = () => {
    // Rediriger vers la page de réservation avec l'ID réel
    router.push(`/reservation/${event?.id}?quantity=${selectedQuantity}`)
  }

  const isEventAvailable = () => {
    if (!event) return false
    return event.statut === 'ACTIVE' && 
           event.placesRestantes > 0 && 
           new Date(event.dateDebut) > new Date()
  }

  const getAvailabilityMessage = () => {
    if (!event) return ''
    
    if (event.statut !== 'ACTIVE') {
      return 'Cet événement n\'est plus disponible'
    }
    
    if (event.placesRestantes === 0) {
      return 'Événement complet'
    }
    
    if (new Date(event.dateDebut) <= new Date()) {
      return 'Événement terminé'
    }
    
    if (event.placesRestantes < 10) {
      return `Plus que ${event.placesRestantes} places disponibles !`
    }
    
    return `${event.placesRestantes} places disponibles`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 text-xl font-semibold mb-2">
              Erreur
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <Link 
              href="/evenements"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retour aux événements
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // No event found
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-600 text-xl">
            Événement non trouvé
          </div>
          <Link 
            href="/evenements"
            className="text-orange-600 hover:underline mt-4 inline-block"
          >
            Retour aux événements
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-orange-600">Accueil</Link></li>
          <li>/</li>
          <li><Link href="/evenements" className="hover:text-orange-600">Événements</Link></li>
          <li>/</li>
          <li className="text-gray-900">{event.titre}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image de l'événement */}
        <div className="space-y-4">
          <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
            {event.image ? (
              <Image
                src={event.image}
                alt={event.titre}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Informations de l'événement */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.titre}</h1>
            <p className="text-lg text-gray-600">Par {event.organisateur}</p>
          </div>

          {/* Détails de l'événement */}
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">{formatDate(event.dateDebut)}</div>
                <div className="text-sm text-gray-500">
                  De {formatTime(event.dateDebut)} à {formatTime(event.dateFin)}
                </div>
              </div>
            </div>

            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <div className="font-medium">{event.lieu}</div>
                <div className="text-sm text-gray-500">{event.adresse}</div>
              </div>
            </div>

            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <div className="text-2xl font-bold text-orange-600">
                {formatPrice(event.prix)}
              </div>
            </div>
          </div>

          {/* Disponibilité */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Disponibilité</div>
            <div className={`font-medium ${isEventAvailable() ? 'text-green-600' : 'text-red-600'}`}>
              {getAvailabilityMessage()}
            </div>
          </div>

          {/* Sélection de quantité et réservation */}
          {isEventAvailable() && (
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Réserver vos billets</h3>
              
              <div className="mb-4">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de billets
                </label>
                <select
                  id="quantity"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Array.from({ length: Math.min(10, event.placesRestantes) }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} billet{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700">Total</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatPrice(event.prix * selectedQuantity)}
                </span>
              </div>

              <button
                onClick={handleReservation}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                Réserver maintenant
              </button>
            </div>
          )}

          {/* Catégories */}
          {event.categories && event.categories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Catégories</h3>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((category, index) => (
                  <span
                    key={index}
                    className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
        <div className="prose max-w-none text-gray-700">
          {event.description.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}