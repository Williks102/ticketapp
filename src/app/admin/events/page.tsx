'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Event {
  id: string
  titre: string
  lieu: string
  dateDebut: Date
  prix: number
  nbPlaces: number
  placesRestantes: number
  statut: 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE'
  organisateur: string
  ticketsVendus: number
  revenue: number
}

// Données d'exemple
const eventsExemple: Event[] = [
  {
    id: '1',
    titre: 'Concert de Jazz Exceptionnel',
    lieu: 'Salle de spectacle Le Trianon',
    dateDebut: new Date('2024-12-15T20:00:00'),
    prix: 35.00,
    nbPlaces: 300,
    placesRestantes: 144,
    statut: 'ACTIVE',
    organisateur: 'Jazz & Co',
    ticketsVendus: 156,
    revenue: 5460.00
  },
  {
    id: '2',
    titre: 'Théâtre: Roméo et Juliette',
    lieu: 'Théâtre Municipal',
    dateDebut: new Date('2024-12-20T19:30:00'),
    prix: 28.00,
    nbPlaces: 200,
    placesRestantes: 111,
    statut: 'ACTIVE',
    organisateur: 'Troupe Théâtrale',
    ticketsVendus: 89,
    revenue: 2492.00
  },
  {
    id: '3',
    titre: 'Festival Rock 2024',
    lieu: 'Parc des Expositions',
    dateDebut: new Date('2024-12-25T18:00:00'),
    prix: 45.00,
    nbPlaces: 500,
    placesRestantes: 266,
    statut: 'ACTIVE',
    organisateur: 'Rock Events',
    ticketsVendus: 234,
    revenue: 10530.00
  },
  {
    id: '4',
    titre: 'Exposition Art Moderne',
    lieu: 'Musée des Beaux-Arts',
    dateDebut: new Date('2024-11-10T14:00:00'),
    prix: 12.00,
    nbPlaces: 100,
    placesRestantes: 0,
    statut: 'COMPLET',
    organisateur: 'Musée Municipal',
    ticketsVendus: 100,
    revenue: 1200.00
  },
  {
    id: '5',
    titre: 'Concert Annulé',
    lieu: 'Zénith Arena',
    dateDebut: new Date('2024-11-25T21:00:00'),
    prix: 55.00,
    nbPlaces: 400,
    placesRestantes: 400,
    statut: 'ANNULE',
    organisateur: 'Live Music Co',
    ticketsVendus: 0,
    revenue: 0
  }
]

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setEvents(eventsExemple)
      setFilteredEvents(eventsExemple)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = [...events]

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organisateur.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.statut === statusFilter)
    }

    // Trier
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime())
        break
      case 'title':
        filtered.sort((a, b) => a.titre.localeCompare(b.titre))
        break
      case 'revenue':
        filtered.sort((a, b) => b.revenue - a.revenue)
        break
      case 'tickets':
        filtered.sort((a, b) => b.ticketsVendus - a.ticketsVendus)
        break
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, statusFilter, sortBy])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIVE':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Actif</span>
      case 'INACTIVE':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Inactif</span>
      case 'COMPLET':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Complet</span>
      case 'ANNULE':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Annulé</span>
      default:
        return null
    }
  }

  const handleDelete = (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      setEvents(events.filter(e => e.id !== eventId))
    }
  }

  const toggleStatus = (eventId: string) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const newStatus = event.statut === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        return { ...event, statut: newStatus }
      }
      return event
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des événements</h1>
          <p className="text-gray-600">{events.length} événement{events.length > 1 ? 's' : ''} au total</p>
        </div>
        
        <Link href="/admin/events/new" className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvel événement
        </Link>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              placeholder="Titre, lieu, organisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
              <option value="COMPLET">Complet</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="date">Date</option>
              <option value="title">Titre</option>
              <option value="revenue">Revenus</option>
              <option value="tickets">Billets vendus</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="btn-secondary w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Liste des événements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{event.titre}</div>
                      <div className="text-sm text-gray-500">{event.lieu}</div>
                      <div className="text-xs text-gray-400">Par {event.organisateur}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(event.dateDebut)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {event.ticketsVendus} / {event.nbPlaces}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.placesRestantes} restantes
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatPrice(event.revenue)}</div>
                    <div className="text-xs text-gray-500">{formatPrice(event.prix)} / billet</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(event.statut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      
                      <button
                        onClick={() => toggleStatus(event.id)}
                        className={event.statut === 'ACTIVE' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {event.statut === 'ACTIVE' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement trouvé</h3>
            <p className="text-gray-500 mb-4">Essayez de modifier vos critères de recherche</p>
            <Link href="/admin/events/new" className="btn-primary">
              Créer le premier événement
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}