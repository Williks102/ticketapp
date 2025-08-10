// src/types/api.ts - VERSION CORRIGÉE

// =============================================================================
// TYPES STRICTS POUR LES STATUTS
// =============================================================================

export type EventStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE'
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED' | 'EXPIRED'  // ← AJOUTER 'EXPIRED'
export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED'

// =============================================================================
// TYPES POUR L'AUTHENTIFICATION
// =============================================================================

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  nom: string
  prenom: string
  telephone?: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    nom: string
    prenom: string
    role: UserRole
  }
  token: string
}

// =============================================================================
// TYPES POUR LES ÉVÉNEMENTS
// =============================================================================

export interface CreateEventRequest {
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: string
  dateFin: string
  prix: number
  nbPlaces: number
  organisateur: string
  image?: string
  categories: string[]
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  statut?: EventStatus
}

export interface EventResponse {
  id: string
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: string
  dateFin: string
  prix: number
  nbPlaces: number
  placesRestantes: number
  statut: EventStatus
  organisateur: string
  image?: string | null
  createdAt: string
  updatedAt: string
  ticketsVendus?: number
  revenue?: number
}

export interface EventsListResponse {
  events: EventResponse[]
  total: number
  page: number
  totalPages: number
}

export interface EventsQueryParams {
  page?: number
  limit?: number
  search?: string
  lieu?: string
  status?: string
  sortBy?: 'date' | 'title' | 'price' | 'revenue'
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

// =============================================================================
// TYPES POUR LES BILLETS
// =============================================================================

export interface PurchaseTicketRequest {
  eventId: string
  quantity: number
  userInfo: {
    email: string
    nom: string
    prenom: string
    telephone?: string
  }
  createAccount?: boolean
  password?: string
  guestPurchase?: boolean
}

export interface TicketResponse {
  id: string
  numeroTicket: string
  qrCode: string
  statut: TicketStatus  // Maintenant compatible avec Prisma
  prix: number
  createdAt: string
  event: {
    id: string
    titre: string
    lieu: string
    dateDebut: string
    dateFin: string
  }
  user?: {
    id: string
    nom: string
    prenom: string
    email: string
  }
  guestInfo?: {
    email: string | null
    nom: string | null
    prenom: string | null
    telephone?: string | null
  }
}

// =============================================================================
// TYPES POUR LES UTILISATEURS
// =============================================================================

export interface UserResponse {
  id: string
  email: string
  nom: string
  prenom: string
  telephone?: string | null
  role: UserRole
  statut: UserStatus
  createdAt: string
  lastLogin?: string | null
  ticketsAchetes: number
  totalDepense: number
}

export interface UsersListResponse {
  users: UserResponse[]
  total: number
  page: number
  totalPages: number
}

export interface UsersQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
  status?: UserStatus
  sortBy?: 'created' | 'name' | 'email' | 'spent' | 'tickets'
  sortOrder?: 'asc' | 'desc'
}

export interface UpdateUserRequest {
  nom?: string
  prenom?: string
  telephone?: string | null
  role?: UserRole
  statut?: UserStatus
}

// =============================================================================
// TYPES POUR LES PAIEMENTS
// =============================================================================

export interface CreatePaymentIntentRequest {
  eventId: string
  quantity: number
  userInfo: PurchaseTicketRequest['userInfo']
}

export interface PaymentIntentResponse {
  clientSecret: string
  amount: number
  currency: string
}

export interface PaymentWebhookPayload {
  type: string
  data: {
    object: {
      id: string
      amount: number
      currency: string
      status: string
      metadata: {
        eventId: string
        quantity: string
        userEmail: string
      }
    }
  }
}

// =============================================================================
// TYPES POUR LES STATISTIQUES ET DASHBOARD
// =============================================================================

export interface DashboardStats {
  totalEvents: number
  totalTickets: number
  totalRevenue: number
  totalUsers: number
  todayTickets: number
  thisMonthRevenue: number
  activeEvents: number
  conversionRate: number
}

export interface RecentActivity {
  id: string
  type: 'ticket_sold' | 'event_created' | 'user_registered' | 'payment_received'
  description: string
  timestamp: string
  amount?: number
  userId?: string
  eventId?: string
}

export interface TopEvent {
  id: string
  title: string
  ticketsSold: number
  revenue: number
  date: string
}

export interface DashboardResponse {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  topEvents: TopEvent[]
}

// =============================================================================
// TYPES POUR LES RAPPORTS
// =============================================================================

export interface SalesReport {
  period: 'day' | 'week' | 'month' | 'year'
  startDate: string
  endDate: string
  totalRevenue: number
  totalTickets: number
  averageTicketPrice: number
  topEvents: TopEvent[]
  salesByDay: Array<{
    date: string
    revenue: number
    tickets: number
  }>
}

export interface EventAnalytics {
  eventId: string
  totalTickets: number
  revenue: number
  conversionRate: number
  salesByDay: Array<{
    date: string
    tickets: number
    revenue: number
  }>
  attendanceRate?: number
  refundRate?: number
}

// =============================================================================
// TYPES POUR LES ERREURS API
// =============================================================================

export interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: any
}

// =============================================================================
// TYPES POUR LES RÉPONSES GÉNÉRIQUES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

// =============================================================================
// TYPES POUR LA PAGINATION
// =============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// =============================================================================
// TYPES POUR LES FILTRES
// =============================================================================

export interface DateRange {
  from?: string
  to?: string
}

export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

// =============================================================================
// TYPES POUR L'UPLOAD DE FICHIERS
// =============================================================================

export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}

// =============================================================================
// TYPES POUR LES NOTIFICATIONS
// =============================================================================

export interface NotificationResponse {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  createdAt: string
  read: boolean
  userId: string
}

// =============================================================================
// TYPES POUR L'EXPORT DE DONNÉES
// =============================================================================

export interface ExportRequest {
  type: 'events' | 'users' | 'tickets' | 'sales'
  format: 'csv' | 'excel' | 'pdf'
  filters?: any
  dateRange?: DateRange
}

export interface ExportResponse {
  downloadUrl: string
  filename: string
  expiresAt: string
}

// =============================================================================
// UTILITAIRES DE TYPE
// =============================================================================

// Type guard pour vérifier les statuts
export function isValidTicketStatus(status: string): status is TicketStatus {
  return ['VALID', 'USED', 'CANCELLED', 'EXPIRED'].includes(status)
}

export function isValidEventStatus(status: string): status is EventStatus {
  return ['ACTIVE', 'INACTIVE', 'COMPLET', 'ANNULE'].includes(status)
}


export function isValidUserRole(role: string): role is UserRole {
  return ['USER', 'ADMIN'].includes(role)
}

export function isValidUserStatus(status: string): status is UserStatus {
  return ['ACTIVE', 'INACTIVE', 'BANNED'].includes(status)
}

// Utilitaire pour la conversion Prisma Decimal vers number
export type PrismaDecimal = {
  toString(): string
  toNumber(): number
}

export function toPrismaNumber(value: PrismaDecimal | number): number {
  return typeof value === 'number' ? value : Number(value.toString())
}

// Types pour les paramètres de route Next.js
export interface RouteParams<T = Record<string, string>> {
  params: T
}

// Types pour les réponses d'API avec metadata
export interface ApiResponseWithMeta<T> extends ApiResponse<T> {
  meta?: {
    timestamp: string
    version: string
    requestId: string
  }
}

// Types pour la validation des formulaires
export interface FormValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResponse {
  isValid: boolean
  errors: FormValidationError[]
}

// Types pour les webhooks
export interface WebhookPayload<T = any> {
  id: string
  type: string
  created: number
  data: T
  livemode: boolean
}

// Types pour les sessions utilisateur
export interface UserSession {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

// Types pour les réponses de recherche
export interface SearchResponse<T> {
  results: T[]
  query: string
  total: number
  page: number
  totalPages: number
  facets?: Record<string, Array<{ value: string; count: number }>>
}

// Type pour la conversion Prisma → API
export function mapTicketStatus(prismaStatus: string): TicketStatus {
  switch (prismaStatus) {
    case 'VALID':
      return 'VALID'
    case 'USED':
      return 'USED'
    case 'CANCELLED':
      return 'CANCELLED'
    case 'EXPIRED':
      return 'EXPIRED'
    default:
      return 'CANCELLED' // Fallback sécurisé
  }
}