// src/app/evenements/page.tsx - VERSION COMPLÈTE CORRIGÉE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'

interface Event {
  id: string
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: string
  dateFin: string
  prix: number
  nbPlaces: number
  placesRestantes: number
  statut: string
  organisateur: string
  image?: string
  categories?: string[]
  ticketsVendus?: number
  isGratuit?: boolean
}

export default function EventsPage() {
  const router = useRouter()
  // ✅ CORRECTION 1: Initialiser avec des tableaux vides
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPrice, setFilterPrice] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 12

  // ✅ CORRECTION 2: Fonction token unifiée
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  // Charger les événements
  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/events')

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des événements')
      }

      const data = await response.json()

      if (data.success) {
        // ✅ CORRECTION 3: Vérifier que data.data existe et est un tableau
        const eventsData = Array.isArray(data.data) ? data.data : []
        setEvents(eventsData)
        setFilteredEvents(eventsData)
      } else {
        throw new Error(data.message || 'Erreur lors du chargement')
      }

    } catch (err) {
      console.error('Erreur chargement événements:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
      // ✅ CORRECTION 4: En cas d'erreur, garder des tableaux vides
      setEvents([])
      setFilteredEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // ✅ CORRECTION 5: Filtrage et tri sécurisés
  useEffect(() => {
    // Toujours s'assurer qu'on travaille avec un tableau
    const safeEvents = Array.isArray(events) ? events : []
    let filtered = [...safeEvents]

    // Filtrage par terme de recherche
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(event => {
        // Vérifier que les propriétés existent avant de les utiliser
        const titre = event?.titre || ''
        const lieu = event?.lieu || ''
        const organisateur = event?.organisateur || ''
        const description = event?.description || ''
        
        const searchLower = searchTerm.toLowerCase()
        
        return titre.toLowerCase().includes(searchLower) ||
               lieu.toLowerCase().includes(searchLower) ||
               organisateur.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower)
      })
    }

    // Filtrage par catégorie
    if (filterCategory && filterCategory.trim()) {
      filtered = filtered.filter(event => 
        Array.isArray(event?.categories) && event.categories.includes(filterCategory)
      )
    }

    // Filtrage par prix
    if (filterPrice) {
      if (filterPrice === 'free') {
        filtered = filtered.filter(event => (event?.prix || 0) === 0)
      } else if (filterPrice === 'paid') {
        filtered = filtered.filter(event => (event?.prix || 0) > 0)
      }
    }

    // Tri sécurisé
    filtered.sort((a, b) => {
      // Vérifier que les objets existent
      if (!a || !b) return 0
      
      switch (sortBy) {
        case 'price-asc':
          return (a.prix || 0) - (b.prix || 0)
        case 'price-desc':
          return (b.prix || 0) - (a.prix || 0)
        case 'popularity':
          return (b.ticketsVendus || 0) - (a.ticketsVendus || 0)
        case 'date':
        default:
          // Vérifier que les dates existent
          const dateA = a.dateDebut ? new Date(a.dateDebut).getTime() : 0
          const dateB = b.dateDebut ? new Date(b.dateDebut).getTime() : 0
          return dateA - dateB
      }
    })

    setFilteredEvents(filtered)
    setCurrentPage(1) // Reset à la première page quand on filtre
  }, [events, searchTerm, filterCategory, filterPrice, sortBy])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleReserveFree = async (eventId: string) => {
    try {
      const token = getAuthToken()
      
      if (!token) {
        // Rediriger vers la page de connexion
        router.push(`/auth/login?redirect=/evenements/${eventId}`)
        return
      }

      const response = await fetch('/api/tickets/free', {
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
      const token = getAuthToken()
      
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

  // Formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date inconnue'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Date invalide'
      
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  // Formater le prix
  const formatPrice = (price: number) => {
    if (!price || price === 0) {
      return 'Gratuit'
    }
    return `${(price / 100).toLocaleString('fr-FR')} FCFA`
  }

  // ✅ CORRECTION 6: Pagination sécurisée
  const safeFilteredEvents = Array.isArray(filteredEvents) ? filteredEvents : []
  const indexOfLastEvent = currentPage * eventsPerPage
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage
  const currentEvents = safeFilteredEvents.slice(indexOfFirstEvent, indexOfLastEvent)
  const totalPages = Math.ceil(safeFilteredEvents.length / eventsPerPage)

  // Obtenir toutes les catégories uniques pour le filtre
  const getAllCategories = () => {
    const safeEvents = Array.isArray(events) ? events : []
    const categories = new Set<string>()
    
    safeEvents.forEach(event => {
      if (Array.isArray(event?.categories)) {
        event.categories.forEach(cat => categories.add(cat))
      }
    })
    
    return Array.from(categories).sort()
  }

  // États de chargement et d'erreur
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
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                onClick={fetchEvents}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Découvrez nos événements
            </h1>
            <p className="text-gray-600">
              {safeFilteredEvents.length} événement{safeFilteredEvents.length > 1 ? 's' : ''} disponible{safeFilteredEvents.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filtre catégorie */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Toutes les catégories</option>
                  {getAllCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Filtre prix */}
              <div>
                <select
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Tous les prix</option>
                  <option value="free">Gratuit</option>
                  <option value="paid">Payant</option>
                </select>
              </div>
            </div>

            {/* Tri */}
            <div className="mt-4 flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Trier par :</span>
              <div className="flex space-x-2">
                {[
                  { value: 'date', label: 'Date' },
                  { value: 'price-asc', label: 'Prix croissant' },
                  { value: 'price-desc', label: 'Prix décroissant' },
                  { value: 'popularity', label: 'Popularité' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      sortBy === option.value
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Liste des événements */}
          {currentEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentEvents.map(event => (
                  <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image */}
                    <div className="h-48 bg-gray-200 relative">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.titre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge prix */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          (event.prix || 0) === 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {formatPrice(event.prix || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {event.titre || 'Titre non disponible'}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(event.dateDebut)}
                        </div>
                        
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.lieu || 'Lieu non spécifié'}
                        </div>
                        
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {(event.placesRestantes || 0)} place{(event.placesRestantes || 0) > 1 ? 's' : ''} restante{(event.placesRestantes || 0) > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Catégories */}
                      {Array.isArray(event.categories) && event.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {event.categories.slice(0, 3).map(category => (
                            <span key={category} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {category}
                            </span>
                          ))}
                          {event.categories.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{event.categories.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description || 'Aucune description disponible'}
                      </p>

                      {/* Actions */}
                      <div className="space-y-2">
                        {(event.prix || 0) === 0 ? (
                          <button
                            onClick={() => handleReserveFree(event.id)}
                            disabled={(event.placesRestantes || 0) <= 0}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {(event.placesRestantes || 0) > 0 ? 'Réserver gratuitement' : 'Complet'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchasePaid(event.id)}
                            disabled={(event.placesRestantes || 0) <= 0}
                            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {(event.placesRestantes || 0) > 0 ? `Acheter - ${formatPrice(event.prix || 0)}` : 'Complet'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/evenements/${event.id}`)}
                          className="w-full bg-white text-gray-700 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          Voir les détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {currentPage} sur {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement trouvé</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterCategory || filterPrice 
                  ? 'Aucun événement ne correspond à vos critères de recherche.'
                  : 'Aucun événement n\'est disponible pour le moment.'
                }
              </p>
              {(searchTerm || filterCategory || filterPrice) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterCategory('')
                    setFilterPrice('')
                  }}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}