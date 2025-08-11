'use client'

import { useState, useEffect } from 'react'
import { EventCard } from '@/components/EventCard'
import { SearchBar } from '@/components/SearchBar'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { EventResponse } from '@/types/api'

const categories = [
  { id: 'tous', label: 'Tous les événements' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'theatre', label: 'Théâtre' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'expositions', label: 'Expositions' },
  { id: 'spectacles', label: 'Spectacles' },
  { id: 'gastronomie', label: 'Gastronomie' },
  { id: 'art', label: 'Art & Culture' }
]

const sortOptions = [
  { id: 'date', label: 'Date' },
  { id: 'prix-asc', label: 'Prix croissant' },
  { id: 'prix-desc', label: 'Prix décroissant' },
  { id: 'popularite', label: 'Popularité' }
]

export default function EvenementsPage() {
  const [events, setEvents] = useState<EventResponse[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('tous')
  const [sortBy, setSortBy] = useState('date')
  const [priceRange, setPriceRange] = useState([0, 10000000]) // Prix en centimes FCFA (0 à 100.000 FCFA)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Charger les événements depuis la BDD
  useEffect(() => {
    fetchEvents()
  }, [currentPage, searchTerm, selectedCategory, sortBy])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: sortBy === 'date' ? 'dateDebut' : sortBy.includes('prix') ? 'prix' : 'dateDebut',
        sortOrder: sortBy === 'prix-desc' ? 'desc' : 'asc',
        status: 'ACTIVE'
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (selectedCategory !== 'tous') {
        // Filtrer par catégorie côté client pour l'instant
        // En production, vous pourriez vouloir ajouter ce filtre côté serveur
      }

      const response = await fetch(`/api/events?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des événements')
      }

      const data = await response.json()
      setEvents(data.events || [])
      setTotalPages(data.totalPages || 1)

    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrer et trier les événements côté client
  useEffect(() => {
    let filtered = [...events]

    // Filtrer par catégorie
    if (selectedCategory !== 'tous') {
      filtered = filtered.filter(event => {
        // Vérifier si l'événement contient la catégorie sélectionnée
        // Les catégories sont stockées dans un array String[] dans Prisma
        return event.categories?.some(cat => 
          cat.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      })
    }

    // Filtrer par prix
    filtered = filtered.filter(event => 
      event.prix >= priceRange[0] && event.prix <= priceRange[1]
    )

    setFilteredEvents(filtered)
  }, [events, selectedCategory, priceRange])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset à la première page
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchEvents()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar />
      
      {/* Contenu principal */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Tous les événements
            </h1>
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Filtres et tri */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar filtres */}
            <div className="lg:w-64">
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span>{showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}</span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Catégories */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Catégories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-orange-100 text-orange-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tri */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Trier par</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre prix */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Prix</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{(priceRange[0] / 100).toLocaleString('fr-FR')} FCFA</span>
                      <span>{(priceRange[1] / 100).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="50000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des événements */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                      <div className="space-y-3">
                        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                        <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEvents.length > 0 ? (
                <>
                  {/* Résultats */}
                  <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-600">
                      {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Grille des événements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Précédent
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            currentPage === i + 1
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Suivant
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun événement trouvé</h3>
                  <p className="text-gray-600 mb-4">
                    Aucun événement ne correspond à vos critères de recherche.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('tous')
                      setPriceRange([0, 10000000])
                      setSearchTerm('')
                      setCurrentPage(1)
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}