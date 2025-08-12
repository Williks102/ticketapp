// src/app/admin/users/page.tsx - REMPLACEMENT AVEC VRAIES API
'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
  lastLogin?: Date
  ticketsAchetes: number
  totalDepense: number
  statut: 'ACTIVE' | 'INACTIVE' | 'BANNED'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔑 Fonction pour récupérer le token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  }

  // ✅ VRAIE API - Chargement des utilisateurs
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
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

      console.log('🔄 Chargement des utilisateurs...')

      const response = await fetch('/api/admin/users?limit=100', { headers })

      if (response.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.')
        return
      }

      if (response.status === 403) {
        setError('Accès refusé. Permissions insuffisantes.')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error('Format de réponse invalide')
      }

      // ✅ TRANSFORMATION DES DONNÉES API VERS FORMAT LOCAL
      const transformedUsers: User[] = data.data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        role: user.role,
        createdAt: new Date(user.createdAt),
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
        ticketsAchetes: user.stats?.totalTickets || 0,
        totalDepense: user.stats?.totalSpent || 0,
        statut: user.statut
      }))

      setUsers(transformedUsers)
      setFilteredUsers(transformedUsers)

      console.log(`✅ ${transformedUsers.length} utilisateurs chargés avec succès`)

    } catch (err) {
      console.error('❌ Erreur chargement utilisateurs:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filtered = [...users]

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.telephone && user.telephone.includes(searchTerm))
      )
    }

    // Filtrer par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.statut === statusFilter)
    }

    // Trier
    switch (sortBy) {
      case 'created':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case 'name':
        filtered.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`))
        break
      case 'email':
        filtered.sort((a, b) => a.email.localeCompare(b.email))
        break
      case 'spent':
        filtered.sort((a, b) => b.totalDepense - a.totalDepense)
        break
      case 'tickets':
        filtered.sort((a, b) => b.ticketsAchetes - a.ticketsAchetes)
        break
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter, sortBy])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'ACTIVE':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Actif</span>
      case 'INACTIVE':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Inactif</span>
      case 'BANNED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Banni</span>
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Admin</span>
      case 'USER':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">User</span>
      default:
        return null
    }
  }

  // ✅ VRAIE API - Modification de statut
  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED') => {
    if (!confirm(`Êtes-vous sûr de vouloir changer le statut de cet utilisateur ?`)) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) return

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ statut: newStatus })
      })

      if (response.ok) {
        // Mettre à jour localement
        setUsers(users.map(user => 
          user.id === userId ? { ...user, statut: newStatus } : user
        ))
        console.log('✅ Statut utilisateur mis à jour')
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Impossible de modifier le statut'}`)
      }
    } catch (error) {
      console.error('❌ Erreur modification statut:', error)
      alert('Erreur lors de la modification du statut')
    }
  }

  // ✅ VRAIE API - Modification de rôle
  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    if (!confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur ?`)) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) return

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        // Mettre à jour localement
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
        console.log('✅ Rôle utilisateur mis à jour')
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Impossible de modifier le rôle'}`)
      }
    } catch (error) {
      console.error('❌ Erreur modification rôle:', error)
      alert('Erreur lors de la modification du rôle')
    }
  }

  // ✅ VRAIE API - Suppression d'utilisateur
  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) return

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        // Supprimer localement
        setUsers(users.filter(u => u.id !== userId))
        console.log('✅ Utilisateur supprimé')
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.message || 'Impossible de supprimer l\'utilisateur'}`)
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
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
              onClick={fetchUsers}
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
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
          <p className="text-gray-600">{users.length} utilisateur{users.length > 1 ? 's' : ''} au total</p>
        </div>
        
        <button className="btn-primary" onClick={fetchUsers}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
              <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.statut === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Administrateurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'ADMIN').length}
              </p>
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
              <p className="text-sm font-medium text-gray-600">CA total clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(users.reduce((sum, user) => sum + user.totalDepense, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <input
              type="text"
              placeholder="Nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="USER">Utilisateurs</option>
              <option value="ADMIN">Administrateurs</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="INACTIVE">Inactifs</option>
              <option value="BANNED">Bannis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="created">Date d'inscription</option>
              <option value="name">Nom</option>
              <option value="email">Email</option>
              <option value="spent">Montant dépensé</option>
              <option value="tickets">Billets achetés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.prenom} {user.nom}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.telephone && (
                          <div className="text-xs text-gray-400">{user.telephone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Inscrit le {formatDate(user.createdAt)}
                    </div>
                    {user.lastLogin && (
                      <div className="text-xs text-gray-500">
                        Dernière connexion: {formatDate(user.lastLogin)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.ticketsAchetes} billets</div>
                    <div className="text-xs text-gray-500">{formatPrice(user.totalDepense)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.statut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {/* Menu actions */}
                      <div className="relative inline-block text-left">
                        <select
                          onChange={(e) => {
                            const action = e.target.value
                            if (action === 'make_admin') handleRoleChange(user.id, 'ADMIN')
                            if (action === 'make_user') handleRoleChange(user.id, 'USER')
                            if (action === 'activate') handleStatusChange(user.id, 'ACTIVE')
                            if (action === 'deactivate') handleStatusChange(user.id, 'INACTIVE')
                            if (action === 'ban') handleStatusChange(user.id, 'BANNED')
                            if (action === 'delete') handleDelete(user.id)
                            e.target.value = ''
                          }}
                          className="text-sm border border-gray-300 rounded px-3 py-1"
                          defaultValue=""
                        >
                          <option value="" disabled>Actions</option>
                          {user.role === 'USER' && <option value="make_admin">Promouvoir admin</option>}
                          {user.role === 'ADMIN' && <option value="make_user">Rétrograder user</option>}
                          {user.statut !== 'ACTIVE' && <option value="activate">Activer</option>}
                          {user.statut === 'ACTIVE' && <option value="deactivate">Désactiver</option>}
                          {user.statut !== 'BANNED' && <option value="ban">Bannir</option>}
                          <option value="delete" className="text-red-600">Supprimer</option>
                        </select>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>
    </div>
  )
}