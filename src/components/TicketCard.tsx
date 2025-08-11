// components/TicketCard.tsx
import Link from 'next/link'
import { TicketResponse } from '@/types/api'

interface TicketCardProps {
  ticket: TicketResponse
  onDownloadPDF: (ticketId: string, numeroTicket: string) => void
  formatDate: (dateString: string) => string
  formatPrice: (price: number) => string
  getStatusBadge: (statut: string) => JSX.Element
  isEventPast: (dateString: string) => boolean
}

export default function TicketCard({
  ticket,
  onDownloadPDF,
  formatDate,
  formatPrice,
  getStatusBadge,
  isEventPast
}: TicketCardProps) {
  const isPast = isEventPast(ticket.event.dateDebut)
  const canDownloadPDF = ticket.statut === 'VALID' || ticket.statut === 'USED'

  const getDaysUntilEvent = () => {
    const eventDate = new Date(ticket.event.dateDebut)
    const now = new Date()
    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Demain"
    if (diffDays > 1) return `Dans ${diffDays} jours`
    return ""
  }

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
                <span>Présentez-vous 30 min avant l&apos;événement</span>
              </div>
              
              <div className="text-sm text-gray-500">
                {getDaysUntilEvent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}