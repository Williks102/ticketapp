'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TicketResponse, TicketStatus, TicketsListResponse } from '@/types/api'

// Types pour les filtres
interface TicketFilters {
  search: string
  status: TicketStatus | 'all'
  eventId: string
  dateFrom: string
  dateTo: string
}

// Données simulées pour le développement
const mockTickets: TicketResponse[] = [
  {
    id: '1',
    numeroTicket: 'TKT-001234567',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    statut: 'VALID',
    prix: 45.00,
    createdAt: '2025-08-10T10:30:00Z',
    event: {
      id: 'evt1',
      titre: 'Festival de Musique Électronique',
      lieu: 'Palais des Festivals',
      dateDebut: '2025-08-15T20:00:00Z',
      dateFin: '2025-08-16T02:00:00Z'
    },
    user: {
      id: 'user1',
      nom: 'Dubois',
      prenom: 'Marie',
      email: 'marie.dubois@email.com'
    }
  },
  {
    id: '2',
    numeroTicket: 'TKT-001234568',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    statut: 'USED',
    prix: 35.00,
    createdAt: '2025-08-09T14:20:00Z',
    event: {
      id: 'evt2',
      titre: 'Concert Jazz Quartet',
      lieu: 'Salle de Concert Municipal',
      dateDebut: '2025-08-12T19:30:00Z',
      dateFin: '2025-08-12T22:00:00Z'
    },
    guestInfo: {
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre.martin@email.com',
      telephone: '0123456789'
    }
  },
  {
    id: '3',
    numeroTicket: 'TKT-001234569',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    statut: 'CANCELLED',
    prix: 25.00,
    createdAt: '2025-08-08T09:15:00Z',
    event: {
      id: 'evt3',
      titre: 'Spectacle de Danse Contemporaine',
      lieu: 'Théâtre Municipal',
      dateDebut: '2025-08-20T20:30:00Z',
      dateFin: '2025-08-20T22:30:00Z'
    },
    user: {
      id: 'user2',
      nom: 'Leroy',
      prenom: 'Sophie',
      email: 'sophie.leroy@email.com'
    }
  }
]

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TicketFilters>({
    search: '',
    status: 'all',
    eventId: '',
    dateFrom: '',
    dateTo: ''
  })
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTickets()
  }, [filters, currentPage])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      
      // Dans un vrai projet, remplacez par votre vraie API
      // const queryParams = new URLSearchParams({
      //   page: currentPage.toString(),
      //   search: filters.search,
      //   status: filters.status === 'all' ? '' : filters.status,
      //   eventId: filters.eventId,
      //   dateFrom: filters.dateFrom,
      //   dateTo: filters.dateTo
      // })
      // const response = await fetch(`/api/admin/tickets?${queryParams}`)
      // const data: TicketsListResponse = await response.json()
      
      // Simulation d'un appel API avec filtrage
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let filteredTickets = [...mockTickets]
      
      if (filters.search) {
        filteredTickets = filteredTickets.filter(ticket =>
          ticket.numeroTicket.toLowerCase().includes(filters.search.toLowerCase()) ||
          ticket.event.titre.toLowerCase().includes(filters.search.toLowerCase()) ||
          (ticket.user?.email || ticket.guestInfo?.email || '').toLowerCase().includes(filters.search.toLowerCase())
        )
      }
      
      if (filters.status !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.statut === filters.status)
      }
      
      setTickets(filteredTickets)
      setTotalPages(Math.ceil(filteredTickets.length / 10))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: TicketStatus) => {
    const statusConfig = {
      VALID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Valide' },
      USED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Utilisé' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expiré' }
    }
    
    const config = statusConfig[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets)
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId)
    } else {
      newSelected.add(ticketId)
    }
    setSelectedTickets(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set())
    } else {
      setSelectedTickets(new Set(tickets.map(t => t.id)))
    }
  }

  const handleBulkAction = async (action: 'cancel' | 'validate' | 'export') => {
    if (selectedTickets.size === 0) return
    
    try {
      // Dans un vrai projet, appelez votre API
      // await fetch('/api/admin/tickets/bulk', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action, ticketIds: Array.from(selectedTickets) })
      // })
      
      console.log(`Action ${action} sur ${selectedTickets.size} billets`)
      setSelectedTickets(new Set())
      await fetchTickets()
    } catch (error) {
      console.error('Erreur lors de l\'action groupée:', error)
    }
  }

  const exportTickets = () => {
    // Dans un vrai projet, générez et téléchargez le fichier
    const csvContent = tickets.map(ticket => [
      ticket.numeroTicket,
      ticket.event.titre,
      ticket.user?.email || ticket.guestInfo?.email,
      ticket.statut,
      ticket.prix,
      ticket.createdAt
    ].join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'billets.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des billets</h1>
        </div>
        
        {/* Skeleton loading */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des billets</h1>
          <p className="text-gray-600">Gérez tous les billets de votre plateforme</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportTickets}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Exporter
          </button>
          
          <Link
            href="/admin/scanner"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
            </svg>
            Scanner billets
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Numéro, événement, email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as TicketStatus | 'all' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="VALID">Valides</option>
              <option value="USED">Utilisés</option>
              <option value="CANCELLED">Annulés</option>
              <option value="EXPIRED">Expirés</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions groupées */}
      {selectedTickets.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-700">
              {selectedTickets.size} billet(s) sélectionné(s)
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('validate')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                Valider
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                Exporter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des billets */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={tickets.length > 0 && selectedTickets.size === tickets.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acheteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'achat
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTickets.has(ticket.id)}
                      onChange={() => handleSelectTicket(ticket.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {ticket.numeroTicket}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {ticket.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.event.titre}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ticket.event.lieu}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(ticket.event.dateDebut)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.user ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.user.prenom} {ticket.user.nom}
                        </div>
                        <div className="text-sm text-gray-500">{ticket.user.email}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Compte
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.guestInfo?.prenom} {ticket.guestInfo?.nom}
                        </div>
                        <div className="text-sm text-gray-500">{ticket.guestInfo?.email}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          Invité
                        </span>
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(ticket.statut)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(ticket.prix)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(ticket.createdAt)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/api/tickets/${ticket.id}/pdf`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir le PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="text-orange-600 hover:text-orange-900"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tickets.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun billet trouvé</h3>
            <p className="text-gray-600">Aucun billet ne correspond à vos critères de recherche.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-100 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> sur{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Statistiques des billets</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.statut === 'VALID').length}
              </div>
              <div className="text-sm text-gray-600">Billets valides</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.statut === 'USED').length}
              </div>
              <div className="text-sm text-gray-600">Billets utilisés</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {tickets.filter(t => t.statut === 'CANCELLED').length}
              </div>
              <div className="text-sm text-gray-600">Billets annulés</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatCurrency(tickets.reduce((sum, ticket) => sum + ticket.prix, 0))}
              </div>
              <div className="text-sm text-gray-600">Valeur totale</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}