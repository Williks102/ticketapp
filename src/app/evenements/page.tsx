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

  // ✅ CORRECTION - Fonction unifiée pour récupérer le token
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
        setEvents(data.data)
        setFilteredEvents(data.data)
      } else {
        throw new Error(data.message || 'Erreur lors du chargement')
      }

    } catch (err) {
      console.error('Erreur chargement événements:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // Filtrer et trier les événements
  useEffect(() => {
    let filtered = [...events]

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.lieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrage par catégorie
    if (filterCategory) {
      filtered = filtered.filter(event => 
        event.categories?.includes(filterCategory)
      )
    }

    // Filtrage par prix
    if (filterPrice) {
      if (filterPrice === 'free') {
        filtered = filtered.filter(event => event.prix === 0)
      } else if (filterPrice === 'paid') {
        filtered = filtered.filter(event => event.prix > 0)
      }
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.prix - b.prix
        case 'price-desc':
          return b.prix - a.prix
        case 'popularity':
          return (b.ticketsVendus || 0) - (a.ticketsVendus || 0)
        case 'date':
        default:
          return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
      }
    })

    setFilteredEvents(filtered)
  }, [events, searchTerm, filterCategory, filterPrice, sortBy])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleReserveFree = async (eventId: string) => {
    try {
      const token = getAuthToken() // ✅ CORRECTION
      
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
      const token = getAuthToken() // ✅ CORRECTION
      
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
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formater le prix
  const formatPrice = (price: number) => {
    if (price === 0) {
      return 'Gratuit'
    }
    return `${(price / 100).toLocaleString()} FCFA`
  }

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent)
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)

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
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-gray-200 h-96 rounded-lg"></div>
                ))}
              </div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Événements</h1>
            <p className="text-gray-600">
              Découvrez tous nos événements disponibles à la réservation
            </p>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Recherche */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <input
                  type="text"
                  placeholder="Nom, lieu, organisateur..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Filtre catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Toutes catégories</option>
                  <option value="concert">Concert</option>
                  <option value="theatre">Théâtre</option>
                  <option value="festival">Festival</option>
                  <option value="sport">Sport</option>
                  <option value="conference">Conférence</option>
                  <option value="exposition">Exposition</option>
                  <option value="cinema">Cinéma</option>
                  <option value="danse">Danse</option>
                </select>
              </div>

              {/* Filtre prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix
                </label>
                <select
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Tous les prix</option>
                  <option value="free">Gratuit</option>
                  <option value="paid">Payant</option>
                </select>
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="date">Date</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="popularity">Popularité</option>
                </select>
              </div>
            </div>

            {/* Bouton reset */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('')
                  setFilterPrice('')
                  setSortBy('date')
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
            </p>
            {totalPages > 1 && (
              <p className="text-gray-600">
                Page {currentPage} sur {totalPages}
              </p>
            )}
          </div>

          {/* Grille d'événements */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-red-800 mb-2">Erreur de chargement</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchEvents}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : currentEvents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement trouvé</h3>
              <p className="text-gray-500 mb-4">
                {events.length === 0 
                  ? "Aucun événement n'est disponible pour le moment"
                  : "Modifiez vos critères de recherche ou consultez tous les événements"
                }
              </p>
              {events.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterCategory('')
                    setFilterPrice('')
                    setSortBy('date')
                    setCurrentPage(1)
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Voir tous les événements
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image de l'événement */}
                    <div className="h-48 bg-gradient-to-r from-orange-400 to-orange-600 relative">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.titre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge prix */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          event.prix === 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-white text-gray-900'
                        }`}>
                          {formatPrice(event.prix)}
                        </span>
                      </div>

                      {/* Badge statut */}
                      {event.placesRestantes === 0 && (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                            Complet
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-6">
                      {/* Catégories */}
                      {event.categories && event.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {event.categories.slice(0, 2).map((category, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              {category}
                            </span>
                          ))}
                          {event.categories.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{event.categories.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Titre */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {event.titre}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Informations */}
                      <div className="space-y-2 mb-4">
                        {/* Date */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(event.dateDebut)}
                        </div>

                        {/* Lieu */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.lieu}
                        </div>

                        {/* Organisateur */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {event.organisateur}
                        </div>

                        {/* Places restantes */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {event.placesRestantes} place{event.placesRestantes > 1 ? 's' : ''} restante{event.placesRestantes > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex space-x-2">
                        {event.placesRestantes === 0 ? (
                          <button 
                            disabled
                            className="flex-1 bg-gray-100 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
                          >
                            Complet
                          </button>
                        ) : (
                          <>
                            {event.prix === 0 ? (
                              <button
                                onClick={() => handleReserveFree(event.id)}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                              >
                                Réserver gratuitement
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePurchasePaid(event.id)}
                                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                              >
                                Acheter - {formatPrice(event.prix)}
                              </button>
                            )}
                          </>
                        )}

                        {/* Bouton détails */}
                        <button
                          onClick={() => router.push(`/evenements/${event.id}`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-2 border rounded-lg ${
                            currentPage === pageNumber
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}