'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Types pour les données du dashboard
interface DashboardStats {
  totalEvents: number
  totalTickets: number
  totalRevenue: number
  totalUsers: number
  todayTickets: number
  thisMonthRevenue: number
  activeEvents: number
  conversionRate: number
  platformMetrics: {
    averageTicketPrice: number
    revenueGrowth: number
    userGrowthRate: number
    topPromoters: Array<{
      name: string
      eventsCount: number
      totalRevenue: number
    }>
  }
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  user?: {
    name: string
    email: string
    role: string
  } | null
  amount?: number | null
}

interface TopEvent {
  id: string
  title: string
  ticketsSold: number
  revenue: number
  date: string
  status: string
  organizer: string
  totalPlaces: number
  placesRestantes: number
}

interface DashboardData {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  topEvents: TopEvent[]
}

// Composant carte statistique
function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  trend = 'up' 
}: {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${trendColors[trend]} mt-1`}>
              {trend === 'up' && '↗'} {trend === 'down' && '↘'} {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-orange-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}

// Composant graphique simple
function SimpleChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
  }

  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-24 text-sm text-gray-600 truncate" title={item.name}>
            {item.name}
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="w-16 text-sm font-medium text-right">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔑 Fonction pour récupérer le token d'authentification
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  // 📊 Fonction pour charger les données du dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        router.push('/login?redirect=/admin')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      console.log('🔄 Chargement des données admin dashboard...')

      // ✅ VRAIES API - Appels parallèles pour optimiser les performances
      const [statsResponse, activitiesResponse, topEventsResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { headers }),
        fetch('/api/admin/dashboard/activities?limit=10', { headers }),
        fetch('/api/admin/dashboard/top-events?limit=8', { headers })
      ])

      // Vérification des erreurs d'authentification
      if (statsResponse.status === 401 || activitiesResponse.status === 401 || topEventsResponse.status === 401) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        router.push('/login?redirect=/admin')
        return
      }

      if (statsResponse.status === 403 || activitiesResponse.status === 403 || topEventsResponse.status === 403) {
        setError('Accès refusé. Vous devez être administrateur pour accéder à cette page.')
        return
      }

      if (!statsResponse.ok || !activitiesResponse.ok || !topEventsResponse.ok) {
        throw new Error('Erreur lors du chargement des données')
      }

      const [statsData, activitiesData, topEventsData] = await Promise.all([
        statsResponse.json(),
        activitiesResponse.json(),
        topEventsResponse.json()
      ])

      // Vérification du format des réponses
      if (!statsData.success || !activitiesData.success || !topEventsData.success) {
        throw new Error('Format de réponse invalide')
      }

      setDashboardData({
        stats: statsData.data,
        recentActivities: activitiesData.data,
        topEvents: topEventsData.data
      })

      console.log('✅ Données dashboard chargées avec succès')

    } catch (err) {
      console.error('❌ Erreur chargement dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // 🔄 Fonction de rafraîchissement
  const handleRefresh = () => {
    fetchDashboardData()
  }

  // 🚀 Chargement initial
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 💰 Formateurs
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount / 100) // Conversion centimes → FCFA
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_ACTION':
        return '🎫'
      case 'ADMIN_ACTION':
        return '⚙️'
      case 'SYSTEM_ACTION':
        return '🤖'
      case 'PAYMENT_ACTION':
        return '💳'
      case 'VALIDATION_ACTION':
        return '✅'
      default:
        return '📋'
    }
  }

  const getTrendFromGrowth = (growth: number): 'up' | 'down' | 'neutral' => {
    if (growth > 0) return 'up'
    if (growth < 0) return 'down'
    return 'neutral'
  }

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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

  // ❌ Error state
  if (error || !dashboardData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-red-800 font-semibold">Erreur de chargement</div>
              <p className="text-red-600 mt-1">
                {error || 'Impossible de charger les données du dashboard'}
              </p>
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

  const { stats, recentActivities, topEvents } = dashboardData

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble de votre plateforme de billetterie
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/events/create"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un événement
          </Link>
          <button
            onClick={handleRefresh}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Événements"
          value={formatNumber(stats.totalEvents)}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          title="Billets Vendus"
          value={formatNumber(stats.totalTickets)}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
        />

        <StatCard
          title="Revenus Total"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.platformMetrics.revenueGrowth > 0 ? `+${stats.platformMetrics.revenueGrowth.toFixed(1)}% ce mois` : undefined}
          trend={getTrendFromGrowth(stats.platformMetrics.revenueGrowth)}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <StatCard
          title="Utilisateurs"
          value={formatNumber(stats.totalUsers)}
          change={stats.platformMetrics.userGrowthRate > 0 ? `+${stats.platformMetrics.userGrowthRate.toFixed(1)}% ce mois` : undefined}
          trend={getTrendFromGrowth(stats.platformMetrics.userGrowthRate)}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Métriques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aujourd'hui</h3>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {formatNumber(stats.todayTickets)}
          </div>
          <p className="text-sm text-gray-600">Billets vendus</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ce mois</h3>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {formatCurrency(stats.thisMonthRevenue)}
          </div>
          <p className="text-sm text-gray-600">Revenus</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion</h3>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {stats.conversionRate.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-600">Taux de conversion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Activités Récentes</h3>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                        {activity.amount && (
                          <span className="text-xs font-medium text-green-600">
                            {formatCurrency(activity.amount)}
                          </span>
                        )}
                      </div>
                      {activity.user && (
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.user.name} ({activity.user.role})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune activité récente</p>
            )}
          </div>
        </div>

        {/* Top événements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Top Événements</h3>
            <Link href="/admin/events" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              Voir tous →
            </Link>
          </div>
          <div className="p-6">
            {topEvents.length > 0 ? (
              <SimpleChart 
                data={topEvents.slice(0, 6).map(event => ({
                  name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
                  value: event.ticketsSold
                }))}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun événement</p>
            )}
          </div>
        </div>
      </div>

      {/* Top promoteurs */}
      {stats.platformMetrics.topPromoters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Top Promoteurs</h3>
          </div>
          <div className="p-6">
            <SimpleChart 
              data={stats.platformMetrics.topPromoters.map(promoter => ({
                name: promoter.name.length > 25 ? promoter.name.substring(0, 25) + '...' : promoter.name,
                value: promoter.eventsCount
              }))}
            />
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/events"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="font-medium text-gray-900">Gérer les événements</div>
              <div className="text-sm text-gray-500">Créer, modifier, supprimer</div>
            </div>
          </Link>

          <Link
            href="/admin/tickets"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <div>
              <div className="font-medium text-gray-900">Gérer les billets</div>
              <div className="text-sm text-gray-500">Validation, annulation</div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <div>
              <div className="font-medium text-gray-900">Gérer les utilisateurs</div>
              <div className="text-sm text-gray-500">Comptes, permissions</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}