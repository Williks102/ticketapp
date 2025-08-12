'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Ticket {
  id: string
  numeroTicket: string
  eventTitle: string
  eventDate: Date
  eventLocation: string
  prix: number
  statut: 'VALID' | 'USED' | 'CANCELLED'
  qrCode: string
}

interface UserStats {
  totalTickets: number
  upcomingEvents: number
  totalSpent: number
  favoriteCategory: string
}

// Données d'exemple
const ticketsExemple: Ticket[] = [
  {
    id: '1',
    numeroTicket: 'TKT-2024-001234',
    eventTitle: 'Concert de Jazz Exceptionnel',
    eventDate: new Date('2024-12-15T20:00:00'),
    eventLocation: 'Salle de spectacle Le Trianon',
    prix: 35.00,
    statut: 'VALID',
    qrCode: 'QR123456789'
  },
  {
    id: '2',
    numeroTicket: 'TKT-2024-001235',
    eventTitle: 'Théâtre: Roméo et Juliette',
    eventDate: new Date('2024-12-20T19:30:00'),
    eventLocation: 'Théâtre Municipal',
    prix: 28.00,
    statut: 'VALID',
    qrCode: 'QR987654321'
  },
  {
    id: '3',
    numeroTicket: 'TKT-2024-001156',
    eventTitle: 'Festival Rock 2024',
    eventDate: new Date('2024-11-10T18:00:00'),
    eventLocation: 'Parc des Expositions',
    prix: 45.00,
    statut: 'USED',
    qrCode: 'QR456789123'
  }
]

const statsExemple: UserStats = {
  totalTickets: 12,
  upcomingEvents: 2,
  totalSpent: 385.50,
  favoriteCategory: 'Concerts'
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setTickets(ticketsExemple)
      setStats(statsExemple)
      setIsLoading(false)
    }, 1000)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getFilteredTickets = () => {
    const now = new Date()
    switch (activeTab) {
      case 'upcoming':
        return tickets.filter(ticket => ticket.eventDate > now && ticket.statut === 'VALID')
      case 'past':
        return tickets.filter(ticket => ticket.eventDate < now || ticket.statut === 'USED')
      case 'all':
      default:
        return tickets
    }
  }

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'VALID':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Valide</span>
      case 'USED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Utilisé</span>
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Annulé</span>
      default:
        return null
    }
  }

  const downloadTicket = (ticket: Ticket) => {
    // Simuler le téléchargement PDF
    alert(`Téléchargement du billet ${ticket.numeroTicket}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mon espace</h1>
        <p className="text-gray-600">Gérez vos billets et consultez vos statistiques</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">{stats.totalTickets}</div>
            <div className="text-gray-600">Billets achetés</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.upcomingEvents}</div>
            <div className="text-gray-600">Événements à venir</div>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{formatPrice(stats.totalSpent)}</div>
            <div className="text-gray-600">Total dépensé</div>
          </div>
          
          <div className="card text-center">
            <div className="text-lg font-bold text-purple-600 mb-2">{stats.favoriteCategory}</div>
            <div className="text-gray-600">Catégorie préférée</div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              À venir ({tickets.filter(t => t.eventDate > new Date() && t.statut === 'VALID').length})
            </button>
            
            <button
              onClick={() => setActiveTab('past')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Passés ({tickets.filter(t => t.eventDate < new Date() || t.statut === 'USED').length})
            </button>
            
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous ({tickets.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Liste des billets */}
      <div className="space-y-4">
        {getFilteredTickets().length > 0 ? (
          getFilteredTickets().map(ticket => (
            <div key={ticket.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{ticket.eventTitle}</h3>
                    {getStatusBadge(ticket.statut)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(ticket.eventDate)}
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ticket.eventLocation}
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      N° {ticket.numeroTicket}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary-600">{formatPrice(ticket.prix)}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {ticket.statut === 'VALID' && (
                      <>
                        <button
                          onClick={() => downloadTicket(ticket)}
                          className="btn-secondary"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </button>
                        
                        <Link href={`/ticket/${ticket.id}`} className="btn-primary">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                          </svg>
                          QR Code
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              Aucun billet trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'upcoming' && 'Vous n\'avez pas d\'événements à venir.'}
              {activeTab === 'past' && 'Vous n\'avez pas d\'événements passés.'}
              {activeTab === 'all' && 'Vous n\'avez pas encore acheté de billets.'}
            </p>
            <Link href="/evenements" className="btn-primary">
              Découvrir les événements
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}