// src/components/EventCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { EventResponse } from '@/types/api'

interface EventCardProps {
  event: EventResponse
}

export function EventCard({ event }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatPrice = (price: number) => {
    const priceInFCFA = price / 100
    return `${priceInFCFA.toLocaleString('fr-FR')} FCFA`
  }

  const getAvailabilityColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100
    if (percentage > 50) return 'text-green-600'
    if (percentage > 20) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'COMPLET': 'bg-red-100 text-red-800',
      'ANNULE': 'bg-gray-100 text-gray-800',
      'INACTIVE': 'bg-yellow-100 text-yellow-800'
    }
    
    const labels = {
      'ACTIVE': 'Disponible',
      'COMPLET': 'Complet',
      'ANNULE': 'Annulé',
      'INACTIVE': 'Indisponible'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.ACTIVE}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.titre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        )}
        
        {/* Badge de statut */}
        <div className="absolute top-3 right-3">
          {getStatusBadge(event.statut)}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {event.titre}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {event.description}
          </p>
        </div>

        {/* Informations de l'événement */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.dateDebut)}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.lieu}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {event.organisateur}
          </div>
        </div>

        {/* Prix et disponibilité */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold text-orange-600">
            {formatPrice(event.prix)}
          </div>
          <div className={`text-sm font-medium ${getAvailabilityColor(event.placesRestantes, event.nbPlaces)}`}>
            {event.placesRestantes > 0 ? (
              `${event.placesRestantes} place${event.placesRestantes > 1 ? 's' : ''} restante${event.placesRestantes > 1 ? 's' : ''}`
            ) : (
              'Complet'
            )}
          </div>
        </div>

        {/* Catégories */}
        {event.categories && event.categories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {event.categories.slice(0, 3).map((category, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                >
                  {category}
                </span>
              ))}
              {event.categories.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{event.categories.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bouton d'action */}
        <Link
          href={`/evenements/${event.id}`}
          className={`block w-full text-center py-2 px-4 rounded-lg font-medium transition-colors ${
            event.statut === 'ACTIVE' && event.placesRestantes > 0
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
        >
          {event.statut === 'ACTIVE' ? (
            event.placesRestantes > 0 ? 'Réserver' : 'Complet'
          ) : (
            'Indisponible'
          )}
        </Link>
      </div>
    </div>
  )
}