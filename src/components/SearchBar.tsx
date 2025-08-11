// src/components/SearchBar.tsx
'use client'

import { useState } from 'react'

interface SearchBarProps {
  onSearch?: (searchTerm: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Rechercher un événement...",
  className = "" 
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      // Combiner le terme de recherche et la localisation
      const combinedSearch = [searchTerm, location].filter(Boolean).join(' ')
      onSearch(combinedSearch)
    }
  }

  const handleQuickSearch = () => {
    if (onSearch && searchTerm.trim()) {
      onSearch(searchTerm.trim())
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche principale */}
          <div className="flex-1">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleQuickSearch()
                  }
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    if (onSearch) onSearch('')
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="flex-1">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ville ou lieu..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Bouton de recherche */}
          <div className="flex-shrink-0">
            <button
              type="submit"
              className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden md:inline">Rechercher</span>
            </button>
          </div>
        </div>

        {/* Suggestions de recherche rapide */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 mr-2">Recherches populaires:</span>
          {[
            'Concert jazz',
            'Théâtre Paris', 
            'Festival gastronomie',
            'Exposition art',
            'Spectacle danse'
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setSearchTerm(suggestion)
                if (onSearch) onSearch(suggestion)
              }}
              className="text-sm bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 px-3 py-1 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}