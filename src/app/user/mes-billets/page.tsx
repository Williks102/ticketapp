// src/app/user/mes-billets/page.tsx - CORRECTION COMPLÈTE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Ticket {
  id: string
  numeroTicket: string
  statut: 'VALID' | 'USED' | 'CANCELLED' | 'EXPIRED'
  prix: number
  createdAt: string
  validatedAt?: string
  event: {
    id: string
    titre: string
    lieu: string
    dateDebut: string
    dateFin: string
    organisateur: string
    image?: string
  }
  canShowQR: boolean
  canDownload: boolean
  isExpired: boolean
  daysUntilEvent?: number
}

interface TicketsResponse {
  tickets: Ticket[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  summary: {
    totalTickets: number
    validTickets: number
    usedTickets: number
    upcomingEvents: number
  }
}

export default function MesBilletsPage() {
  // ✅ CORRECTION 1: Initialiser avec un tableau vide
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  })

  const router = useRouter()

  // ✅ CORRECTION 2: Fonction token unifiée
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  // Charger les billets
  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?redirect=/user/mes-billets')
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: activeTab === 'all' ? '' : activeTab
      })

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      console.log('🔄 Chargement des billets avec params:', params.toString())

      const response = await fetch(`/api/user/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login?redirect=/user/mes-billets')
          return
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data: TicketsResponse = await response.json()
      console.log('✅ Billets reçus:', data)

      // ✅ CORRECTION 3: Vérifier que data.tickets existe
      setTickets(data.tickets || [])
      setPagination({
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0
      })

    } catch (err) {
      console.error('❌ Erreur chargement billets:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
      // ✅ CORRECTION 4: En cas d'erreur, garder un tableau vide
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  // Charger les billets au montage et quand les filtres changent
  useEffect(() => {
    fetchTickets(1)
  }, [activeTab, searchTerm])

  // ✅ CORRECTION 5: Fonction de filtrage sécurisée
  const getFilteredTickets = (): Ticket[] => {
    // Toujours retourner un tableau, même si tickets est undefined
    if (!Array.isArray(tickets)) {
      console.warn('⚠️ tickets n\'est pas un tableau:', tickets)
      return []
    }

    return tickets.filter(ticket => {
      // Vérifier que ticket et ticket.event existent
      if (!ticket || !ticket.event) {
        console.warn('⚠️ Billet invalide:', ticket)
        return false
      }

      const eventDate = new Date(ticket.event.dateDebut)
      const now = new Date()

      switch (activeTab) {
        case 'upcoming':
          return eventDate > now && ticket.statut === 'VALID'
        case 'past':
          return eventDate <= now || ticket.statut === 'USED'
        case 'all':
        default:
          return true
      }
    })
  }

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (statut: string) => {
    const styles = {
      VALID: 'bg-green-100 text-green-800',
      USED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      VALID: 'Valide',
      USED: 'Utilisé',
      CANCELLED: 'Annulé',
      EXPIRED: 'Expiré'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles] || styles.EXPIRED}`}>
        {labels[statut as keyof typeof labels] || statut}
      </span>
    )
  }

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    if (price === 0) {
      return 'GRATUIT'
    }
    return `${(price / 100).toLocaleString('fr-FR')} FCFA`
  }

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ✅ CORRECTION 6: Filtrage sécurisé pour les compteurs
  const safeTickets = Array.isArray(tickets) ? tickets : []
  const filteredTickets = getFilteredTickets()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes billets</h1>
          <p className="text-gray-600">
            Gérez et consultez tous vos billets d'événements
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Onglets de filtrage */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              À venir ({safeTickets.filter(t => t?.event && new Date(t.event.dateDebut) > new Date() && t.statut === 'VALID').length})
            </button>
            
            <button
              onClick={() => setActiveTab('past')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'past'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Passés ({safeTickets.filter(t => t?.event && (new Date(t.event.dateDebut) <= new Date() || t.statut === 'USED')).length})
            </button>
            
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous ({safeTickets.length})
            </button>
          </nav>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => fetchTickets(1)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Liste des billets */}
        <div className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {ticket.event?.titre || 'Événement inconnu'}
                      </h3>
                      {getStatusBadge(ticket.statut)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {ticket.event?.dateDebut ? formatDate(ticket.event.dateDebut) : 'Date inconnue'}
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ticket.event?.lieu || 'Lieu inconnu'}
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {ticket.event?.organisateur || 'Organisateur inconnu'}
                      </div>

                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        {formatPrice(ticket.prix)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                    {ticket.canShowQR && (
                      <Link
                        href={`/user/mes-billets/${ticket.id}/qr`}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-center hover:bg-orange-700 transition-colors text-sm"
                      >
                        Voir le QR Code
                      </Link>
                    )}
                    
                    {ticket.canDownload && (
                      <Link
                        href={`/user/mes-billets/${ticket.id}/pdf`}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg text-center hover:bg-gray-700 transition-colors text-sm"
                      >
                        Télécharger PDF
                      </Link>
                    )}

                    <Link
                      href={`/evenements/${ticket.event?.id}`}
                      className="bg-white text-gray-700 px-4 py-2 rounded-lg text-center border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Voir l'événement
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'upcoming' ? 'Aucun événement à venir' :
                 activeTab === 'past' ? 'Aucun événement passé' :
                 'Aucun billet trouvé'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Aucun billet ne correspond à votre recherche.' : 
                 activeTab === 'upcoming' ? 'Vous n\'avez pas encore de billets pour des événements à venir.' :
                 'Vous n\'avez pas encore de billets.'}
              </p>
              <Link
                href="/evenements"
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Découvrir les événements
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => fetchTickets(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              
              <button
                onClick={() => fetchTickets(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}