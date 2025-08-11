// src/lib/api-utils.ts - VERSION COMPLÈTE POUR CÔTE D'IVOIRE
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { ApiError, ApiResponse } from '@/types/api'

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// ========================================
// TYPES ET INTERFACES
// ========================================

export interface JWTPayload {
  userId: string
  email: string
  role: 'USER' | 'ADMIN'
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

export interface ValidateTicketResponse {
  success: boolean
  ticket?: any
  message: string
}

export interface DashboardStats {
  totalEvents: number
  totalTicketsSold: number
  totalRevenue: number
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
// UTILITAIRES POUR LES RÉPONSES API
// ========================================

export function createApiResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  )
}

export function createApiError(
  error: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        error,
        message,
        statusCode: status,
        details
      }
    },
    { status }
  )
}

// ========================================
// AUTHENTIFICATION ET AUTORISATION
// ========================================

export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export function requireAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'ADMIN'
}

export function generateToken(payload: JWTPayload, expiresIn: string = '24h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

// ========================================
// GESTION DES MOTS DE PASSE
// ========================================

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Erreur lors de la comparaison du mot de passe:', error)
    return false
  }
}

export function validatePassword(password: string): string[] {
  const errors: string[] = []
  
  if (!password || password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }
  
  return errors
}

// ========================================
// UTILITAIRES POUR EXTRAIRE LES PARAMÈTRES
// ========================================

export function extractQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params: Record<string, string | string[]> = {}
  
  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  })
  
  return params
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

export function extractSearchFilters(searchParams: URLSearchParams) {
  return {
    search: searchParams.get('search')?.trim() || undefined,
    category: searchParams.get('category') || undefined,
    location: searchParams.get('lieu') || searchParams.get('location') || undefined,
    status: searchParams.get('status') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const paginationMeta = createPaginationMeta(total, page, limit)
  
  return {
    data,
    ...paginationMeta
  }
}

// ========================================
// VALIDATION DES DONNÉES
// ========================================

export function validateRequired(data: any, fields: string[]): string[] {
  const errors: string[] = []
  
  fields.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors.push(`Le champ ${field} est requis`)
    }
  })
  
  return errors
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide un numéro de téléphone ivoirien
 * @param phone Numéro de téléphone
 * @returns True si valide
 */
export function validateIvorianPhone(phone: string): boolean {
  // Formats acceptés pour la Côte d'Ivoire:
  // +225 XX XXX XXX (nouveau format 10 chiffres depuis 2021)
  // 00225 XX XXX XXX
  // 0X XXX XXX (format local)
  // Préfixes mobiles: 01, 05, 06, 07, 08, 09
  // Préfixes fixes: 21, 22, 23, 24, 25, 27
  
  const cleanPhone = phone.replace(/[\s\-\.]/g, '')
  
  // Format international complet
  const intlRegex = /^(\+225|00225)(0[1567890]|2[1-57])\d{6}$/
  
  // Format local (commence par 0)
  const localRegex = /^(0[1567890]|2[1-57])\d{6}$/
  
  return intlRegex.test(cleanPhone) || localRegex.test(cleanPhone)
}

export function validateEventData(data: any): string[] {
  const errors: string[] = []
  
  // Validation des champs requis
  const requiredFields = ['titre', 'description', 'lieu', 'adresse', 'dateDebut', 'dateFin', 'prix', 'nbPlaces', 'organisateur']
  errors.push(...validateRequired(data, requiredFields))
  
  // Validation des dates
  if (data.dateDebut && data.dateFin) {
    const debut = new Date(data.dateDebut)
    const fin = new Date(data.dateFin)
    const maintenant = new Date()
    
    if (debut <= maintenant) {
      errors.push('La date de début doit être dans le futur')
    }
    
    if (fin <= debut) {
      errors.push('La date de fin doit être après la date de début')
    }
  }
  
  // Validation du prix (en centimes de FCFA)
  if (data.prix !== undefined) {
    const prix = typeof data.prix === 'string' ? parseInt(data.prix) : data.prix
    if (isNaN(prix) || prix < 0) {
      errors.push('Le prix doit être un nombre positif')
    }
  }
  
  // Validation du nombre de places
  if (data.nbPlaces !== undefined) {
    const places = typeof data.nbPlaces === 'string' ? parseInt(data.nbPlaces) : data.nbPlaces
    if (isNaN(places) || places < 1) {
      errors.push('Le nombre de places doit être un nombre positif')
    }
  }
  
  return errors
}

export function validateUserData(data: any): string[] {
  const errors: string[] = []
  
  // Validation email
  if (data.email && !validateEmail(data.email)) {
    errors.push('Adresse email invalide')
  }
  
  // Validation téléphone ivoirien (optionnel mais doit être valide si fourni)
  if (data.telephone && !validateIvorianPhone(data.telephone)) {
    errors.push('Numéro de téléphone ivoirien invalide')
  }
  
  // Validation nom et prénom
  if (data.nom && data.nom.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères')
  }
  
  if (data.prenom && data.prenom.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères')
  }
  
  return errors
}

// ========================================
// GÉNÉRATION DE BILLETS
// ========================================

export function generateTicketNumber(prefix: string = 'TKT'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${timestamp}-${random}`
}

export async function generateQRCode(ticketData: any): Promise<string> {
  try {
    const dataString = JSON.stringify({
      ticketId: ticketData.id,
      eventId: ticketData.eventId,
      userId: ticketData.userId,
      numeroTicket: ticketData.numeroTicket,
      timestamp: Date.now()
    })
    
    return await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error)
    throw new Error('Impossible de générer le QR code')
  }
}

// ========================================
// UTILITAIRES DIVERS
// ========================================

export function toPrismaNumber(value: number | string): number {
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? 0 : parsed
  }
  return Math.round(value)
}

export function logError(message: string, error?: any, context?: string) {
  console.error(`[API Error]${context ? ` ${context}:` : ''} ${message}`, error || '')
}

export function logInfo(message: string, data?: any) {
  console.log(`[API Info] ${message}`, data || '')
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

// ========================================
// RATE LIMITING
// ========================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const current = rateLimitMap.get(key)
  
  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

// ========================================
// WEBHOOKS ET SIGNATURES
// ========================================

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return signature === `sha256=${expectedSignature}`
}

// ========================================
// VALIDATION DES UPLOADS
// ========================================

export function validateFileUpload(file: File): string[] {
  const errors: string[] = []
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  
  if (file.size > maxSize) {
    errors.push('Le fichier ne doit pas dépasser 5MB')
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Format de fichier non supporté (JPG, PNG, GIF, WebP uniquement)')
  }
  
  return errors
}

// ========================================
// CORS ET HEADERS
// ========================================

export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

// ========================================
// GESTION D'ERREURS PRISMA
// ========================================

export function handlePrismaError(error: any): { message: string; status: number } {
  if (error.code === 'P2002') {
    return {
      message: 'Une entrée avec ces données existe déjà',
      status: 409
    }
  }
  
  if (error.code === 'P2025') {
    return {
      message: 'Enregistrement non trouvé',
      status: 404
    }
  }
  
  return {
    message: 'Erreur de base de données',
    status: 500
  }
}

export function withErrorHandling(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error) {
      logError('Erreur dans le handler API', error)
      
      // Gestion spécifique des erreurs Prisma
      if (error && typeof error === 'object' && 'code' in error) {
        const { message, status } = handlePrismaError(error)
        return createApiError('DATABASE_ERROR', message, status)
      }
      
      // Erreur générique
      return createApiError(
        'INTERNAL_ERROR',
        'Une erreur interne s\'est produite',
        500
      )
    }
  }
}

// ========================================
// CONSTANTES SPÉCIFIQUES À LA CÔTE D'IVOIRE
// ========================================

export const COTE_IVOIRE_CONFIG = {
  COUNTRY_CODE: '+225',
  TIMEZONE: 'Africa/Abidjan',
  CURRENCY: 'XOF',
  CURRENCY_SYMBOL: 'FCFA',
  LANGUAGE: 'fr-FR',
  
  // Préfixes téléphoniques
  MOBILE_PREFIXES: ['01', '05', '06', '07', '08', '09'],
  LANDLINE_PREFIXES: ['21', '22', '23', '24', '25', '27'],
  
  // Limites pour les événements
  MAX_EVENT_DURATION_DAYS: 30,
  MIN_TICKET_PRICE_FCFA: 500, // 5 FCFA minimum
  MAX_TICKET_PRICE_FCFA: 50000000, // 500,000 FCFA maximum
  
  // Validation
  MIN_AGE_FOR_ACCOUNT: 13,
  MAX_EVENTS_PER_USER: 50,
  MAX_TICKETS_PER_PURCHASE: 10
} as const

export const API_CONSTANTS = {
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DEFAULT_PAGINATION_LIMIT: 10,
  MAX_PAGINATION_LIMIT: 100,
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d'
} as const