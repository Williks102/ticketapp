// src/app/admin/page.tsx - VERSION COMPLÈTE CORRIGÉE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Types pour les données du dashboard
interface DashboardStats {
  totalUsers: number
  totalEvents: number
  totalTickets: number
  totalRevenue: number
  newUsersThisMonth: number
  activeEvents: number
  pendingValidations: number
  revenueThisMonth: number
  averageTicketPrice?: number
  revenueGrowth?: number
  userGrowthRate?: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  userId?: string
  userName?: string
  timestamp: string
  metadata?: any
  amount?: number
}

interface TopEvent {
  id: string
  titre: string
  ticketsVendus: number
  revenue: number
  dateDebut: string
  lieu: string
  statut: string
  placesRestantes: number
  tauxRemplissage: number
  organisateur: string
}

interface DashboardData {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  topEvents: TopEvent[]
}

// Composant pour afficher les statistiques
function StatsCard({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  change,
  changeType = 'positive',
  loading = false
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  change?: string
  changeType?: 'positive' | 'negative'
  loading?: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className={`text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {changeType === 'positive' ? (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Composant pour les activités récentes
function RecentActivitiesList({ activities, loading }: { activities: RecentActivity[]; loading: boolean }) {
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_ACTION':
        return <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      case 'ADMIN_ACTION':
        return <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
      case 'PAYMENT_ACTION':
        return <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      case 'VALIDATION_ACTION':
        return <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activités récentes</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ✅ CORRECTION - Vérifier que activities est un tableau
  const safeActivities = Array.isArray(activities) ? activities : []

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activités récentes</h3>
        <Link href="/admin/logs" className="text-sm text-orange-600 hover:text-orange-700">
          Voir tout
        </Link>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {safeActivities.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">Aucune activité récente</p>
          </div>
        ) : (
          safeActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
              <div className="mt-2 flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">
                  {activity.description}
                </p>
                {activity.userName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Par {activity.userName}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                  {activity.amount && (
                    <span className="text-xs font-medium text-green-600">
                      +{(activity.amount / 100).toLocaleString()} FCFA
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Composant pour les événements populaires
function TopEventsList({ events, loading }: { events: TopEvent[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Événements populaires</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ✅ CORRECTION - Vérifier que events est un tableau
  const safeEvents = Array.isArray(events) ? events : []

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Événements populaires</h3>
        <Link href="/admin/events" className="text-sm text-orange-600 hover:text-orange-700">
          Voir tout
        </Link>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {safeEvents.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">Aucun événement trouvé</p>
          </div>
        ) : (
          safeEvents.map((event, index) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{event.titre}</h4>
                  <p className="text-xs text-gray-500">{event.lieu}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.dateDebut).toLocaleDateString('fr-FR')} • {event.organisateur}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 text-sm">{event.ticketsVendus} billets</p>
                <p className="text-xs text-green-600 font-medium">
                  {(event.revenue / 100).toLocaleString()} FCFA
                </p>
                <p className="text-xs text-gray-500">
                  {event.tauxRemplissage}% rempli
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Composant pour les graphiques de progression
function ProgressChart({ 
  title, 
  data, 
  color = 'orange' 
}: { 
  title: string
  data: Array<{ label: string; value: number }>
  color?: string 
}) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 w-24 truncate">
              {item.label}
            </span>
            <div className="flex-1 mx-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-${color}-500 transition-all duration-500`}
                  style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Composant principal du dashboard
export default function AdminDashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // ✅ CORRECTION 1 - Fonction unifiée pour récupérer le token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  // Fonction pour charger les données du dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        console.log('❌ Aucun token trouvé, redirection vers login')
        // ✅ CORRECTION 2 - URL de redirection correcte
        router.push('/auth/login?redirect=/admin')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      console.log('🔄 Chargement des données admin dashboard...')

      // ✅ CORRECTION 3 - Gestion d'erreur améliorée pour les APIs
      const apiCalls = [
        fetch('/api/admin/dashboard/stats', { headers }),
        fetch('/api/admin/dashboard/activities?limit=10', { headers }),
        fetch('/api/admin/dashboard/top-events?limit=8', { headers })
      ]

      const responses = await Promise.allSettled(apiCalls)

      // ✅ CORRECTION 4 - Gestion des erreurs d'authentification
      for (const result of responses) {
        if (result.status === 'fulfilled' && result.value.status === 401) {
          console.log('❌ Token invalide, suppression et redirection')
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          localStorage.removeItem('user')
          sessionStorage.removeItem('user')
          router.push('/auth/login?redirect=/admin')
          return
        }
        if (result.status === 'fulfilled' && result.value.status === 403) {
          setError('Accès refusé. Vous devez être administrateur pour accéder à cette page.')
          return
        }
      }

      // ✅ CORRECTION 5 - Traitement des réponses avec fallbacks
      let statsData = { success: false, data: null }
      let activitiesData = { success: false, data: [] }
      let topEventsData = { success: false, data: [] }

      const [statsResult, activitiesResult, topEventsResult] = responses

      // Traiter les réponses avec gestion d'erreur
      if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
        statsData = await statsResult.value.json()
      } else {
        console.warn('⚠️ API stats non disponible')
      }

      if (activitiesResult.status === 'fulfilled' && activitiesResult.value.ok) {
        activitiesData = await activitiesResult.value.json()
      } else {
        console.warn('⚠️ API activités non disponible')
      }

      if (topEventsResult.status === 'fulfilled' && topEventsResult.value.ok) {
        topEventsData = await topEventsResult.value.json()
      } else {
        console.warn('⚠️ API top events non disponible')
      }

      // ✅ CORRECTION - Fallback avec typage correct
      const defaultStats: DashboardStats = {
        totalUsers: 0,
        totalEvents: 0,
        totalTickets: 0,
        totalRevenue: 0,
        newUsersThisMonth: 0,
        activeEvents: 0,
        pendingValidations: 0,
        revenueThisMonth: 0
      }

      setDashboardData({
        stats: (statsData.success && statsData.data) ? statsData.data : defaultStats,
        recentActivities: (activitiesData.success && activitiesData.data) ? activitiesData.data : [],
        topEvents: (topEventsData.success && topEventsData.data) ? topEventsData.data : []
      })

      setLastRefresh(new Date())
      console.log('✅ Données dashboard chargées avec succès')

    } catch (err) {
      console.error('❌ Erreur chargement dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  useEffect(() => {
    setMounted(true)
    setLastRefresh(new Date())
    fetchDashboardData()
    
    // Auto-refresh toutes les 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // ✅ CORRECTION 7 - État d'erreur avec bouton de retry
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

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalEvents: 0,
    totalTickets: 0,
    totalRevenue: 0,
    newUsersThisMonth: 0,
    activeEvents: 0,
    pendingValidations: 0,
    revenueThisMonth: 0
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble de votre plateforme de billetterie
          </p>
          {/* ✅ CORRECTION - Afficher l'horodatage seulement côté client */}
          {mounted && lastRefresh && (
            <p className="text-xs text-gray-400 mt-2">
              Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50"
          >
            <svg className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
          <Link
            href="/admin/events/create"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel événement
          </Link>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Utilisateurs totaux"
          value={stats.totalUsers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          color="blue"
          change={stats.newUsersThisMonth > 0 ? `+${stats.newUsersThisMonth} ce mois` : undefined}
          loading={loading}
        />

        <StatsCard
          title="Événements actifs"
          value={stats.activeEvents}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          color="green"
          loading={loading}
        />

        <StatsCard
          title="Billets vendus"
          value={stats.totalTickets}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
          color="orange"
          loading={loading}
        />

        <StatsCard
          title="Revenus totaux"
          value={`${((stats.totalRevenue || 0) / 100).toLocaleString()} FCFA`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          color="purple"
          change={stats.revenueThisMonth > 0 ? `+${((stats.revenueThisMonth || 0) / 100).toLocaleString()} FCFA ce mois` : undefined}
          loading={loading}
        />
      </div>

      {/* Statistiques secondaires */}
      {!loading && stats.pendingValidations > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium">
                {stats.pendingValidations} billet{stats.pendingValidations > 1 ? 's' : ''} en attente de validation
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                <Link href="/admin/tickets?status=VALID" className="underline hover:no-underline">
                  Voir les billets à valider →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section principale avec activités et événements populaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <RecentActivitiesList 
          activities={dashboardData?.recentActivities || []} 
          loading={loading} 
        />

        {/* Événements populaires */}
        <TopEventsList 
          events={dashboardData?.topEvents || []} 
          loading={loading} 
        />
      </div>

      {/* Graphiques et métriques avancées */}
      {!loading && dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance mensuelle */}
          <ProgressChart
            title="Performance ce mois"
            data={[
              { label: 'Revenus', value: (stats.revenueThisMonth || 0) / 1000 },
              { label: 'Nouveaux users', value: stats.newUsersThisMonth || 0 },
              { label: 'Billets vendus', value: Math.min(stats.totalTickets || 0, 100) },
              { label: 'Événements actifs', value: stats.activeEvents || 0 }
            ]}
            color="orange"
          />

          {/* Métriques clés */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques clés</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Prix moyen du billet</span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.totalTickets > 0 
                    ? `${Math.round((stats.totalRevenue || 0) / stats.totalTickets / 100).toLocaleString()} FCFA`
                    : '0 FCFA'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Taux de conversion</span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.totalUsers > 0 
                    ? `${Math.round((stats.totalTickets / stats.totalUsers) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Événements par admin</span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.totalEvents || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Revenus par événement</span>
                <span className="text-sm font-bold text-gray-900">
                  {stats.totalEvents > 0 
                    ? `${Math.round((stats.totalRevenue || 0) / stats.totalEvents / 100).toLocaleString()} FCFA`
                    : '0 FCFA'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/events/create"
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
          >
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Créer un événement</p>
              <p className="text-sm text-gray-500">Ajouter un nouvel événement</p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Gérer les utilisateurs</p>
              <p className="text-sm text-gray-500">Voir tous les utilisateurs</p>
            </div>
          </Link>

          <Link
            href="/admin/tickets"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Gérer les billets</p>
              <p className="text-sm text-gray-500">Voir tous les billets</p>
            </div>
          </Link>

          <Link
            href="/admin/scanner"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4m-4 8h4M4 4h5L9 12l-5 8h5l4-8L9 4H4z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Scanner QR</p>
              <p className="text-sm text-gray-500">Valider les billets</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Notifications et alertes */}
      {!loading && (
        <div className="space-y-4">
          {/* Alerte événements bientôt complets */}
          {dashboardData?.topEvents.some(event => event.tauxRemplissage > 90) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-amber-800 font-medium">Événements bientôt complets</p>
                  <p className="text-amber-700 text-sm mt-1">
                    {dashboardData?.topEvents.filter(event => event.tauxRemplissage > 90).length} événement(s) 
                    ont dépassé 90% de remplissage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message d'information si certaines APIs ne sont pas disponibles */}
          {(!dashboardData?.recentActivities?.length && !dashboardData?.topEvents?.length) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-blue-800 font-medium">Configuration en cours</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Certaines données détaillées ne sont pas encore disponibles. Les statistiques principales sont fonctionnelles.
                    Les données d'activité et d'événements populaires apparaîtront dès que vous aurez des utilisateurs actifs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer avec liens utiles */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Liens utiles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/reports" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
            📊 Rapports détaillés
          </Link>
          <Link href="/admin/settings" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
            ⚙️ Paramètres système
          </Link>
          <Link href="/admin/logs" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
            📋 Journaux d'activité
          </Link>
          <Link href="/admin/help" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
            ❓ Centre d'aide
          </Link>
        </div>
      </div>
    </div>
  )
}