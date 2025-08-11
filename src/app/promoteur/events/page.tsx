'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EventResponse } from '@/types/api'

// Données simulées
const mockEvents: EventResponse[] = [
  {
    id: '1',
    titre: 'Concert Jazz en Plein Air',
    description: 'Soirée jazz exceptionnelle dans le parc municipal avec des artistes locaux renommés',
    lieu: 'Parc Municipal',
    adresse: '123 Rue du Parc, 75001 Paris',
    dateDebut: '2025-08-20T19:30:00Z',
    dateFin: '2025-08-20T23:00:00Z',
    prix: 45,
    nbPlaces: 100,
    placesRestantes: 15,
    statut: 'ACTIVE',
    organisateur: 'Marie Dubois',
    createdAt: '2025-07-15T10:00:00Z',
    updatedAt: '2025-07-15T10:00:00Z',
    ticketsVendus: 85,
    revenue: 3825
  },
  {
    id: '2',
    titre: 'Atelier Cuisine Locale',
    description: 'Découvrez les secrets de la cuisine traditionnelle avec un chef expérimenté',
    lieu: 'Studio Culinaire',
    adresse: '456 Avenue des Chefs, 75002 Paris',
    dateDebut: '2025-08-25T14:00:00Z',
    dateFin: '2025-08-25T17:00:00Z',
    prix: 75,
    nbPlaces: 20,
    placesRestantes: 8,
    statut: 'ACTIVE',
    organisateur: 'Marie Dubois',
    createdAt: '2025-07-10T14:30:00Z',
    updatedAt: '2025-07-10T14:30:00Z',
    ticketsVendus: 12,
    revenue: 900
  },
  {
    id: '3',
    titre: 'Exposition d\'Art Contemporain',
    description: 'Vernissage d\'une exposition unique d\'artistes locaux émergents',
    lieu: 'Galerie d\'Art Moderne',
    adresse: '789 Rue de l\'Art, 75003 Paris',
    dateDebut: '2025-09-05T18:00:00Z',
    dateFin: '2025-09-05T22:00:00Z',
    prix: 25,
    nbPlaces: 150,
    placesRestantes: 89,
    statut: 'ACTIVE',
    organisateur: 'Marie Dubois',
    createdAt: '2025-07-20T09:15:00Z',
    updatedAt: '2025-07-20T09:15:00Z',
    ticketsVendus: 61,
    revenue: 1525
  },
  {
    id: '4',
    titre: 'Conférence Tech Innovation',
    description: 'Conférence sur les dernières innovations technologiques',
    lieu: 'Centre de Conférence',
    adresse: '321 Boulevard Tech, 75004 Paris',
    dateDebut: '2025-07-15T09:00:00Z',
    dateFin: '2025-07-15T18:00:00Z',
    prix: 120,
    nbPlaces: 80,
    placesRestantes: 0,
    statut: 'COMPLET',
    organisateur: 'Marie Dubois',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
    ticketsVendus: 80,
    revenue: 9600
  }
]

export default function UserEventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'past' | 'draft'>('all')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        // Dans un vrai projet: const response = await fetch('/api/user/events')
        await new Promise(resolve => setTimeout(resolve, 500))
        setEvents(mockEvents)
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getStatusBadge = (event: EventResponse) => {
    const now = new Date()
    const eventDate = new Date(event.dateDebut)
    const eventEnd = new Date(event.dateFin)
    
    if (event.statut === 'COMPLET' || event.placesRestantes === 0) {
      return <span className="badge badge-success">Complet</span>
    } else if (now > eventEnd) {
      return <span className="badge badge-info">Terminé</span>
    } else if (now > eventDate) {
      return <span className="badge badge-warning">En cours</span>
    } else if (event.statut === 'ACTIVE') {
      return <span className="badge badge-orange">Actif</span>
    } else {
      return <span className="badge badge-danger">Brouillon</span>
    }
  }

  const filteredEvents = events.filter(event => {
    const now = new Date()
    const eventEnd = new Date(event.dateFin)
    
    switch (filter) {
      case 'active':
        return event.statut === 'ACTIVE' && now < eventEnd
      case 'past':
        return now > eventEnd
      case 'draft':
        return event.statut === 'DRAFT'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Mes événements</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes événements</h1>
          <p className="text-gray-600">Gérez tous vos événements depuis cette page</p>
        </div>
        
        <Link
          href="/promoteur/events/create-event"
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvel événement
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tous', count: events.length },
            { key: 'active', label: 'Actifs', count: events.filter(e => e.statut === 'ACTIVE' && new Date() < new Date(e.dateFin)).length },
            { key: 'past', label: 'Terminés', count: events.filter(e => new Date() > new Date(e.dateFin)).length },
            { key: 'draft', label: 'Brouillons', count: events.filter(e => e.statut === 'DRAFT').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === tab.key
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Liste des événements */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header de la carte */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">{event.titre}</h3>
                  {getStatusBadge(event)}
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.dateDebut)}
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.lieu}
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Billets vendus</div>
                    <div className="font-semibold text-gray-900">
                      {event.ticketsVendus || 0}/{event.nbPlaces}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: `${((event.ticketsVendus || 0) / event.nbPlaces) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-500">Revenus</div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(event.revenue || 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(event.prix)} par billet
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  <Link
                    href={`/promoteur/events/${event.id}`}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-center py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                  >
                    Gérer
                  </Link>
                  
                  <Link
                    href={`/promoteur/events/${event.id}/analytics`}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-center py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                  >
                    Stats
                  </Link>
                  
                  <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'Aucun événement' : `Aucun événement ${
              filter === 'active' ? 'actif' : 
              filter === 'past' ? 'terminé' : 'en brouillon'
            }`}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Créez votre premier événement pour commencer à vendre des billets'
              : 'Aucun événement ne correspond à ce filtre pour le moment'
            }
          </p>
          
          {filter === 'all' && (
            <Link
              href="/promoteur/events/create-event"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer mon premier événement
            </Link>
          )}
        </div>
      )}

      {/* Statistiques globales */}
      {events.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé de vos événements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {events.length}
              </div>
              <div className="text-sm text-gray-600">Total événements</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {events.reduce((sum, event) => sum + (event.ticketsVendus || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Billets vendus</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(events.reduce((sum, event) => sum + (event.revenue || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Revenus totaux</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {events.length > 0 ? Math.round(
                  (events.reduce((sum, event) => sum + (event.ticketsVendus || 0), 0) / 
                   events.reduce((sum, event) => sum + event.nbPlaces, 0)) * 100
                ) : 0}%
              </div>
              <div className="text-sm text-gray-600">Taux de remplissage</div>
            </div>
          </div>
        </div>
      )}

      {/* Conseils et aide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-500 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-blue-900 mb-2">💡 Conseils pour optimiser vos événements</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Publiez vos événements au moins 2 semaines à l'avance</li>
              <li>• Ajoutez des photos attractives pour augmenter les ventes</li>
              <li>• Partagez sur les réseaux sociaux pour plus de visibilité</li>
              <li>• Surveillez régulièrement vos statistiques de vente</li>
            </ul>
            <div className="mt-4">
              <Link
                href="/help/event-optimization"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}