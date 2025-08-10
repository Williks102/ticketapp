'use client'

import { useState, useEffect } from 'react'
import { EventCard } from '@/components/EventCard'
import { SearchBar } from '@/components/SearchBar'

// Données d'exemple - à remplacer par des données de la base
const eventsExemple = [
  {
    id: '1',
    titre: 'Concert de Jazz',
    description: 'Une soirée exceptionnelle avec les meilleurs musiciens de jazz de la région',
    lieu: 'Salle de spectacle Le Trianon',
    dateDebut: new Date('2024-12-15T20:00:00'),
    prix: 35.00,
    placesRestantes: 150,
    image: '/images/concert-jazz.jpg'
  },
  {
    id: '2',
    titre: 'Théâtre: Roméo et Juliette',
    description: 'La célèbre pièce de Shakespeare interprétée par la troupe locale',
    lieu: 'Théâtre Municipal',
    dateDebut: new Date('2024-12-20T19:30:00'),
    prix: 28.00,
    placesRestantes: 75,
    image: '/images/theatre.jpg'
  },
  {
    id: '3',
    titre: 'Festival Gastronomique',
    description: 'Découvrez les saveurs locales avec nos chefs renommés',
    lieu: 'Parc des Expositions',
    dateDebut: new Date('2024-12-22T12:00:00'),
    prix: 15.00,
    placesRestantes: 300,
    image: '/images/festival-gastro.jpg'
  },
  {
    id: '4',
    titre: 'Concert Rock',
    description: 'Soirée rock endiablée avec des groupes locaux et internationaux',
    lieu: 'Zenith Arena',
    dateDebut: new Date('2024-12-25T21:00:00'),
    prix: 45.00,
    placesRestantes: 25,
    image: '/images/concert-rock.jpg'
  },
  {
    id: '5',
    titre: 'Exposition d\'Art Moderne',
    description: 'Découvrez les œuvres des artistes contemporains de la région',
    lieu: 'Musée des Beaux-Arts',
    dateDebut: new Date('2024-12-28T14:00:00'),
    prix: 12.00,
    placesRestantes: 200,
    image: '/images/expo-art.jpg'
  },
  {
    id: '6',
    titre: 'Spectacle de Danse',
    description: 'Ballet classique et danse contemporaine par la compagnie nationale',
    lieu: 'Opéra de la Ville',
    dateDebut: new Date('2024-12-30T19:00:00'),
    prix: 42.00,
    placesRestantes: 80,
    image: '/images/danse.jpg'
  }
]

const categories = [
  { id: 'tous', label: 'Tous les événements' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'theatre', label: 'Théâtre' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'expositions', label: 'Expositions' },
  { id: 'spectacles', label: 'Spectacles' }
]

const sortOptions = [
  { id: 'date', label: 'Date' },
  { id: 'prix-asc', label: 'Prix croissant' },
  { id: 'prix-desc', label: 'Prix décroissant' },
  { id: 'popularite', label: 'Popularité' }
]

export default function EvenementsPage() {
  const [events, setEvents] = useState(eventsExemple)
  const [filteredEvents, setFilteredEvents] = useState(eventsExemple)
  const [selectedCategory, setSelectedCategory] = useState('tous')
  const [sortBy, setSortBy] = useState('date')
  const [priceRange, setPriceRange] = useState([0, 100])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let filtered = [...events]

    // Filtrer par catégorie (simplifié pour l'exemple)
    if (selectedCategory !== 'tous') {
      filtered = filtered.filter(event => {
        // Logique de filtrage par catégorie à implémenter
        return true
      })
    }

    // Filtrer par prix
    filtered = filtered.filter(event => 
      event.prix >= priceRange[0] && event.prix <= priceRange[1]
    )

    // Trier
    switch (sortBy) {
      case 'prix-asc':
        filtered.sort((a, b) => a.prix - b.prix)
        break
      case 'prix-desc':
        filtered.sort((a, b) => b.prix - a.prix)
        break
      case 'date':
        filtered.sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime())
        break
      default:
        break
    }

    setFilteredEvents(filtered)
  }, [events, selectedCategory, sortBy, priceRange])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Tous les événements
        </h1>
        <SearchBar />
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filtres */}
        <div className="lg:w-64">
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary w-full"
            >
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>
          </div>
          
          <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Catégories */}
            <div className="card">
              <h3 className="font-semibold mb-4">Catégories</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={selectedCategory === category.id}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    {category.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Fourchette de prix */}
            <div className="card">
              <h3 className="font-semibold mb-4">Prix</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="input-field w-20"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="input-field w-20"
                  />
                  <span>€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des événements */}
        <div className="flex-1">
          {/* Barre de tri */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
            </p>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-auto"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>
                  Trier par {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grille des événements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Message si aucun résultat */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33l-.147-.147m0 0L5 12l.879-.879m0 0c1.72-1.72 4.52-1.72 6.24 0M3 3l18 18" />
              </svg>
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                Aucun événement trouvé
              </h3>
              <p className="text-gray-500">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}