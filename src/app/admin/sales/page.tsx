'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SalesReport, TopEvent } from '@/types/api'

// Types pour les données de ventes
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

// Données simulées pour le développement
const mockSalesData: SalesData = {
  totalRevenue: 125650.50,
  totalTickets: 2847,
  averageTicketPrice: 44.15,
  conversionRate: 18.5,
  growthRate: 12.3
}

const mockSalesByDay: SalesByPeriod[] = [
  { date: '2025-08-01', revenue: 2450, tickets: 52, events: 3 },
  { date: '2025-08-02', revenue: 3200, tickets: 68, events: 4 },
  { date: '2025-08-03', revenue: 1890, tickets: 41, events: 2 },
  { date: '2025-08-04', revenue: 4100, tickets: 89, events: 5 },
  { date: '2025-08-05', revenue: 2750, tickets: 58, events: 3 },
  { date: '2025-08-06', revenue: 3850, tickets: 82, events: 4 },
  { date: '2025-08-07', revenue: 2200, tickets: 47, events: 2 }
]

const mockTopEvents: TopEvent[] = [
  { id: '1', title: 'Festival de Musique Électronique', ticketsSold: 245, revenue: 12250, date: '2025-08-15' },
  { id: '2', title: 'Concert Jazz Quartet', ticketsSold: 180, revenue: 9000, date: '2025-08-20' },
  { id: '3', title: 'Spectacle de Danse Contemporaine', ticketsSold: 95, revenue: 4750, date: '2025-08-25' },
  { id: '4', title: 'Soirée Stand-up Comedy', ticketsSold: 120, revenue: 3600, date: '2025-08-30' },
  { id: '5', title: 'Concert Rock Indie', ticketsSold: 85, revenue: 3400, date: '2025-09-05' }
]

const mockPaymentMethods: PaymentMethod[] = [
  { method: 'Carte bancaire', count: 1254, revenue: 89450, percentage: 71.2 },
  { method: 'PayPal', count: 486, revenue: 22100, percentage: 17.6 },
  { method: 'Apple Pay', count: 312, revenue: 11250, percentage: 8.9 },
  { method: 'Google Pay', count: 89, revenue: 2850, percentage: 2.3 }
]

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

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      
      // Dans un vrai projet, remplacez par vos vraies API
      // const salesResponse = await fetch(`/api/admin/sales/stats?period=${selectedPeriod}&from=${dateRange.from}&to=${dateRange.to}`)
      // const eventsResponse = await fetch('/api/admin/sales/top-events')
      // const paymentsResponse = await fetch('/api/admin/sales/payment-methods')
      
      // Simulation d'appels API
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setSalesData(mockSalesData)
      setSalesByDay(mockSalesByDay)
      setTopEvents(mockTopEvents)
      setPaymentMethods(mockPaymentMethods)
      
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
      month: 'short'
    }).format(new Date(dateString))
  }

  const formatFullDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString))
  }

  const exportSalesReport = async () => {
    try {
      // Dans un vrai projet, appelez votre API d'export
      // const response = await fetch('/api/admin/sales/export', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ period: selectedPeriod, format: 'csv' })
      // })
      
      // Simulation d'un export CSV
      const csvData = [
        ['Date', 'Chiffre d\'affaires', 'Billets vendus', 'Événements'],
        ...salesByDay.map(day => [
          day.date,
          day.revenue.toString(),
          day.tickets.toString(),
          day.events.toString()
        ])
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-ventes-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  // Calcul des max pour les graphiques
  const maxRevenue = Math.max(...salesByDay.map(d => d.revenue))
  const maxTickets = Math.max(...salesByDay.map(d => d.tickets))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Ventes et statistiques</h1>
        </div>
        
        {/* Skeleton loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!salesData) return null

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventes et statistiques</h1>
          <p className="text-gray-600">Analysez les performances de votre plateforme</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportSalesReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Exporter rapport
          </button>
          
          <Link
            href="/admin/analytics"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
            </svg>
            Analytics avancées
          </Link>
        </div>
      </div>

      {/* Filtres de période */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période prédéfinie
            </label>
            <div className="flex space-x-2">
              {(['7d', '30d', '90d', '1y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {{
                    '7d': '7 jours',
                    '30d': '30 jours', 
                    '90d': '3 mois',
                    '1y': '1 an'
                  }[period]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date début
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date fin
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Chiffre d'affaires total</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(salesData.totalRevenue)}</p>
              <p className="text-sm text-green-600 mt-1">
                ↗ +{salesData.growthRate}% ce mois
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Billets vendus</p>
              <p className="text-3xl font-bold text-gray-900">{salesData.totalTickets.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-blue-600 mt-1">
                Prix moyen: {formatCurrency(salesData.averageTicketPrice)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Taux de conversion</p>
              <p className="text-3xl font-bold text-gray-900">{salesData.conversionRate}%</p>
              <p className="text-sm text-purple-600 mt-1">
                Visiteurs → Acheteurs
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Prix moyen du billet</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(salesData.averageTicketPrice)}</p>
              <p className="text-sm text-orange-600 mt-1">
                Par transaction
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et données détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Évolution des ventes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Évolution des ventes</h2>
            <p className="text-sm text-gray-600">Revenus et billets vendus par jour</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chiffre d'affaires</span>
                <span className="font-medium text-green-600">Max: {formatCurrency(maxRevenue)}</span>
              </div>
              
              {salesByDay.map((day, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(day.revenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.tickets} billets • {day.events} événements
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {/* Barre de revenus */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    
                    {/* Barre de billets */}
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${(day.tickets / maxTickets) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top événements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Top événements</h2>
              <Link href="/admin/events" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Voir tout
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFullDate(event.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(event.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.ticketsSold} billets
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Moyens de paiement et analyses complémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Moyens de paiement */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Moyens de paiement</h2>
            <p className="text-sm text-gray-600">Répartition des méthodes de paiement</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][index]
                    }}></div>
                    <span className="text-sm font-medium text-gray-900">{method.method}</span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(method.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {method.count} transactions ({method.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Graphique en barres simple */}
            <div className="mt-6 space-y-2">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-xs text-gray-600 truncate">{method.method}</div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${method.percentage}%`,
                          backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][index]
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-xs font-medium text-right">{method.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analyses rapides */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Analyses rapides</h2>
            <p className="text-sm text-gray-600">Insights et recommandations</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Meilleur jour de vente */}
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Meilleur jour de vente</h3>
                <p className="text-sm text-gray-600">
                  {formatDate(salesByDay.reduce((best, current) => 
                    current.revenue > best.revenue ? current : best
                  ).date)} avec {formatCurrency(Math.max(...salesByDay.map(d => d.revenue)))}
                </p>
              </div>
            </div>

            {/* Tendance générale */}
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Tendance générale</h3>
                <p className="text-sm text-gray-600">
                  Croissance de {salesData.growthRate}% par rapport au mois précédent
                </p>
              </div>
            </div>

            {/* Recommandation */}
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Recommandation</h3>
                <p className="text-sm text-gray-600">
                  Optimisez les événements du week-end pour maximiser les ventes
                </p>
              </div>
            </div>

            {/* Panier moyen */}
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Panier moyen</h3>
                <p className="text-sm text-gray-600">
                  Les utilisateurs achètent en moyenne 1.2 billets par commande
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/events/analytics"
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Analytics détaillées</span>
            </Link>
            
            <Link
              href="/admin/refunds"
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Gérer les remboursements</span>
            </Link>
            
            <Link
              href="/admin/payments"
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Paiements</span>
            </Link>
            
            <button
              onClick={exportSalesReport}
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Exporter les données</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}