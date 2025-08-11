// app/mes-billets/[id]/qr/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TicketResponse } from '@/types/api'

export default function QRCodePage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [brightness, setBrightness] = useState(100)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/user/tickets/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Billet non trouvé')
        }

        const data = await response.json()
        setTicket(data)
        setError(null)

        // Maximiser la luminosité pour le QR code
        setBrightness(100)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTicket()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Chargement du billet...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white p-6">
          <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Billet introuvable</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/mes-billets"
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à mes billets
          </Link>
        </div>
      </div>
    )
  }

  const isEventPast = new Date(ticket.event.dateDebut) < new Date()
  const canUseQR = ticket.statut === 'VALID' && !isEventPast

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <h1 className="text-white font-semibold">Mon billet</h1>
          
          <button
            onClick={() => setBrightness(brightness === 100 ? 150 : 100)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Statut du billet */}
        {!canUseQR && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-200 font-semibold">
                  {isEventPast ? 'Événement terminé' : 'Billet non valide'}
                </p>
                <p className="text-red-300 text-sm">
                  {isEventPast 
                    ? 'Ce QR code ne peut plus être utilisé'
                    : `Statut: ${ticket.statut}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informations de l'événement */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-white text-xl font-bold mb-2">{ticket.event.titre}</h2>
          
          <div className="space-y-3 text-gray-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(ticket.event.dateDebut)}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{ticket.event.lieu}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>{formatPrice(ticket.prix)}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
          <div className="mb-4">
            <h3 className="text-gray-900 text-lg font-semibold mb-2">
              {canUseQR ? 'Présentez ce QR code à l\'entrée' : 'QR Code'}
            </h3>
            <p className="text-gray-600 text-sm">
              Billet #{ticket.numeroTicket}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-6 rounded-2xl border-4 border-gray-100 mx-auto max-w-sm">
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
              {/* En production, utilisez une librairie QR comme 'qrcode.js' */}
              <div className="text-center">
                <div className="text-6xl mb-4">📱</div>
                <div className="text-gray-600 font-mono text-sm break-all px-4">
                  {ticket.qrCode || ticket.numeroTicket}
                </div>
                <div className="text-gray-400 text-xs mt-2">QR Code généré</div>
              </div>
            </div>
          </div>

          {canUseQR && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Billet valide</span>
              </div>
              <p className="text-gray-600 text-sm">
                Arrivez 30 minutes avant l'événement
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
          <h4 className="text-blue-200 font-semibold mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Instructions
          </h4>
          <ul className="text-blue-100 text-sm space-y-1">
            <li>• Gardez votre téléphone chargé</li>
            <li>• Augmentez la luminosité de l'écran</li>
            <li>• Présentez-vous à l'heure indiquée</li>
            <li>• Ayez une pièce d'identité avec vous</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href="/mes-billets"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors text-center"
          >
            Mes billets
          </Link>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: ticket.event.titre,
                  text: `Mon billet pour ${ticket.event.titre}`,
                  url: window.location.href
                })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Lien copié dans le presse-papiers')
              }
            }}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors text-center"
          >
            Partager
          </button>
        </div>
      </div>
    </div>
  )
}