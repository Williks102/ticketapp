import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { ApiError, ApiResponse } from '@/types/api'

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Types pour l'authentification
export interface JWTPayload {
  userId: string
  email: string
  role: 'USER' | 'ADMIN'
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

// Utilitaires pour les réponses API
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

// Middleware d'authentification
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

// Middleware pour vérifier les permissions admin
export function requireAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'ADMIN'
}

// Utilitaire pour extraire les paramètres de query
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

// Utilitaire pour la pagination
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

// Utilitaire pour calculer les métadonnées de pagination
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

// Utilitaire pour valider les données
export function validateRequired(data: any, fields: string[]): string[] {
  const errors: string[] = []
  
  fields.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors.push(`Le champ ${field} est requis`)
    }
  })
  
  return errors
}

// Utilitaire pour valider l'email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utilitaire pour valider le mot de passe
export function validatePassword(password: string): string[] {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères')
  }
  
  return errors
}

// Utilitaire pour générer un token JWT
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// Utilitaires pour hasher les mots de passe
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Utilitaire pour générer des numéros de billets uniques
export function generateTicketNumber(): string {
  const prefix = 'TKT'
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  
  return `${prefix}-${year}-${timestamp}${random}`
}

// Utilitaire pour générer des QR codes
export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
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
    throw new Error('Erreur lors de la génération du QR code')
  }
}

// Utilitaire pour formater les dates
export function formatDate(date: Date): string {
  return date.toISOString()
}

export function parseDate(dateString: string): Date {
  return new Date(dateString)
}

// Utilitaire pour les calculs financiers
export function calculateRevenue(tickets: Array<{ prix: number }>): number {
  return tickets.reduce((total, ticket) => total + ticket.prix, 0)
}

export function calculateConversionRate(visitors: number, purchases: number): number {
  if (visitors === 0) return 0
  return (purchases / visitors) * 100
}

// Utilitaire pour le logging
export function logError(error: any, context?: string) {
  console.error(`[API Error]${context ? ` ${context}:` : ''} `, error)
}

export function logInfo(message: string, data?: any) {
  console.log(`[API Info] ${message}`, data || '')
}

// Utilitaire pour la sanitisation des données
export function sanitizeString(str: string): string {
  return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

// Utilitaire pour les limites de taux (rate limiting)
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

// Utilitaire pour les webhooks
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

// Utilitaire pour les uploads de fichiers
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

// Utilitaire pour les réponses CORS
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

// Utilitaire pour les erreurs de validation Prisma
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