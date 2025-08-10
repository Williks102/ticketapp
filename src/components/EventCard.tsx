import Link from 'next/link'
import Image from 'next/image'

interface EventCardProps {
  event: {
    id: string
    titre: string
    description: string
    lieu: string
    dateDebut: Date
    prix: number
    placesRestantes: number
    image?: string
  }
}

export function EventCard({ event }: EventCardProps) {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      {/* Image de l'événement */}
      <div className="relative h-48 mb-4 bg-gray-200 rounded-lg overflow-hidden">
        {event.image ? (
          <Image 
            src={event.image} 
            alt={event.titre}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-400 to-primary-600">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        )}
        
        {/* Badge places restantes */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            event.placesRestantes > 50 
              ? 'bg-green-100 text-green-800' 
              : event.placesRestantes > 10
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {event.placesRestantes} places
          </span>
        </div>
      </div>

      {/* Informations de l'événement */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">
          {event.titre}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-3">
          {event.description}
        </p>
        
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.lieu}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.dateDebut)}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold text-primary-600">
            {formatPrice(event.prix)}
          </span>
          
          <Link href={`/evenements/${event.id}`} className="btn-primary">
            Réserver
          </Link>
        </div>
      </div>
    </div>
  )
}