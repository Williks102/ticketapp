// src/app/evenements/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventCard } from '@/components/EventCard'
import EventFilters, { EventFilters as FilterType } from '@/components/EventFilters'
import { SearchBar } from '@/components/SearchBar'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { EventResponse } from '@/types/api'
import { formatEventPrice } from '@/lib/api-utils'

interface EventCounts {
  total: number
  free: number
  paid: number
}

export default function EvenementsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventResponse[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [eventCounts, setEventCounts] = useState<EventCounts>({ total: 0, free: 0, paid: 0 })
  
  const [filters, setFilters] = useState<FilterType>({
    category: 'tous',
    priceType: 'all',
    priceRange: [0, 10000000],
    location: 'Toutes les villes',
    dateRange: 'all',
    sortBy: 'date'
  })

  // Charger les événements depuis l'API
  useEffect(() => {
    fetchEvents()
  }, [currentPage, searchTerm])

  // Appliquer les filtres côté client
  useEffect(() => {
    applyFilters()
  }, [events, filters])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: 'ACTIVE'
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/events?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des événements')
      }

      const data = await response.json()
      setEvents(data.events || [])
      setTotalPages(data.totalPages || 1)

      // Calculer les statistiques
      calculateEventCounts(data.events || [])

    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const calculateEventCounts = (allEvents: EventResponse[]) => {
    const counts = {
      total: allEvents.length,
      free: allEvents.filter(event => event.prix === 0).length,
      paid: allEvents.filter(event => event.prix > 0).length
    }
    setEventCounts(counts)
  }

  const applyFilters = () => {
    let filtered = [...events]

    // Filtre par type de prix
    if (filters.priceType === 'free') {
      filtered = filtered.filter(event => event.prix === 0)
    } else if (filters.priceType === 'paid') {
      filtered = filtered.filter(event => event.prix > 0)
    }

    // Filtre par plage de prix
    filtered = filtered.filter(event => 
      event.prix >= filters.priceRange[0] && event.prix <= filters.priceRange[1]
    )

    // Filtre par catégorie
    if (filters.category !== 'tous') {
      filtered = filtered.filter(event => 
        event.categories?.some(cat => 
          cat.toLowerCase().includes(filters.category.toLowerCase())
        )
      )
    }

    // Filtre par ville
    if (filters.location !== 'Toutes les villes') {
      filtered = filtered.filter(event => 
        event.lieu.toLowerCase().includes(filters.location.toLowerCase()) ||
        event.adresse.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Filtre par date
    const now = new Date()
    if (filters.dateRange === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.dateDebut)
        return eventDate >= today && eventDate < tomorrow
      })
    } else if (filters.dateRange === 'week') {
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.dateDebut)
        return eventDate >= now && eventDate <= weekFromNow
      })
    } else if (filters.dateRange === 'month') {
      const monthFromNow = new Date()
      monthFromNow.setMonth(monthFromNow.getMonth() + 1)
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.dateDebut)
        return eventDate >= now && eventDate <= monthFromNow
      })
    }

    // Tri
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.prix - b.prix
        case 'price_desc':
          return b.prix - a.prix
        case 'popularity':
          return (b.ticketsVendus || 0) - (a.ticketsVendus || 0)
        case 'date':
        default:
          return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
      }
    })

    setFilteredEvents(filtered)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleReserveFree = async (eventId: string) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      
      if (!token) {
        // Rediriger vers la page de connexion
        router.push(`/auth/login?redirect=/evenements/${eventId}`)
        return
      }

      const response = await fetch('/api/billets/gratuit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la réservation')
      }

      const ticket = await response.json()
      
      // Afficher un message de succès
      alert('🎉 Billet gratuit réservé avec succès!')
      
      // Rediriger vers les billets de l'utilisateur
      router.push('/user/mes-billets')

    } catch (error) {
      console.error('Erreur réservation gratuite:', error)
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handlePurchasePaid = async (eventId: string) => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      
      if (!token) {
        router.push(`/auth/login?redirect=/evenements/${eventId}`)
        return
      }

      // Rediriger vers la page de paiement
      router.push(`/evenements/${eventId}/achat`)

    } catch (error) {
      console.error('Erreur achat:', error)
      alert('Erreur lors de l\'achat')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
              <div className="bg-gray-200 h-32 rounded-lg mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-gray-200 h-96 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => fetchEvents()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Événements en Côte d'Ivoire
            </h1>
            <p className="text-gray-600">
              Découvrez les meilleurs événements, gratuits et payants, près de chez vous
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Rechercher un événement, lieu, organisateur..."
              className="w-full"
            />
          </div>

          {/* Filtres */}
          <EventFilters
            currentFilters={filters}
            onFilterChange={setFilters}
            eventCounts={eventCounts}
          />

          {/* Résultats */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
              </h2>
              
              {/* Indication des filtres actifs */}
              {filters.priceType !== 'all' && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filters.priceType === 'free' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {filters.priceType === 'free' ? '✨ Gratuits uniquement' : '💰 Payants uniquement'}
                </span>
              )}
            </div>
          </div>

          {/* Grille d'événements */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onReserve={handleReserveFree}
                  onPurchase={handlePurchasePaid}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v14c2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Essayez de modifier vos critères de recherche ou vos filtres.
                </p>
                <button
                  onClick={() => setFilters({
                    category: 'tous',
                    priceType: 'all',
                    priceRange: [0, 10000000],
                    location: 'Toutes les villes',
                    dateRange: 'all',
                    sortBy: 'date'
                  })}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}