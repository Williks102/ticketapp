// src/components/QRCodeModal.tsx - Modal pour afficher les QR codes
'use client'

import React, { useEffect, useRef } from 'react'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: {
    id: string
    numeroTicket: string
    qrCode: string
    event: {
      titre: string
      dateDebut: string
      lieu: string
    }
    prix: number
  }
}

export default function QRCodeModal({ isOpen, onClose, ticket }: QRCodeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Fermer le modal avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Générer le QR code en canvas
  const generateQRCode = (text: string, size: number = 200) => {
    // Version simplifiée - dans un vrai projet, utiliser qrcode.js ou similar
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    canvas.width = size
    canvas.height = size
    
    // Fond blanc
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, size, size)
    
    // Bordure
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, size, size)
    
    // Texte du QR code (simulation)
    ctx.fillStyle = '#000000'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('QR CODE', size / 2, size / 2 - 10)
    ctx.fillText(ticket.numeroTicket, size / 2, size / 2 + 10)
    
    // Pattern simple pour simuler un QR code
    ctx.fillStyle = '#000000'
    const gridSize = 8
    const cellSize = size / gridSize
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Pattern pseudo-aléatoire basé sur le numéro de ticket
        const hash = ticket.numeroTicket.charCodeAt((i + j) % ticket.numeroTicket.length)
        if (hash % 3 === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
        }
      }
    }
    
    return canvas.toDataURL()
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price / 100)
  }

  const downloadQRCode = () => {
    const qrCodeData = generateQRCode(ticket.qrCode, 400)
    const link = document.createElement('a')
    link.download = `qr-code-${ticket.numeroTicket}.png`
    link.href = qrCodeData
    link.click()
  }

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Billet ${ticket.numeroTicket}`,
          text: `Mon billet pour ${ticket.event.titre}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Partage annulé')
      }
    } else {
      // Fallback - copier dans le presse-papier
      navigator.clipboard.writeText(ticket.qrCode)
      alert('Code QR copié dans le presse-papier')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div 
          ref={modalRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          {/* Header */}
          <div className="bg-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">
                Billet QR Code
              </h3>
              <button
                onClick={onClose}
                className="text-orange-100 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
                <img 
                  src={generateQRCode(ticket.qrCode, 200)}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Ticket info */}
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {ticket.event.titre}
                </h4>
                <p className="text-orange-600 font-medium">
                  {ticket.numeroTicket}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {formatDate(ticket.event.dateDebut)}
                  </span>
                </div>

                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {ticket.event.lieu}
                  </span>
                </div>

                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3-.895-3-2s1.343-2 3-2 3 .895 3 2-1.343 2-3 2zm0 8c-1.657 0-3-.895-3-2s1.343-2 3-2 3 .895 3 2-1.343 2-3 2z" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">
                    {formatPrice(ticket.prix)}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      Présentez ce QR code à l&apos;entrée
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Assurez-vous que votre écran soit lumineux et le code bien visible
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={shareQRCode}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Partager
            </button>
            
            <button
              onClick={downloadQRCode}
              className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}