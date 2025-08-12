// src/components/EventCard.tsx - VERSION MISE À JOUR
import Link from 'next/link'
import Image from 'next/image'
import { EventResponse } from '@/types/api'
import { 
  formatEventPrice, 
  isEventFree, 
  getEventActionText,
  getEventActionButtonClass,
  getPriceBadgeClass,
  getEventTypeIcon 
} from '@/lib/api-utils'

interface EventCardProps {
  event: EventResponse
  onReserve?: (eventId: string) => void  // Nouveau: pour événements gratuits
  onPurchase?: (eventId: string) => void // Nouveau: pour événements payants
  showActions?: boolean // Nouveau: afficher les boutons d'action
}

export function EventCard({ event, onReserve, onPurchase, showActions = true }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
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

  // Gérer l'action selon le type d'événement
  const handleAction = async () => {
    if (event.statut !== 'ACTIVE' || event.placesRestantes <= 0) return

    if (isEventFree(event.prix) && onReserve) {
      await onReserve(event.id)
    } else if (!isEventFree(event.prix) && onPurchase) {
      await onPurchase(event.id)
    }
  }

  const canTakeAction = event.statut === 'ACTIVE' && event.placesRestantes > 0
  const isFree = isEventFree(event.prix)

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
        
        {/* Badge de statut en haut à droite */}
        <div className="absolute top-3 right-3">
          {getStatusBadge(event.statut)}
        </div>

        {/* Badge de prix en haut à gauche - NOUVEAU */}
        <div className="absolute top-3 left-3">
          <span className={getPriceBadgeClass(event.prix)}>
            {getEventTypeIcon(event.prix)} {formatEventPrice(event.prix)}
          </span>
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

        {/* Disponibilité avec barre de progression */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Places disponibles</span>
            <span className={`text-sm font-medium ${getAvailabilityColor(event.placesRestantes, event.nbPlaces)}`}>
              {event.placesRestantes > 0 ? (
                `${event.placesRestantes} / ${event.nbPlaces}`
              ) : (
                'Complet'
              )}
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                event.placesRestantes > event.nbPlaces * 0.5 
                  ? 'bg-green-500' 
                  : event.placesRestantes > event.nbPlaces * 0.2 
                    ? 'bg-orange-500' 
                    : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.max(0, Math.min(100, ((event.nbPlaces - event.placesRestantes) / event.nbPlaces) * 100))}%` 
              }}
            ></div>
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

        {/* Boutons d'action - AMÉLIORÉS */}
        <div className="space-y-2">
          {showActions && (onReserve || onPurchase) ? (
            // Mode avec actions (réservation/achat)
            <button
              onClick={handleAction}
              disabled={!canTakeAction}
              className={getEventActionButtonClass(event)}
            >
              {getEventActionText(event)}
            </button>
          ) : (
            // Mode navigation simple (lien vers détails)
            <Link
              href={`/evenements/${event.id}`}
              className={`block w-full text-center py-2 px-4 rounded-lg font-medium transition-colors ${
                canTakeAction
                  ? isFree 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canTakeAction ? 'Voir les détails' : 'Indisponible'}
            </Link>
          )}

          {/* Message d'aide pour événements gratuits */}
          {isFree && canTakeAction && (
            <p className="text-xs text-green-600 text-center">
              ✨ Réservation gratuite - Aucun paiement requis
            </p>
          )}
        </div>
      </div>
    </div>
  )
}