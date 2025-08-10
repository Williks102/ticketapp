// Types pour l'authentification
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
    role: 'USER' | 'ADMIN'
  }
  token: string
}

// Types pour les événements
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
  statut?: 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE'
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
  statut: 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE'
  organisateur: string
  image?: string
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

// Types pour les billets
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
  statut: 'VALID' | 'USED' | 'CANCELLED'
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
    email: string
    nom: string
    prenom: string
    telephone?: string
  }
}

export interface ValidateTicketRequest {
  ticketCode: string
  eventId?: string
}

export interface ValidateTicketResponse {
  success: boolean
  ticket?: TicketResponse
  message: string
  scannedAt?: string
}

// Types pour les utilisateurs
export interface UserResponse {
  id: string
  email: string
  nom: string
  prenom: string
  telephone?: string
  role: 'USER' | 'ADMIN'
  statut: 'ACTIVE' | 'INACTIVE' | 'BANNED'
  createdAt: string
  lastLogin?: string
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
  role?: 'USER' | 'ADMIN'
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED'
  sortBy?: 'created' | 'name' | 'email' | 'spent' | 'tickets'
  sortOrder?: 'asc' | 'desc'
}

export interface UpdateUserRequest {
  nom?: string
  prenom?: string
  telephone?: string
  role?: 'USER' | 'ADMIN'
  statut?: 'ACTIVE' | 'INACTIVE' | 'BANNED'
}

// Types pour les paiements
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

// Types pour les statistiques et dashboard
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

// Types pour les rapports
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

// Types pour les erreurs API
export interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: any
}

// Types pour les réponses génériques
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

// Types pour la pagination
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

// Types pour les filtres
export interface DateRange {
  from?: string
  to?: string
}

export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

// Types pour l'upload de fichiers
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}

// Types pour les notifications
export interface NotificationResponse {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  createdAt: string
  read: boolean
  userId: string
}

// Types pour l'export de données
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