// src/types/api.ts - VERSION CORRIGÉE

// =============================================================================
// TYPES STRICTS POUR LES STATUTS (synchronisés avec Prisma)
// =============================================================================

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE' | 'TERMINE'
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED' | 'EXPIRED'
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING'

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

// =============================================================================
// TYPES POUR LA VALIDATION DES BILLETS
// =============================================================================

export interface ValidateTicketRequest {
  ticketCode: string // numeroTicket ou QR code
  eventId?: string // Optionnel pour vérifier l'événement spécifique
}

export interface ValidateTicketResponse {
  success: boolean
  message: string
  ticket?: TicketResponse
  validationInfo?: {
    validatedAt: string
    validatedBy: string
  }
}

export interface TicketResponse {
  id: string
  numeroTicket: string
  qrCode: string
  statut: TicketStatus
  prix: number
  validatedAt?: string | null
  validatedBy?: string | null
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

export interface TicketsListResponse {
  tickets: TicketResponse[]
  total: number
  page: number
  totalPages: number
}

export interface TicketsQueryParams {
  page?: number
  limit?: number
  search?: string
  eventId?: string
  userId?: string
  status?: TicketStatus
  sortBy?: 'created' | 'event' | 'price' | 'status'
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

// =============================================================================
// TYPES POUR LA VALIDATION DES BILLETS
// =============================================================================

export interface ValidateTicketRequest {
  ticketCode: string // numeroTicket ou QR code
}

export interface ValidateTicketResponse {
  success: boolean
  message: string
  ticket?: TicketResponse
  validationInfo?: {
    validatedAt: string
    validatedBy: string
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
// TYPES GÉNÉRIQUES POUR LES RÉPONSES API
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
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

export interface ExportRequest {
  type: 'tickets' | 'users' | 'events' | 'sales'
  format: 'csv' | 'xlsx' | 'pdf'
  filters?: any
  dateRange?: {
    from: string
    to: string
  }
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
  return ['DRAFT', 'ACTIVE', 'INACTIVE', 'COMPLET', 'ANNULE', 'TERMINE'].includes(status)
}

export function isValidUserRole(role: string): role is UserRole {
  return ['USER', 'ADMIN', 'MODERATOR'].includes(role)
}

export function isValidUserStatus(status: string): status is UserStatus {
  return ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'].includes(status)
}

// Utilitaire pour la conversion Prisma Decimal vers number
export type PrismaDecimal = {
  toString(): string
  toNumber(): number
}

export function toPrismaNumber(value: PrismaDecimal | number): number {
  return typeof value === 'number' ? value : Number(value.toString())
}

// Helper pour mapper les types Prisma vers les types API
export function mapPrismaTicketToApi(prismaTicket: any): TicketResponse {
  return {
    id: prismaTicket.id,
    numeroTicket: prismaTicket.numeroTicket,
    qrCode: prismaTicket.qrCode,
    statut: prismaTicket.statut as TicketStatus,
    prix: toPrismaNumber(prismaTicket.prix),
    validatedAt: prismaTicket.validatedAt?.toISOString() || null,
    validatedBy: prismaTicket.validatedBy || null,
    createdAt: prismaTicket.createdAt.toISOString(),
    event: {
      id: prismaTicket.event.id,
      titre: prismaTicket.event.titre,
      lieu: prismaTicket.event.lieu,
      dateDebut: prismaTicket.event.dateDebut.toISOString(),
      dateFin: prismaTicket.event.dateFin.toISOString()
    },
    user: prismaTicket.user ? {
      id: prismaTicket.user.id,
      nom: prismaTicket.user.nom,
      prenom: prismaTicket.user.prenom,
      email: prismaTicket.user.email
    } : undefined,
    guestInfo: !prismaTicket.user ? {
      email: prismaTicket.guestEmail,
      nom: prismaTicket.guestNom,
      prenom: prismaTicket.guestPrenom,
      telephone: prismaTicket.guestTelephone
    } : undefined
  }
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