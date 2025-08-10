'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// Interface pour les données d'événement
interface Event {
  id: string
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: Date
  dateFin: Date
  prix: number
  nbPlaces: number
  placesRestantes: number
  image?: string
  organisateur: string
}

// Données d'exemple - à remplacer par un appel API
const eventExemple: Event = {
  id: '1',
  titre: 'Concert de Jazz Exceptionnel',
  description: `Rejoignez-nous pour une soirée inoubliable de jazz avec les meilleurs musiciens de la région. 
  
  Au programme :
  - Trio de jazz moderne avec des compositions originales
  - Standards du jazz revisités
  - Improvisation et interaction avec le public
  - Bar et restauration sur place
  
  Une soirée parfaite pour les amateurs de musique et ceux qui souhaitent découvrir l'univers du jazz dans une ambiance intimiste et chaleureuse.`,
  lieu: 'Salle de spectacle Le Trianon',
  adresse: '123 Rue de la Musique, 75001 Paris',
  dateDebut: new Date('2024-12-15T20:00:00'),
  dateFin: new Date('2024-12-15T23:00:00'),
  prix: 35.00,
  nbPlaces: 300,
  placesRestantes: 150,
  image: '/images/concert-jazz.jpg',
  organisateur: 'Association Culturelle Jazz & Co'
}

export default function EventDetailPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simuler un appel API
    setTimeout(() => {
      setEvent(eventExemple)
      setIsLoading(false)
    }, 500)
  }, [params.id])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleReservation = () => {
    // Rediriger vers la page de réservation
    window.location.href = `/reservation/${event?.id}?quantity=${selectedQuantity}`
  }

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

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Événement non trouvé</h1>
        <Link href="/evenements" className="btn-primary">
          Retour aux événements
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-primary-600">Accueil</Link></li>
          <li>/</li>
          <li><Link href="/evenements" className="hover:text-primary-600">Événements</Link></li>
          <li>/</li>
          <li className="text-gray-800">{event.titre}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="relative h-64 md:h-96 mb-6 bg-gray-200 rounded-lg overflow-hidden">
            {event.image ? (
              <Image 
                src={event.image} 
                alt={event.titre}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-400 to-primary-600">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            )}
          </div>

          {/* Titre et informations de base */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {event.titre}
          </h1>

          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(event.dateDebut)} de {formatTime(event.dateDebut)} à {formatTime(event.dateFin)}
            </div>
            
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.lieu}
            </div>
            
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 8h1m0 0V9m4 6V9m0 6h1M9 21h1M9 7h1" />
              </svg>
              {event.adresse}
            </div>
            
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Organisé par {event.organisateur}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Description</h2>
            <div className="prose max-w-none">
              {event.description.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-600 mb-4 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Carte/Plan d'accès */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Plan d'accès</h2>
            <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p>Carte interactive à venir</p>
                <p className="text-sm mt-1">{event.adresse}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar réservation */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="card">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-primary-600">
                    {formatPrice(event.prix)}
                  </span>
                  <span className="text-sm text-gray-500">par billet</span>
                </div>
                
                <div className={`text-sm font-medium ${
                  event.placesRestantes > 50 
                    ? 'text-green-600' 
                    : event.placesRestantes > 10
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {event.placesRestantes > 0 
                    ? `${event.placesRestantes} places restantes`
                    : 'Complet'
                  }
                </div>
              </div>

              {event.placesRestantes > 0 ? (
                <div className="space-y-4">
                  {/* Sélection quantité */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de billets
                    </label>
                    <select
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                      className="input-field"
                    >
                      {Array.from({ length: Math.min(10, event.placesRestantes) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num} billet{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Total</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(event.prix * selectedQuantity)}
                      </span>
                    </div>
                  </div>

                  {/* Bouton réservation */}
                  <button
                    onClick={handleReservation}
                    className="btn-primary w-full text-lg py-3"
                  >
                    Réserver maintenant
                  </button>

                  <div className="text-xs text-gray-500 text-center">
                    Paiement sécurisé • Billets envoyés par email
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="font-medium">Événement complet</p>
                    <p className="text-sm mt-1">Plus de places disponibles</p>
                  </div>
                  
                  <button className="btn-secondary w-full" disabled>
                    Liste d'attente
                  </button>
                </div>
              )}
            </div>

            {/* Informations supplémentaires */}
            <div className="card mt-6">
              <h3 className="font-semibold mb-4">Informations pratiques</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Billets électroniques avec QR code
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Contrôle à l'entrée
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Annulation jusqu'à 24h avant
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Parking disponible sur site
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}