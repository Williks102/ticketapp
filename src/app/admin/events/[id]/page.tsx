// src/app/admin/events/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useIsClient } from '@/hooks/useIsClient'
import { EventWithRelations, TicketResponse, ActivityLogResponse } from '@/types/api'

interface EventDetailProps {
  params: { id: string }
}

export default function AdminEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const isClient = useIsClient()
  const eventId = params?.id as string

  const [event, setEvent] = useState<EventWithRelations | null>(null)
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [activities, setActivities] = useState<ActivityLogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'stats' | 'activities'>('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Hook de chargement initial
  useEffect(() => {
    if (isClient && eventId) {
      fetchEventData()
    }
  }, [isClient, eventId])

  // Fonction pour récupérer le token d'authentification
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  // Fonction pour charger les données de l'événement
  const fetchEventData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?redirect=/admin/events')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      console.log(`🔄 Chargement de l'événement ${eventId}...`)

      // Appels API parallèles
      const [eventResponse, ticketsResponse, activitiesResponse] = await Promise.all([
        fetch(`/api/admin/events/${eventId}`, { headers }),
        fetch(`/api/admin/events/${eventId}/tickets`, { headers }),
        fetch(`/api/admin/events/${eventId}/activities?limit=20`, { headers })
      ])

      // Gestion des erreurs d'authentification
      if ([eventResponse, ticketsResponse, activitiesResponse].some(r => r.status === 401)) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        router.push('/auth/login?redirect=/admin/events')
        return
      }

      if (eventResponse.status === 404) {
        setError('Événement introuvable')
        return
      }

      if (!eventResponse.ok) {
        setError('Erreur lors du chargement de l\'événement')
        return
      }

      // Parse des réponses
      const eventData = await eventResponse.json()
      const ticketsData = ticketsResponse.ok ? await ticketsResponse.json() : { data: [] }
      const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : { data: [] }

      setEvent(eventData.data || eventData)
      setTickets(ticketsData.data || [])
      setActivities(activitiesData.data || [])

      console.log('✅ Données de l\'événement chargées:', {
        event: eventData.data?.titre,
        tickets: ticketsData.data?.length || 0,
        activities: activitiesData.data?.length || 0
      })

    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour supprimer l'événement
  const handleDeleteEvent = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        router.push('/admin/events')
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Fonction pour formater la devise
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Fonction pour formater les dates
  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr))
  }

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'COMPLET': 'bg-blue-100 text-blue-800',
      'ANNULE': 'bg-red-100 text-red-800',
      'TERMINE': 'bg-purple-100 text-purple-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  // Fonction pour obtenir le badge de statut des billets
  const getTicketStatusBadge = (status: string) => {
    const statusClasses = {
      'VALID': 'bg-green-100 text-green-800',
      'USED': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'EXPIRED': 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  // Affichage du loading
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'événement...</p>
        </div>
      </div>
    )
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/admin/events"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retour aux événements
          </Link>
        </div>
      </div>
    )
  }

  // Affichage si aucun événement
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Événement introuvable</h2>
          <p className="text-gray-600 mb-4">L'événement demandé n'existe pas ou a été supprimé.</p>
          <Link
            href="/admin/events"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retour aux événements
          </Link>
        </div>
      </div>
    )
  }

  // Calculs pour les statistiques
  const validTickets = tickets.filter(t => t.statut !== 'CANCELLED')
  const usedTickets = tickets.filter(t => t.statut === 'USED')
  const ticketsVendus = validTickets.length
  const revenue = validTickets.reduce((sum, ticket) => sum + (ticket.prix || 0), 0)
  const tauxRemplissage = event.nbPlaces > 0 ? Math.round((ticketsVendus / event.nbPlaces) * 100) : 0
  const tauxValidation = ticketsVendus > 0 ? Math.round((usedTickets.length / ticketsVendus) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/events"
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour aux événements
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">{event.titre}</h1>
              {getStatusBadge(event.statut)}
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/admin/events/${eventId}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
              { id: 'tickets', name: 'Billets', icon: '🎫', count: tickets.length },
              { id: 'stats', name: 'Statistiques', icon: '📈' },
              { id: 'activities', name: 'Activités', icon: '📝', count: activities.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onglet Vue d'ensemble */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cards de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Billets vendus</p>
                    <p className="text-2xl font-bold text-gray-900">{ticketsVendus}</p>
                    <p className="text-sm text-gray-500">sur {event.nbPlaces} places</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎫</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenus</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenue / 100)}</p>
                    <p className="text-sm text-gray-500">
                      {event.prix === 0 ? 'Événement gratuit' : `Prix: ${formatCurrency(event.prix / 100)}`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taux de remplissage</p>
                    <p className="text-2xl font-bold text-gray-900">{tauxRemplissage}%</p>
                    <p className="text-sm text-gray-500">{event.placesRestantes} places restantes</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taux de validation</p>
                    <p className="text-2xl font-bold text-gray-900">{tauxValidation}%</p>
                    <p className="text-sm text-gray-500">{usedTickets.length} billets utilisés</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations principales */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'événement</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{event.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                      <p className="text-gray-900">{event.lieu}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <p className="text-gray-900">{event.adresse}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                      <p className="text-gray-900">{formatDate(event.dateDebut)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                      <p className="text-gray-900">{formatDate(event.dateFin)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organisateur</label>
                    <p className="text-gray-900">{event.organisateur}</p>
                  </div>

                  {event.categories && event.categories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Catégories</label>
                      <div className="flex flex-wrap gap-2">
                        {event.categories.map((category, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image et informations complémentaires */}
              <div className="space-y-6">
                {event.image && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Image de l'événement</h3>
                    <div className="aspect-video relative rounded-lg overflow-hidden">
                      <Image
                        src={event.image}
                        alt={event.titre}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations techniques</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID de l'événement</span>
                      <span className="text-sm font-mono text-gray-900">{event.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Créé le</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Modifié le</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(event.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Billets */}
        {activeTab === 'tickets' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Billets de l'événement ({tickets.length})
              </h3>
            </div>
            
            {tickets.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 text-4xl mb-4">🎫</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun billet</h3>
                <p className="text-gray-500">Aucun billet n'a encore été vendu pour cet événement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acheteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d'achat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {ticket.numeroTicket}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ticket.user ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ticket.user.nom} {ticket.user.prenom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ticket.user.email}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ticket.guestNom} {ticket.guestPrenom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ticket.guestEmail}
                              </div>
                              <div className="text-xs text-orange-600">Invité</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency((ticket.prix || 0) / 100)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTicketStatusBadge(ticket.statut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(ticket.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/admin/tickets/${ticket.id}`}
                            className="text-orange-600 hover:text-orange-900 mr-3"
                          >
                            Voir
                          </Link>
                          {ticket.statut === 'VALID' && (
                            <button
                              onClick={() => {/* TODO: Fonction de validation */}}
                              className="text-green-600 hover:text-green-900"
                            >
                              Valider
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Onglet Statistiques */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques détaillées</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{ticketsVendus}</div>
                  <div className="text-sm text-gray-600">Billets vendus</div>
                  <div className="text-xs text-gray-500">sur {event.nbPlaces} places</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(revenue / 100)}
                  </div>
                  <div className="text-sm text-gray-600">Revenus totaux</div>
                  {ticketsVendus > 0 && (
                    <div className="text-xs text-gray-500">
                      Moyenne: {formatCurrency((revenue / ticketsVendus) / 100)}
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{tauxRemplissage}%</div>
                  <div className="text-sm text-gray-600">Taux de remplissage</div>
                  <div className="text-xs text-gray-500">{event.placesRestantes} restantes</div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progression des ventes</span>
                  <span>{ticketsVendus} / {event.nbPlaces}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${tauxRemplissage}%` }}
                  ></div>
                </div>
              </div>

              {/* Répartition par statut */}
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Répartition des billets par statut</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { status: 'VALID', label: 'Valides', count: tickets.filter(t => t.statut === 'VALID').length, color: 'green' },
                    { status: 'USED', label: 'Utilisés', count: tickets.filter(t => t.statut === 'USED').length, color: 'blue' },
                    { status: 'CANCELLED', label: 'Annulés', count: tickets.filter(t => t.statut === 'CANCELLED').length, color: 'red' },
                    { status: 'EXPIRED', label: 'Expirés', count: tickets.filter(t => t.statut === 'EXPIRED').length, color: 'gray' }
                  ].map((item) => (
                    <div key={item.status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        item.color === 'green' ? 'text-green-600' :
                        item.color === 'blue' ? 'text-blue-600' :
                        item.color === 'red' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {item.count}
                      </div>
                      <div className="text-sm text-gray-600">{item.label}</div>
                      <div className="text-xs text-gray-500">
                        {tickets.length > 0 ? Math.round((item.count / tickets.length) * 100) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Graphique des ventes par jour (simulation) */}
            {event.eventStats?.salesByDay && event.eventStats.salesByDay.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventes par jour</h3>
                <div className="h-64 flex items-end space-x-2">
                  {event.eventStats.salesByDay.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ 
                          height: `${Math.max(10, (day.sales / Math.max(...event.eventStats!.salesByDay!.map(d => d.sales))) * 200)}px` 
                        }}
                        title={`${day.sales} ventes le ${day.date}`}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45">
                        {new Date(day.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Onglet Activités */}
        {activeTab === 'activities' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Activités récentes ({activities.length})
              </h3>
            </div>
            
            {activities.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune activité</h3>
                <p className="text-gray-500">Aucune activité n'a encore été enregistrée pour cet événement.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'ADMIN_ACTION' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'USER_ACTION' ? 'bg-green-100 text-green-600' :
                          activity.type === 'SYSTEM_ACTION' ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {activity.type === 'ADMIN_ACTION' ? '👨‍💼' :
                           activity.type === 'USER_ACTION' ? '👤' :
                           activity.type === 'SYSTEM_ACTION' ? '⚙️' : '📋'}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action === 'create' ? 'Création' :
                               activity.action === 'update' ? 'Modification' :
                               activity.action === 'delete' ? 'Suppression' :
                               activity.action === 'purchase' ? 'Achat de billet' :
                               activity.action === 'validate' ? 'Validation de billet' :
                               activity.action}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.entity === 'event' ? 'Événement' :
                               activity.entity === 'ticket' ? 'Billet' :
                               activity.entity === 'user' ? 'Utilisateur' :
                               activity.entity}
                              {activity.user && (
                                <span> par {activity.user.nom} {activity.user.prenom}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(activity.createdAt)}
                          </div>
                        </div>
                        
                        {/* Détails de l'activité */}
                        {activity.newData && (
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                                Voir les détails
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded border text-xs">
                                <pre className="whitespace-pre-wrap text-gray-700">
                                  {JSON.stringify(activity.newData, null, 2)}
                                </pre>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600">Cette action est irréversible.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer l'événement <strong>"{event.titre}"</strong> ?
              {tickets.length > 0 && (
                <span className="block mt-2 text-red-600 text-sm">
                  ⚠️ Attention : {tickets.length} billet(s) sont associé(s) à cet événement et seront également supprimé(s).
                </span>
              )}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  handleDeleteEvent()
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}