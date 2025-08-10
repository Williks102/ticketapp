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

// Données d'exemple
const usersExemple: User[] = [
  {
    id: '1',
    email: 'marie.dupont@email.com',
    nom: 'Dupont',
    prenom: 'Marie',
    telephone: '06 12 34 56 78',
    role: 'USER',
    createdAt: new Date('2024-01-15T10:30:00'),
    lastLogin: new Date('2024-12-08T16:45:00'),
    ticketsAchetes: 8,
    totalDepense: 284.00,
    statut: 'ACTIVE'
  },
  {
    id: '2',
    email: 'pierre.martin@email.com',
    nom: 'Martin',
    prenom: 'Pierre',
    telephone: '06 98 76 54 32',
    role: 'USER',
    createdAt: new Date('2024-03-22T14:20:00'),
    lastLogin: new Date('2024-12-09T09:15:00'),
    ticketsAchetes: 15,
    totalDepense: 567.50,
    statut: 'ACTIVE'
  },
  {
    id: '3',
    email: 'admin@simplebillet.com',
    nom: 'Admin',
    prenom: 'Super',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01T00:00:00'),
    lastLogin: new Date('2024-12-09T08:30:00'),
    ticketsAchetes: 0,
    totalDepense: 0,
    statut: 'ACTIVE'
  },
  {
    id: '4',
    email: 'sophie.bernard@email.com',
    nom: 'Bernard',
    prenom: 'Sophie',
    telephone: '06 55 44 33 22',
    role: 'USER',
    createdAt: new Date('2024-06-10T11:45:00'),
    lastLogin: new Date('2024-11-30T19:20:00'),
    ticketsAchetes: 3,
    totalDepense: 105.00,
    statut: 'INACTIVE'
  },
  {
    id: '5',
    email: 'spam.user@example.com',
    nom: 'User',
    prenom: 'Spam',
    role: 'USER',
    createdAt: new Date('2024-11-01T12:00:00'),
    ticketsAchetes: 0,
    totalDepense: 0,
    statut: 'BANNED'
  }
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setUsers(usersExemple)
      setFilteredUsers(usersExemple)
      setIsLoading(false)
    }, 1000)
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

  const handleStatusChange = (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED') => {
    if (confirm(`Êtes-vous sûr de vouloir changer le statut de cet utilisateur ?`)) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, statut: newStatus } : user
      ))
    }
  }

  const handleRoleChange = (userId: string, newRole: 'USER' | 'ADMIN') => {
    if (confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur ?`)) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
    }
  }

  const handleDelete = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      setUsers(users.filter(u => u.id !== userId))
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
          <p className="text-gray-600">{users.length} utilisateur{users.length > 1 ? 's' : ''} au total</p>
        </div>
        
        <button className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export utilisateurs
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              placeholder="Email, nom, prénom, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous les rôles</option>
              <option value="USER">Utilisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
              <option value="BANNED">Banni</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="created">Date d'inscription</option>
              <option value="name">Nom</option>
              <option value="email">Email</option>
              <option value="spent">Total dépensé</option>
              <option value="tickets">Billets achetés</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="btn-secondary w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtrer
            </button>
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