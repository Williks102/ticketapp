// src/hooks/useEventPurchase.ts
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  titre: string
  prix: number
  placesRestantes: number
  statut: string
}

interface PurchaseResult {
  success: boolean
  ticketId?: string
  message: string
}

export function useEventPurchase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  }

  // Fonction pour créer un billet gratuit
  const createFreeTicket = async (eventId: string): Promise<PurchaseResult> => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Connexion requise')
    }

    const response = await fetch('/api/tickets/free', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ eventId })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erreur lors de la réservation')
    }

    const data = await response.json()
    return {
      success: true,
      ticketId: data.data.id,
      message: 'Billet gratuit réservé avec succès!'
    }
  }

  // Fonction pour initier un paiement (événements payants)
  const initiatePayment = async (eventId: string): Promise<PurchaseResult> => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Connexion requise')
    }

    // Ici vous intégreriez votre logique de paiement existante
    // Par exemple avec Stripe ou votre système de paiement
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ eventId })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erreur lors du paiement')
    }

    const data = await response.json()
    
    // Rediriger vers Stripe ou votre processus de paiement
    if (data.data.paymentUrl) {
      window.location.href = data.data.paymentUrl
    }

    return {
      success: true,
      message: 'Redirection vers le paiement...'
    }
  }

  // Fonction principale pour gérer les réservations/achats
  const handleEventAction = async (event: Event): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      // Vérifications préliminaires
      if (event.statut !== 'ACTIVE') {
        throw new Error('Cet événement n\'est plus disponible')
      }

      if (event.placesRestantes <= 0) {
        throw new Error('Plus de places disponibles')
      }

      let result: PurchaseResult

      if (event.prix === 0) {
        // Événement gratuit - réservation directe
        result = await createFreeTicket(event.id)
        
        // Afficher message de succès
        alert(result.message)
        
        // Rediriger vers la page des billets
        router.push('/mes-billets')
        
      } else {
        // Événement payant - processus de paiement
        result = await initiatePayment(event.id)
        
        // Le paiement redirigera automatiquement
        alert(result.message)
      }

    } catch (error: any) {
      setError(error.message)
      alert(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return {
    handleEventAction,
    loading,
    error,
    clearError: () => setError(null)
  }
}