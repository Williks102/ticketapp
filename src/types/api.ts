// src/types/api.ts - VERSION CORRIGÉE
// ========================================
// TYPES DE BASE
// ========================================

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING'
export type EventStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE' | 'TERMINE'
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED' | 'EXPIRED'
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
export type ActivityType = 'USER_ACTION' | 'ADMIN_ACTION' | 'SYSTEM_ACTION' | 'PAYMENT_ACTION' | 'VALIDATION_ACTION'

// ========================================
// INTERFACES UTILISATEUR
// ========================================

export interface UserResponse {
  id: string
  email: string
  nom: string
  prenom: string
  telephone?: string | null
  role: UserRole
  statut: UserStatus
  createdAt: string
  updatedAt: string
  lastLogin?: string | null
}

export interface CreateUserRequest {
  email: string
  nom: string
  prenom: string
  telephone?: string
  password: string
  role?: UserRole
}

export interface UpdateUserRequest {
  nom?: string
  prenom?: string
  telephone?: string
  email?: string
  role?: UserRole
  statut?: UserStatus
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserResponse
  token: string
  expiresIn: number
}

// ========================================
// INTERFACES ÉVÉNEMENTS
// ========================================

export interface EventResponse {
  id: string
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: string // ISO string
  dateFin: string   // ISO string
  prix: number      // Prix en centimes de FCFA
  nbPlaces: number
  placesRestantes: number
  statut: EventStatus
  organisateur: string
  image?: string | null
  categories?: string[] // Array de catégories
  createdAt: string
  updatedAt: string
  
  // Statistiques calculées
  ticketsVendus?: number
  revenue?: number // Revenue en centimes de FCFA
}

export interface EventsListResponse {
  events: EventResponse[]
  total: number
  page: number
  totalPages: number
  filters?: {
    search?: string
    category?: string
    location?: string
    priceMin?: number
    priceMax?: number
    dateFrom?: string
    dateTo?: string
    status?: EventStatus
  }
}

export interface CreateEventRequest {
  titre: string
  description: string
  lieu: string
  adresse: string
  dateDebut: string // ISO string
  dateFin: string   // ISO string
  prix: number      // Prix en centimes de FCFA
  nbPlaces: number
  organisateur: string
  image?: string
  categories?: string[]
}

export interface UpdateEventRequest {
  titre?: string
  description?: string
  lieu?: string
  adresse?: string
  dateDebut?: string
  dateFin?: string
  prix?: number
  nbPlaces?: number
  organisateur?: string
  image?: string
  statut?: EventStatus
  categories?: string[]
}

// ========================================
// INTERFACES BILLETS
// ========================================

export interface TicketResponse {
  id: string
  numeroTicket: string
  qrCode: string
  statut: TicketStatus
  prix: number // Prix en centimes de FCFA
  validatedAt?: string | null
  validatedBy?: string | null
  createdAt: string
  updatedAt: string
  
  // Relations
  event: EventResponse
  user?: UserResponse | null
  
  // Info invité (si pas d'utilisateur)
  guestEmail?: string | null
  guestNom?: string | null
  guestPrenom?: string | null
  guestTelephone?: string | null
}

export interface TicketsListResponse {
  tickets: TicketResponse[]
  total: number
  page: number
  totalPages: number
}

export interface CreateTicketRequest {
  eventId: string
  quantity: number
  userId?: string
  
  // Info invité
  guestEmail?: string
  guestNom?: string
  guestPrenom?: string
  guestTelephone?: string
}

export interface ValidateTicketRequest {
  numeroTicket: string
  validatedBy: string
}

export interface ValidateTicketResponse {
  success: boolean
  ticket?: TicketResponse
  message: string
}

// ========================================
// INTERFACES STATISTIQUES
// ========================================

export interface DashboardStats {
  totalEvents: number
  totalTicketsSold: number
  totalRevenue: number // En centimes de FCFA
  activeEvents: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

export interface TopEvent {
  id: string
  title: string
  ticketsSold: number
  revenue: number
  date: string
}

export interface DashboardStatsResponse {
  stats: DashboardStats
  recentEvents: EventResponse[]
  topEvents: TopEvent[]
  recentActivity: RecentActivity[]
}

export interface EventStatsResponse {
  id: string
  eventId: string
  ticketsSold: number
  revenue: number // En centimes de FCFA
  conversionRate: number
  averagePrice: number // En centimes de FCFA
  peakSalesDay?: string | null
  lastUpdated: string
  
  // Données graphiques
  salesByDay?: Array<{
    date: string
    sales: number
    revenue: number
  }>
  hourlyStats?: Array<{
    hour: number
    sales: number
    revenue: number
  }>
}

export interface SalesReport {
  totalSales: number
  totalRevenue: number
  period: string
  events: Array<{
    eventId: string
    eventTitle: string
    sales: number
    revenue: number
  }>
}

// ========================================
// INTERFACES PAIEMENTS
// ========================================

export interface PaymentResponse {
  id: string
  stripePaymentId: string
  amount: number // En centimes de FCFA
  currency: string
  status: PaymentStatus
  eventId: string
  customerEmail: string
  customerName?: string | null
  refundedAmount?: number | null
  refundedAt?: string | null
  refundReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentRequest {
  eventId: string
  quantity: number
  customerEmail: string
  customerName?: string
  
  // Info invité si pas de compte
  guestNom?: string
  guestPrenom?: string
  guestTelephone?: string
}

export interface PurchaseTicketRequest {
  eventId: string
  quantity: number
  customerInfo: {
    email: string
    nom: string
    prenom: string
    telephone?: string
  }
  userId?: string
}

// ========================================
// INTERFACES LOGS D'ACTIVITÉ
// ========================================

export interface ActivityLogResponse {
  id: string
  type: ActivityType
  entity: string
  entityId: string
  action: string
  oldData?: any
  newData?: any
  metadata?: any
  userId?: string | null
  user?: UserResponse | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

// ========================================
// INTERFACES GÉNÉRIQUES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams extends PaginationParams {
  search?: string
  filters?: Record<string, any>
}

// ========================================
// INTERFACES CLOUDINARY
// ========================================

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
  url: string
  etag: string
  signature: string
  version: number
  version_id: string
  folder?: string
}

export interface UploadApiResponse {
  imageUrl: string
  publicId: string
  width: number
  height: number
}

// ========================================
// FONCTION UTILITAIRE POUR PRISMA
// ========================================

/**
 * Convertit un nombre en format compatible Prisma (nombre entier)
 * @param value Valeur à convertir
 * @returns Nombre entier
 */
export function toPrismaNumber(value: number): number {
  return Math.round(value)
}

// ========================================
// UTILITAIRES MONÉTAIRES FCFA
// ========================================

/**
 * Formate un prix en centimes de FCFA vers un affichage lisible
 * @param priceInCents Prix en centimes de FCFA
 * @returns String formaté (ex: "21 000 FCFA")
 */
export function formatPrice(priceInCents: number): string {
  const priceInFCFA = priceInCents / 100
  return `${priceInFCFA.toLocaleString('fr-FR')} FCFA`
}

/**
 * Formate un prix avec le symbole de devise international
 * @param priceInCents Prix en centimes de FCFA
 * @returns String formaté avec Intl.NumberFormat
 */
export function formatPriceIntl(priceInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(priceInCents / 100)
}

/**
 * Convertit un prix en FCFA vers des centimes
 * @param fcfaPrice Prix en FCFA
 * @returns Prix en centimes
 */
export function parsePriceToMoney(fcfaPrice: number): number {
  return Math.round(fcfaPrice * 100)
}

/**
 * Convertit des centimes vers des FCFA
 * @param priceInCents Prix en centimes
 * @returns Prix en FCFA
 */
export function centsToFCFA(priceInCents: number): number {
  return priceInCents / 100
}

// ========================================
// UTILITAIRES DATES
// ========================================

/**
 * Formate une date d'événement
 * @param dateString Date ISO string
 * @returns Date formatée (ex: "lundi 15 décembre 2025 à 20:00")
 */
export function formatEventDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

/**
 * Formate uniquement l'heure
 * @param dateString Date ISO string
 * @returns Heure formatée (ex: "20:00")
 */
export function formatEventTime(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

/**
 * Formate une date courte
 * @param dateString Date ISO string
 * @returns Date courte (ex: "15 déc 2025")
 */
export function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString))
}

// ========================================
// UTILITAIRES VALIDATION
// ========================================

/**
 * Valide un email
 * @param email Email à valider
 * @returns True si valide
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide un numéro de téléphone sénégalais
 * @param phone Numéro de téléphone
 * @returns True si valide
 */
export function isValidSenegalPhone(phone: string): boolean {
  // Format: +221 XX XXX XX XX ou 77/78/70/76/75 XXX XX XX
  const phoneRegex = /^(\+221|00221)?[67][0-8]\d{3}\d{2}\d{2}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Valide une date d'événement
 * @param dateString Date à valider
 * @returns True si la date est dans le futur
 */
export function isValidEventDate(dateString: string): boolean {
  const eventDate = new Date(dateString)
  const now = new Date()
  return eventDate > now
}

// ========================================
// CONSTANTES
// ========================================

export const CURRENCIES = {
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA (BCEAO)',
    decimals: 0
  }
} as const

export const EVENT_CATEGORIES = [
  'Concerts',
  'Théâtre', 
  'Festivals',
  'Expositions',
  'Spectacles',
  'Gastronomie',
  'Conférences',
  'Sport',
  'Cinéma',
  'Art',
  'Culture',
  'Musique',
  'Danse',
  'Technologie',
  'Business',
  'Famille'
] as const

export const PAGINATION_LIMITS = {
  DEFAULT: 10,
  EVENTS: 12,
  TICKETS: 20,
  USERS: 15,
  MAX: 100
} as const