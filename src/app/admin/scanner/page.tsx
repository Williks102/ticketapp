// src/app/admin/scanner/page.tsx - REMPLACEMENT COMPLET
'use client'

import { useState, useEffect, useRef } from 'react'
import { TicketResponse, ValidateTicketResponse } from '@/types/api'

interface ScanResult {
  success: boolean
  ticket?: TicketResponse
  message: string
  timestamp: string
}

export default function AdminScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    checkCameraPermission()
    return () => {
      stopScanning()
    }
  }, [])

  // 🔑 Fonction pour récupérer le token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  // 📷 Vérifier les permissions de la caméra
  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setHasCamera(true)
      stream.getTracks().forEach(track => track.stop()) // Arrêter le stream de test
    } catch (err) {
      console.warn('Caméra non disponible:', err)
      setHasCamera(false)
    }
  }

  // 📱 Démarrer le scan par caméra
  const startScanning = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Utiliser la caméra arrière si disponible
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (err) {
      console.error('Erreur démarrage caméra:', err)
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  // ⏹️ Arrêter le scan
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // ✅ VRAIE API - Validation de billet
  const validateTicket = async (ticketCode: string) => {
    try {
      setLoading(true)
      
      const token = getAuthToken()
      if (!token) {
        throw new Error('Non authentifié')
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      console.log('🔄 Validation du billet:', ticketCode)

      // ✅ APPEL API RÉEL
      const response = await fetch('/api/admin/tickets/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticketCode })
      })

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.')
      }

      if (response.status === 403) {
        throw new Error('Accès refusé. Permissions insuffisantes.')
      }

      const data: { success: boolean; data: ValidateTicketResponse } = await response.json()

      // Ajouter le résultat à l'historique
      const result: ScanResult = {
        success: data.data.success,
        ticket: data.data.ticket,
        message: data.data.message,
        timestamp: new Date().toISOString()
      }

      setScanResults(prev => [result, ...prev.slice(0, 9)]) // Garder les 10 derniers

      // Notification sonore et visuelle
      if (data.data.success) {
        playSuccessSound()
        showNotification('✅ Billet validé avec succès', 'success')
      } else {
        playErrorSound()
        showNotification(`❌ ${data.data.message}`, 'error')
      }

      console.log('✅ Validation terminée:', data.data.message)

    } catch (err) {
      console.error('❌ Erreur validation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de validation'
      
      const result: ScanResult = {
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      }

      setScanResults(prev => [result, ...prev.slice(0, 9)])
      playErrorSound()
      showNotification(`❌ ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 🔊 Sons de notification
  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.mp3')
    audio.play().catch(() => {
      // Fallback si pas de fichier audio
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      oscillator.frequency.value = 800
      oscillator.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.2)
    })
  }

  const playErrorSound = () => {
    const audio = new Audio('/sounds/error.mp3')
    audio.play().catch(() => {
      // Fallback si pas de fichier audio
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      oscillator.frequency.value = 300
      oscillator.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.5)
    })
  }

  // 📢 Notifications visuelles
  const showNotification = (message: string, type: 'success' | 'error') => {
    // Créer une notification temporaire
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    notification.textContent = message
    document.body.appendChild(notification)

    // Supprimer après 3 secondes
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 3000)
  }

  // 📝 Validation manuelle
  const handleManualValidation = () => {
    if (!manualCode.trim()) return
    validateTicket(manualCode.trim())
    setManualCode('')
  }

  // ⌨️ Gestion du clavier
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualValidation()
    }
  }

  // 💰 Formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // 🎨 Badge de résultat
  const getResultBadge = (success: boolean) => {
    return success ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Validé
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Refusé
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scanner de Billets</h1>
          <p className="text-gray-600 mt-1">
            Validez les billets en scannant le QR code ou en saisissant le numéro
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            hasCamera ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            {hasCamera ? 'Caméra disponible' : 'Caméra indisponible'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Scanner */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scanner par caméra */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanner QR Code</h2>
            
            {hasCamera ? (
              <div className="space-y-4">
                {/* Zone de scan */}
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ display: isScanning ? 'block' : 'none' }}
                  />
                  
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        <p className="text-gray-500">Cliquez pour démarrer le scanner</p>
                      </div>
                    </div>
                  )}

                  {/* Overlay de visée */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-orange-500 border-dashed rounded-lg"></div>
                    </div>
                  )}
                </div>

                {/* Contrôles caméra */}
                <div className="flex justify-center space-x-4">
                  {!isScanning ? (
                    <button
                      onClick={startScanning}
                      disabled={loading}
                      className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Démarrer le Scanner
                    </button>
                  ) : (
                    <button
                      onClick={stopScanning}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10l6 6m0-6l-6 6" />
                      </svg>
                      Arrêter le Scanner
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                <p className="text-gray-500">Caméra non disponible</p>
                <p className="text-sm text-gray-400 mt-1">Utilisez la saisie manuelle ci-dessous</p>
              </div>
            )}
          </div>

          {/* Saisie manuelle */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Saisie Manuelle</h2>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Numéro de billet ou code QR..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleManualValidation}
                disabled={loading || !manualCode.trim()}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="ml-2">Valider</span>
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historique des scans */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des Validations</h2>
          
          {scanResults.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-sm">Aucune validation effectuée</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanResults.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {getResultBadge(result.success)}
                      <p className="text-sm text-gray-900 mt-1 font-medium">
                        {result.message}
                      </p>
                      {result.ticket && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p><strong>{result.ticket.event.titre}</strong></p>
                          <p>{result.ticket.numeroTicket}</p>
                          <p>{formatCurrency(result.ticket.prix)}</p>
                          {result.ticket.user ? (
                            <p>{result.ticket.user.prenom} {result.ticket.user.nom}</p>
                          ) : (
                            <p>{result.ticket.guestPrenom} {result.ticket.guestNom}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {new Date(result.timestamp).toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bouton pour vider l'historique */}
          {scanResults.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setScanResults([])}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Vider l'historique
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques du jour */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiques du jour</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {scanResults.filter(r => r.success).length}
            </div>
            <div className="text-sm text-gray-500">Billets validés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {scanResults.filter(r => !r.success).length}
            </div>
            <div className="text-sm text-gray-500">Billets refusés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {scanResults.length}
            </div>
            <div className="text-sm text-gray-500">Total scans</div>
          </div>
        </div>
      </div>
    </div>
  )
}