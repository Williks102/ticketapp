// app/mes-billets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TicketResponse } from '@/types/api'
import TicketCard from '@/components/TicketCard'

interface UserTicketsResponse {
  tickets: TicketResponse[]
  total: number
  page: number
  totalPages: number
}

export default function MesBilletsPage() {
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Charger les billets
  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: activeTab,
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/user/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des billets')
      }

      const data: UserTicketsResponse = await response.json()
      setTickets(data.tickets)
      setTotalPages(data.totalPages)
      setError(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [activeTab, page, searchTerm])

  // Télécharger le PDF d'un billet
  const downloadTicketPDF = async (ticketId: string, numeroTicket: string) => {
    try {
      const response = await fetch(`/api/user/tickets/${ticketId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `billet-${numeroTicket}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err) {
      alert('Erreur lors du téléchargement du billet')
      console.error(err)
    }
  }

  // Formater les dates
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

  // Formater les prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price / 100)
  }

  // Badge de statut
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[statut as keyof typeof labels] || statut}
      </span>
    )
  }

  // Déterminer si l'événement est passé
  const isEventPast = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes billets</h1>
              <p className="text-gray-600 mt-2">Gérez tous vos billets d'événements</p>
            </div>
            
            <Link
              href="/evenements"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Découvrir des événements
            </Link>
          </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    page === i + 1
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

// Composant TicketCard
interface TicketCardProps {
  ticket: TicketResponse
  onDownloadPDF: (ticketId: string, numeroTicket: string) => void
  formatDate: (dateString: string) => string
  formatPrice: (price: number) => string
  getStatusBadge: (statut: string) => JSX.Element
  isEventPast: (dateString: string) => boolean
}

function TicketCard({
  ticket,
  onDownloadPDF,
  formatDate,
  formatPrice,
  getStatusBadge,
  isEventPast
}: TicketCardProps) {
  const isPast = isEventPast(ticket.event.dateDebut)
  const canDownloadPDF = ticket.statut === 'VALID' || ticket.statut === 'USED'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Informations principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {ticket.event.titre}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Billet #{ticket.numeroTicket}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                {getStatusBadge(ticket.statut)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={isPast ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                  {formatDate(ticket.event.dateDebut)}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{ticket.event.lieu}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="font-semibold text-green-600">
                  {formatPrice(ticket.prix)}
                </span>
              </div>

              {ticket.validatedAt && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">
                    Validé le {formatDate(ticket.validatedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-3">
            {canDownloadPDF && (
              <button
                onClick={() => onDownloadPDF(ticket.id, ticket.numeroTicket)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger
              </button>
            )}

            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors inline-flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Partager
            </button>

            {!isPast && ticket.statut === 'VALID' && (
              <Link
                href={`/mes-billets/${ticket.id}/qr`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                </svg>
                QR Code
              </Link>
            )}
          </div>
        </div>

        {/* Informations supplémentaires pour les événements à venir */}
        {!isPast && ticket.statut === 'VALID' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Présentez-vous 30 min avant l'événement</span>
              </div>
              
              <div className="text-sm text-gray-500">
                {(() => {
                  const eventDate = new Date(ticket.event.dateDebut)
                  const now = new Date()
                  const diffTime = eventDate.getTime() - now.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  
                  if (diffDays === 0) return "Aujourd'hui"
                  if (diffDays === 1) return "Demain"
                  if (diffDays > 1) return `Dans ${diffDays} jours`
                  return ""
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}{/* Barre de recherche */}
        <div className="mb-6">
          <div className="max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Rechercher un billet ou événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'upcoming', label: 'À venir', count: tickets.filter(t => !isEventPast(t.event.dateDebut) && t.statut === 'VALID').length },
                { key: 'past', label: 'Passés', count: tickets.filter(t => isEventPast(t.event.dateDebut) || t.statut !== 'VALID').length },
                { key: 'all', label: 'Tous', count: tickets.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Liste des billets */}
        <div className="space-y-4">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onDownloadPDF={downloadTicketPDF}
                formatDate={formatDate}
                formatPrice={formatPrice}
                getStatusBadge={getStatusBadge}
                isEventPast={isEventPast}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {activeTab === 'upcoming' && 'Aucun événement à venir'}
                {activeTab === 'past' && 'Aucun événement passé'}
                {activeTab === 'all' && 'Aucun billet trouvé'}
              </h3>
              <p className="mt-2 text-gray-500">
                {activeTab === 'all' 
                  ? 'Vous n\'avez pas encore acheté de billets.'
                  : 'Aucun billet ne correspond à ce filtre.'
                }
              </p>
              {activeTab === 'all' && (
                <div className="mt-6">
                  <Link
                    href="/evenements"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
                  >
                    Découvrir des événements
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>