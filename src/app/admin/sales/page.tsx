// src/app/admin/sales/page.tsx - REMPLACEMENT COMPLET
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TopEvent } from '@/types/api'

// Types pour les données de ventes (gardés identiques)
interface SalesData {
  totalRevenue: number
  totalTickets: number
  averageTicketPrice: number
  conversionRate: number
  growthRate: number
}

interface SalesByPeriod {
  date: string
  revenue: number
  tickets: number
  events: number
}

interface PaymentMethod {
  method: string
  count: number
  revenue: number
  percentage: number
}

export default function AdminSalesPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [salesByDay, setSalesByDay] = useState<SalesByPeriod[]>([])
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })

  useEffect(() => {
    fetchSalesData()
  }, [selectedPeriod, dateRange])

  // 🔑 Fonction pour récupérer le token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  // ✅ VRAIES API - Remplacement des données mockées
  const fetchSalesData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        setError('Non authentifié')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Construction des paramètres
      const params = new URLSearchParams({
        period: selectedPeriod
      })
      
      if (dateRange.from) params.append('from', dateRange.from)
      if (dateRange.to) params.append('to', dateRange.to)

      console.log('🔄 Chargement des données de ventes...')

      // ✅ APPELS API RÉELS - Remplacement des mocks
      const [statsResponse, byDayResponse, topEventsResponse, paymentMethodsResponse] = await Promise.all([
        fetch(`/api/admin/sales/detailed-stats?${params}`, { headers }),
        fetch(`/api/admin/sales/by-day?${params}`, { headers }),
        fetch('/api/admin/dashboard/top-events?limit=5', { headers }),
        fetch(`/api/admin/sales/payment-methods?${params}`, { headers })
      ])

      // Vérification des erreurs d'authentification
      if ([statsResponse, byDayResponse, topEventsResponse, paymentMethodsResponse].some(r => r.status === 401)) {
        setError('Session expirée. Veuillez vous reconnecter.')
        return
      }

      if ([statsResponse, byDayResponse, topEventsResponse, paymentMethodsResponse].some(r => r.status === 403)) {
        setError('Accès refusé. Permissions insuffisantes.')
        return
      }

      if ([statsResponse, byDayResponse, topEventsResponse, paymentMethodsResponse].some(r => !r.ok)) {
        throw new Error('Erreur lors du chargement des données')
      }

      const [statsData, byDayData, topEventsData, paymentMethodsData] = await Promise.all([
        statsResponse.json(),
        byDayResponse.json(),
        topEventsResponse.json(),
        paymentMethodsResponse.json()
      ])

      // Vérification du format des réponses
      if (!statsData.success || !byDayData.success || !topEventsData.success || !paymentMethodsData.success) {
        throw new Error('Format de réponse invalide')
      }

      // ✅ DONNÉES RÉELLES - Plus de mock
      setSalesData(statsData.data)
      setSalesByDay(byDayData.data)
      setTopEvents(topEventsData.data)
      setPaymentMethods(paymentMethodsData.data)

      console.log('✅ Données de ventes chargées avec succès')

    } catch (err) {
      console.error('❌ Erreur chargement ventes:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  // 🔄 Fonction de rafraîchissement
  const handleRefresh = () => {
    fetchSalesData()
  }

  // 📅 Gestion du changement de période
  const handlePeriodChange = (period: '7d' | '30d' | '90d' | '1y') => {
    setSelectedPeriod(period)
    setDateRange({ from: '', to: '' }) // Reset custom dates
  }

  // 📅 Gestion du changement de dates personnalisées
  const handleDateRangeChange = (from: string, to: string) => {
    setDateRange({ from, to })
    setSelectedPeriod('30d') // Reset period selector
  }

  // 💰 Formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // 📊 Formater les pourcentages
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // ⏳ État de chargement
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="bg-gray-200 h-96 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  // ❌ État d'erreur
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-red-800 font-semibold">Erreur de chargement</div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapport de Ventes</h1>
          <p className="text-gray-600 mt-1">
            Analyse détaillée de vos revenus et performances
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleRefresh}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex space-x-2">
            {(['7d', '30d', '90d', '1y'] as const).map(period => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === '7d' && '7 jours'}
                {period === '30d' && '30 jours'}
                {period === '90d' && '90 jours'}
                {period === '1y' && '1 an'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateRangeChange(e.target.value, dateRange.to)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <span className="text-gray-500">à</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateRangeChange(dateRange.from, e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      {salesData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Revenus Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesData.totalRevenue)}
                </p>
                <p className={`text-sm ${salesData.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(salesData.growthRate)} vs période précédente
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Billets Vendus</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesData.totalTickets.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(salesData.averageTicketPrice)} en moyenne
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Prix Moyen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesData.averageTicketPrice)}
                </p>
                <p className="text-sm text-gray-600">par billet</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Taux de Conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesData.conversionRate}%
                </p>
                <p className="text-sm text-gray-600">visiteurs → acheteurs</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphiques et tableaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes par jour */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventes par Jour</h3>
          <div className="space-y-3">
            {salesByDay.slice(-7).map((day, index) => (
              <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-sm text-gray-600">{day.tickets} billets • {day.events} événements</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(day.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top événements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Événements</h3>
          <div className="space-y-3">
            {topEvents.slice(0, 5).map((event, index) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.ticketsSold} billets vendus</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(event.revenue / 100)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Méthodes de paiement */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de Paiement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentMethods.map((method) => (
            <div key={method.method} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{method.method}</p>
                <p className="text-sm text-gray-600">{method.percentage}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${method.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{method.count} transactions</span>
                <span>{formatCurrency(method.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}