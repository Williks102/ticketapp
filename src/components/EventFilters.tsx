// src/components/EventFilters.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'

interface EventFiltersProps {
  onFilterChange: (filters: EventFilters) => void
  currentFilters: EventFilters
  eventCounts?: {
    total: number
    free: number
    paid: number
  }
}

export interface EventFilters {
  category: string
  priceType: 'all' | 'free' | 'paid'
  priceRange: [number, number]
  location: string
  dateRange: 'all' | 'today' | 'week' | 'month'
  sortBy: 'date' | 'price_asc' | 'price_desc' | 'popularity'
}

const categories = [
  { id: 'tous', label: 'Toutes catégories' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'theatre', label: 'Théâtre' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'expositions', label: 'Expositions' },
  { id: 'spectacles', label: 'Spectacles' },
  { id: 'gastronomie', label: 'Gastronomie' },
  { id: 'sport', label: 'Sport' },
  { id: 'formation', label: 'Formation' }
]

const locations = [
  'Toutes les villes',
  'Abidjan',
  'Bouaké',
  'Daloa',
  'Yamoussoukro',
  'San-Pédro',
  'Korhogo',
  'Man'
]

export default function EventFilters({ onFilterChange, currentFilters, eventCounts }: EventFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [priceRangeLocal, setPriceRangeLocal] = useState(currentFilters.priceRange)

  const handleFilterUpdate = (key: keyof EventFilters, value: any) => {
    const newFilters = { ...currentFilters, [key]: value }
    onFilterChange(newFilters)
  }

  const handlePriceTypeChange = (priceType: 'all' | 'free' | 'paid') => {
    handleFilterUpdate('priceType', priceType)
    
    // Ajuster automatiquement la plage de prix
    if (priceType === 'free') {
      handleFilterUpdate('priceRange', [0, 0])
    } else if (priceType === 'paid') {
      handleFilterUpdate('priceRange', [100, 10000000]) // 1 FCFA à 100,000 FCFA
    } else {
      handleFilterUpdate('priceRange', [0, 10000000])
    }
  }

  const resetFilters = () => {
    const defaultFilters: EventFilters = {
      category: 'tous',
      priceType: 'all',
      priceRange: [0, 10000000],
      location: 'Toutes les villes',
      dateRange: 'all',
      sortBy: 'date'
    }
    onFilterChange(defaultFilters)
    setPriceRangeLocal([0, 10000000])
  }

  const formatPrice = (price: number) => {
    if (price === 0) return '0'
    return `${(price / 100).toLocaleString('fr-FR')} FCFA`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Filtres rapides */}
      <div className="space-y-4">
        {/* Type de prix - Boutons rapides */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type d'événement
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePriceTypeChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentFilters.priceType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous {eventCounts && `(${eventCounts.total})`}
            </button>
            <button
              onClick={() => handlePriceTypeChange('free')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentFilters.priceType === 'free'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              ✨ Gratuits {eventCounts && `(${eventCounts.free})`}
            </button>
            <button
              onClick={() => handlePriceTypeChange('paid')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentFilters.priceType === 'paid'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              💰 Payants {eventCounts && `(${eventCounts.paid})`}
            </button>
          </div>
        </div>

        {/* Catégorie et Tri - Une ligne */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={currentFilters.category}
              onChange={(e) => handleFilterUpdate('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trier par
            </label>
            <select
              value={currentFilters.sortBy}
              onChange={(e) => handleFilterUpdate('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="popularity">Popularité</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <select
              value={currentFilters.dateRange}
              onChange={(e) => handleFilterUpdate('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>

        {/* Filtres avancés */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtres avancés
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={resetFilters}
            className="flex items-center text-sm text-gray-600 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </button>
        </div>

        {/* Filtres avancés développés */}
        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ville */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <select
                  value={currentFilters.location}
                  onChange={(e) => handleFilterUpdate('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Plage de prix personnalisée (seulement si payant) */}
              {currentFilters.priceType !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plage de prix
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="10000000"
                        step="50000"
                        value={priceRangeLocal[0]}
                        onChange={(e) => {
                          const newRange: [number, number] = [Number(e.target.value), priceRangeLocal[1]]
                          setPriceRangeLocal(newRange)
                          handleFilterUpdate('priceRange', newRange)
                        }}
                        className="flex-1"
                      />
                      <input
                        type="range"
                        min="0"
                        max="10000000"
                        step="50000"
                        value={priceRangeLocal[1]}
                        onChange={(e) => {
                          const newRange: [number, number] = [priceRangeLocal[0], Number(e.target.value)]
                          setPriceRangeLocal(newRange)
                          handleFilterUpdate('priceRange', newRange)
                        }}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{formatPrice(priceRangeLocal[0])}</span>
                      <span>{formatPrice(priceRangeLocal[1])}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}