'use client'

import { useState, useEffect } from 'react'

interface ScannedTicket {
  id: string
  numeroTicket: string
  eventTitle: string
  eventDate: Date
  holderName: string
  holderEmail: string
  prix: number
  statut: 'VALID' | 'USED' | 'CANCELLED'
  scannedAt?: Date
}

interface ScanResult {
  success: boolean
  ticket?: ScannedTicket
  message: string
}

// Données d'exemple de billets
const ticketsExemple: Record<string, ScannedTicket> = {
  'TKT-2024-001234': {
    id: '1',
    numeroTicket: 'TKT-2024-001234',
    eventTitle: 'Concert de Jazz Exceptionnel',
    eventDate: new Date('2024-12-15T20:00:00'),
    holderName: 'Marie Dupont',
    holderEmail: 'marie.dupont@email.com',
    prix: 35.00,
    statut: 'VALID'
  },
  'TKT-2024-001235': {
    id: '2',
    numeroTicket: 'TKT-2024-001235',
    eventTitle: 'Théâtre: Roméo et Juliette',
    eventDate: new Date('2024-12-20T19:30:00'),
    holderName: 'Pierre Martin',
    holderEmail: 'pierre.martin@email.com',
    prix: 28.00,
    statut: 'USED',
    scannedAt: new Date('2024-12-20T19:15:00')
  },
  'TKT-2024-001236': {
    id: '3',
    numeroTicket: 'TKT-2024-001236',
    eventTitle: 'Festival Rock 2024',
    eventDate: new Date('2024-12-25T18:00:00'),
    holderName: 'Sophie Bernard',
    holderEmail: 'sophie.bernard@email.com',
    prix: 45.00,
    statut: 'CANCELLED'
  }
}

export default function AdminScannerPage() {
  const [manualCode, setManualCode] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScannedTicket[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual')
  const [stats, setStats] = useState({
    todayScans: 23,
    validScans: 21,
    invalidScans: 2,
    totalRevenue: 1247.00
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
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

  const validateTicket = (ticketCode: string): ScanResult => {
    // Simuler la validation d'un billet
    const ticket = ticketsExemple[ticketCode]
    
    if (!ticket) {
      return {
        success: false,
        message: 'Billet non trouvé. Vérifiez le code QR ou le numéro de billet.'
      }
    }

    if (ticket.statut === 'CANCELLED') {
      return {
        success: false,
        ticket,
        message: 'Ce billet a été annulé et ne peut pas être utilisé.'
      }
    }

    if (ticket.statut === 'USED') {
      return {
        success: false,
        ticket,
        message: `Ce billet a déjà été utilisé le ${ticket.scannedAt ? formatDate(ticket.scannedAt) : 'date inconnue'}.`
      }
    }

    // Vérifier si l'événement est aujourd'hui (simplification)
    const today = new Date()
    const eventDate = ticket.eventDate
    const isToday = today.toDateString() === eventDate.toDateString()

    if (!isToday) {
      return {
        success: false,
        ticket,
        message: `Ce billet est valide mais l'événement a lieu le ${formatDate(eventDate)}.`
      }
    }

    // Marquer le billet comme utilisé
    ticket.statut = 'USED'
    ticket.scannedAt = new Date()

    return {
      success: true,
      ticket,
      message: 'Billet validé avec succès ! Accès autorisé.'
    }
  }

  const handleManualScan = () => {
    if (!manualCode.trim()) {
      setScanResult({
        success: false,
        message: 'Veuillez saisir un code de billet.'
      })
      return
    }

    setIsScanning(true)
    
    // Simuler un délai de traitement
    setTimeout(() => {
      const result = validateTicket(manualCode.trim())
      setScanResult(result)
      
      if (result.success && result.ticket) {
        setRecentScans(prev => [result.ticket!, ...prev.slice(0, 9)])
        setStats(prev => ({
          ...prev,
          todayScans: prev.todayScans + 1,
          validScans: prev.validScans + 1,
          totalRevenue: prev.totalRevenue + result.ticket!.prix
        }))
      } else {
        setStats(prev => ({
          ...prev,
          todayScans: prev.todayScans + 1,
          invalidScans: prev.invalidScans + 1
        }))
      }
      
      setIsScanning(false)
      setManualCode('')
    }, 1000)
  }

  const handleCameraScan = () => {
    // Simuler l'ouverture de la caméra
    alert('Fonctionnalité caméra à implémenter avec une bibliothèque comme react-qr-scanner')
  }

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'VALID':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'USED':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'CANCELLED':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Scanner de billets</h1>
        <p className="text-gray-600">Validez les billets à l'entrée des événements</p>
      </div>

      {/* Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Scans aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Billets valides</p>
              <p className="text-2xl font-bold text-gray-900">{stats.validScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Billets invalides</p>
              <p className="text-2xl font-bold text-gray-900">{stats.invalidScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Revenus validés</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Scanner un billet</h3>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => setScanMode('manual')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  scanMode === 'manual'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Saisie manuelle
              </button>
              <button
                onClick={() => setScanMode('camera')}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  scanMode === 'camera'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Caméra QR
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {scanMode === 'manual' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de billet ou code QR
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ex: TKT-2024-001234"
                    className="input-field"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                  />
                </div>
                
                <button
                  onClick={handleManualScan}
                  disabled={isScanning}
                  className="btn-primary w-full"
                >
                  {isScanning ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validation...
                    </div>
                  ) : (
                    'Valider le billet'
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">Mode caméra</p>
                <button onClick={handleCameraScan} className="btn-primary">
                  Ouvrir la caméra
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Nécessite l'implémentation d'une bibliothèque QR
                </p>
              </div>
            )}

            {/* Résultat du scan */}
            {scanResult && (
              <div className={`mt-6 p-4 rounded-lg ${
                scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {scanResult.success ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${
                      scanResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {scanResult.success ? 'Billet valide ✓' : 'Billet invalide ✗'}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      scanResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {scanResult.message}
                    </p>
                    
                    {scanResult.ticket && (
                      <div className="mt-3 text-sm">
                        <p><strong>Billet:</strong> {scanResult.ticket.numeroTicket}</p>
                        <p><strong>Événement:</strong> {scanResult.ticket.eventTitle}</p>
                        <p><strong>Titulaire:</strong> {scanResult.ticket.holderName}</p>
                        <p><strong>Prix:</strong> {formatPrice(scanResult.ticket.prix)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Billets récemment scannés */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Derniers scans</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentScans.length > 0 ? (
                recentScans.map((ticket, index) => (
                  <div key={`${ticket.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(ticket.statut)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ticket.numeroTicket}</p>
                        <p className="text-xs text-gray-500">{ticket.holderName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{formatPrice(ticket.prix)}</p>
                      <p className="text-xs text-gray-500">
                        {ticket.scannedAt ? formatDate(ticket.scannedAt) : 'Non scanné'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                  </svg>
                  <p>Aucun billet scanné récemment</p>
                  <p className="text-sm">Les derniers scans apparaîtront ici</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Codes de test */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-4">Codes de test disponibles</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <p className="font-medium text-green-700">Billet valide</p>
            <p className="text-gray-600 font-mono">TKT-2024-001234</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="font-medium text-blue-700">Billet déjà utilisé</p>
            <p className="text-gray-600 font-mono">TKT-2024-001235</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="font-medium text-red-700">Billet annulé</p>
            <p className="text-gray-600 font-mono">TKT-2024-001236</p>
          </div>
        </div>
      </div>
    </div>
  )
}