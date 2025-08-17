'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EventResponse, TicketResponse } from '@/types/api'

// Types pour les statistiques utilisateur
interface UserStats {
  totalEvents: number
  activeEvents: number
  totalTicketsSold: number
  totalRevenue: number
  thisMonthRevenue: number
  thisMonthTickets: number
}

// Données simulées pour le développement
const mockUserStats: UserStats = {
  totalEvents: 8,
  activeEvents: 3,
  totalTicketsSold: 142,
  totalRevenue: 6850.00,
  thisMonthRevenue: 1250.00,
  thisMonthTickets: 28
}

const mockRecentEvents: EventResponse[] = [
  {
    id: '1',
    titre: 'Concert Jazz en Plein Air',
    description: 'Soirée jazz exceptionnelle dans le parc municipal',
    lieu: 'Parc Municipal',
    adresse: '123 Rue du Parc, 75001 Paris',
    dateDebut: '2025-08-20T19:30:00Z',
    dateFin: '2025-08-20T23:00:00Z',
    prix: 45,
    nbPlaces: 100,
    placesRestantes: 15,
    statut: 'ACTIVE',
    organisateur: 'Marie Dubois',
    createdAt: '2025-07-15T10:00:00Z',
    updatedAt: '2025-07-15T10:00:00Z',
    ticketsVendus: 85,
    revenue: 3825
  },
  {
    id: '2',
    titre: 'Atelier Cuisine Locale',
    description: 'Découvrez les secrets de la cuisine traditionnelle',
    lieu: 'Studio Culinaire',
    adresse: '456 Avenue des Chefs, 75002 Paris',
    dateDebut: '2025-08-25T14:00:00Z',
    dateFin: '2025-08-25T17:00:00Z',
    prix: 75,
    nbPlaces: 20,
    placesRestantes: 8,
    statut: 'ACTIVE',
    organisateur: 'Marie Dubois',
    createdAt: '2025-07-10T14:30:00Z',
    updatedAt: '2025-07-10T14:30:00Z',
    ticketsVendus: 12,
    revenue: 900
  },
  {
    id: '3',
    titre: 'Exposition d\'Art Contemporain',
    description: 'Vernissage d\'une exposition unique d\'artistes locaux',
    lieu: 'Galerie d\'Art Moderne',
    adresse: '789 Rue de l\'Art, 75003 Paris',
    dateDebut: '2025-09-05T18:00:00Z',
    dateFin: '2025-09-05T22:00:00Z',
    prix: 25,
    nbPlaces: 150,
    placesRestantes: 89,
    statut: 'ACTIVE',
    organisateur: 'Marie Dubois',
    createdAt: '2025-07-20T09:15:00Z',
    updatedAt: '2025-07-20T09:15:00Z',
    ticketsVendus: 61,
    revenue: 1525
  }
]

const mockRecentTickets: TicketResponse[] = [
  {
  id: '1',
  numeroTicket: 'TK-001',
  qrCode: 'data:image/png;base64,mock',
  statut: 'VALID' as const,
  prix: 2500000,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z', // ✅ AJOUTER cette ligne
  event: {
    id: '1',
    titre: 'Concert Jazz Night',
    lieu: 'Sofitel Abidjan',
    dateDebut: '2024-02-20T20:00:00Z',
    dateFin: '2024-02-20T23:00:00Z'
  },
  user: {
    id: '1',
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie@email.com'
  }
}
]

export default function UserDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<EventResponse[]>([])
  const [recentTickets, setRecentTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Dans un vrai projet, remplacez par vos vraies API
        // const [statsRes, eventsRes, ticketsRes] = await Promise.all([
        //   fetch('/api/user/stats'),
        //   fetch('/api/user/events?limit=3'),
        //   fetch('/api/user/tickets/recent?limit=5')
        // ])
        
        // Simulation d'appels API
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setStats(mockUserStats)
        setRecentEvents(mockRecentEvents)
        setRecentTickets(mockRecentTickets)
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatFullDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getEventStatusBadge = (placesRestantes: number, nbPlaces: number) => {
    const percentage = (placesRestantes / nbPlaces) * 100
    
    if (percentage <= 10) {
      return <span className="badge badge-danger">Presque complet</span>
    } else if (percentage <= 30) {
      return <span className="badge badge-warning">Places limitées</span>
    } else {
      return <span className="badge badge-success">Disponible</span>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        </div>
        
        {/* Skeleton loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* En-tête avec actions rapides */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour Marie ! 👋</h1>
          <p className="text-gray-600">Voici un aperçu de vos événements et ventes</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link
            href="/promoteur/events/create-event"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un événement
          </Link>
          
          <Link
            href="promoteur/events"
            className="bg-white hover:bg-orange-50 text-orange-600 px-4 py-2 rounded-lg border border-orange-300 transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Gérer mes événements
          </Link>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Événements actifs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeEvents}</p>
              <p className="text-sm text-blue-600 mt-1">
                {stats.totalEvents} au total
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Billets vendus</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTicketsSold}</p>
              <p className="text-sm text-green-600 mt-1">
                +{stats.thisMonthTickets} ce mois
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Revenus totaux</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-orange-600 mt-1">
                +{formatCurrency(stats.thisMonthRevenue)} ce mois
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Taux de vente moyen</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalEvents > 0 ? Math.round((stats.totalTicketsSold / (stats.totalEvents * 50)) * 100) : 0}%
              </p>
              <p className="text-sm text-purple-600 mt-1">
                Performance globale
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mes événements récents */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Mes événements en cours</h2>
              <Link href="/dashboard/events" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Voir tout
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {recentEvents.length > 0 ? (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{event.titre}</h3>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatFullDate(event.dateDebut)}
                          </div>
                          
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.lieu}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        {getEventStatusBadge(event.placesRestantes, event.nbPlaces)}
                        <div className="mt-2 text-sm">
                          <div className="font-medium text-gray-900">
                            {event.ticketsVendus || 0}/{event.nbPlaces} billets
                          </div>
                          <div className="text-green-600 font-medium">
                            {formatCurrency(event.revenue || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          Gérer
                        </Link>
                        <Link
                          href={`/dashboard/events/${event.id}/analytics`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Statistiques
                        </Link>
                      </div>
                      
                      <div className="w-full max-w-32 bg-gray-200 rounded-full h-2 ml-4">
                        <div 
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${((event.ticketsVendus || 0) / event.nbPlaces) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement actif</h3>
                <p className="text-gray-600 mb-4">Créez votre premier événement pour commencer à vendre des billets</p>
                <Link href="/promoteur/events/create-event" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer un événement
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
              <Link href="/dashboard/tickets" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Voir tout
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        Nouveau billet vendu pour <span className="font-medium">{ticket.event.titre}</span>
                      </p>
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</p>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          +{formatCurrency(ticket.prix)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Messages d'encouragement */}
                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-orange-800">Conseil du jour</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Partagez vos événements sur les réseaux sociaux pour augmenter la visibilité !
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="text-gray-600">Aucune vente récente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides et outils */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/promoteur/events/create-event"
              className="flex flex-col items-center p-4 text-center hover:bg-orange-50 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 mt-2">Nouvel événement</span>
            </Link>
            
            <Link
              href="/dashboard/events"
              className="flex flex-col items-center p-4 text-center hover:bg-blue-50 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 mt-2">Gérer événements</span>
            </Link>
            
            <Link
              href="/dashboard/sales"
              className="flex flex-col items-center p-4 text-center hover:bg-green-50 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 mt-2">Voir les ventes</span>
            </Link>
            
            <Link
              href="/dashboard/profile"
              className="flex flex-col items-center p-4 text-center hover:bg-purple-50 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 mt-2">Mon profil</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Messages d'aide et support */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-orange-900 mb-2">Besoin d'aide pour démarrer ?</h3>
              <p className="text-orange-800 mb-4">
                Découvrez nos guides et astuces pour créer des événements à succès et maximiser vos ventes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/help/getting-started"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Guide de démarrage
                </Link>
                <Link
                  href="/help/best-practices"
                  className="bg-white hover:bg-orange-50 text-orange-600 px-4 py-2 rounded-lg border border-orange-300 transition-colors text-sm font-medium"
                >
                  Meilleures pratiques
                </Link>
                <Link
                  href="/support"
                  className="bg-white hover:bg-orange-50 text-orange-600 px-4 py-2 rounded-lg border border-orange-300 transition-colors text-sm font-medium"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}