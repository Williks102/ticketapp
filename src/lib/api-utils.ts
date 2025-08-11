// src/lib/api-utils.ts - VERSION CORRIGÉE COMPLÈTE
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
  role: 'USER' | 'ADMIN' | 'MODERATOR'
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

// ========================================
// UTILITAIRES POUR LES RÉPONSES API
// ========================================

export function createApiResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Africa/Abidjan',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date())
    },
    { status }
  )
}

export function createApiError(
  error: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
      details,
      timestamp: new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Africa/Abidjan',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date())
    },
    { status }
  )
}

// ========================================
// UTILITAIRES D'AUTHENTIFICATION
// ========================================

export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    return decoded
  } catch (error) {
    console.error('Erreur d\'authentification:', error)
    return null
  }
}

export function requireAdmin(user: JWTPayload): boolean {
  return user.role === 'ADMIN'
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h',
    issuer: 'ticketapp-ci',
    audience: 'ticketapp-users'
  })
}

// ========================================
// UTILITAIRES DE HACHAGE ET VALIDATION
// ========================================

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): string[] {
  const errors: string[] = []
  
  if (password.length < 8) {
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

export function validateIvorianPhone(phone: string): boolean {
  // Formats acceptés : +225 XX XX XX XX, 225XXXXXXXX, 0XXXXXXXX, XXXXXXXX
  const phoneRegex = /^(\+225|225|0)?[0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// ========================================
// UTILITAIRES DE VALIDATION DES DONNÉES
// ========================================

export function validateRequired(data: any, requiredFields: string[]): string[] {
  const errors: string[] = []
  
  for (const field of requiredFields) {
    if (!data || data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Le champ '${field}' est requis`)
    }
  }
  
  return errors
}

export function validateEventData(data: any): string[] {
  const errors: string[] = []
  
  // Validation des dates
  if (data.dateDebut && data.dateFin) {
    const debut = new Date(data.dateDebut)
    const fin = new Date(data.dateFin)
    
    if (debut >= fin) {
      errors.push('La date de fin doit être postérieure à la date de début')
    }
    
    if (debut < new Date()) {
      errors.push('La date de début ne peut pas être dans le passé')
    }
  }
  
  // Validation du prix (en centimes de FCFA)
  if (data.prix !== undefined) {
    const prix = typeof data.prix === 'string' ? 
      parseInt(data.prix) : data.prix
    if (isNaN(prix) || prix < 0) {
      errors.push('Le prix doit être un nombre positif')
    }
  }
  
  // Validation du nombre de places
  if (data.nbPlaces !== undefined) {
    const places = typeof data.nbPlaces === 'string' ? 
      parseInt(data.nbPlaces) : data.nbPlaces
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
      ticketId: ticketData.id || 'pending',
      eventId: ticketData.eventId,
      userId: ticketData.userId || 'guest',
      numeroTicket: ticketData.numeroTicket,
      timestamp: ticketData.timestamp || Date.now()
    })
    
    return await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error)
    throw new Error('Impossible de générer le QR code')
  }
}

// ========================================
// UTILITAIRES DE PAGINATION
// ========================================

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
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
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [API Error]${context ? ` ${context}:` : ''} ${message}`, error || '')
}

export function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [API Info] ${message}`, data || '')
}

export function sanitizeString(str: string): string {
  return str.trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

export function normalizePhoneNumber(phone: string): string {
  // Normalise les numéros de téléphone ivoiriens au format +225XXXXXXXX
  const cleaned = phone.replace(/\s/g, '')
  
  if (cleaned.startsWith('+225')) {
    return cleaned
  } else if (cleaned.startsWith('225')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0') && cleaned.length === 9) {
    return `+225${cleaned.substring(1)}`
  } else if (cleaned.length === 8) {
    return `+225${cleaned}`
  }
  
  return phone // Retourner tel quel si format non reconnu
}

// ========================================
// UTILITAIRES POUR LES PRIX (FCFA)
// ========================================

export function formatPriceFCFA(priceInCents: number): string {
  const priceInFCFA = priceInCents / 100
  return `${priceInFCFA.toLocaleString('fr-FR')} FCFA`
}

export function parsePriceFromFCFA(fcfaPrice: number): number {
  return Math.round(fcfaPrice * 100)
}

// ========================================
// VALIDATION DES FICHIERS UPLOADÉS
// ========================================

export function validateImageFile(file: File): string[] {
  const errors: string[] = []
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (file.size > maxSize) {
    errors.push('La taille du fichier ne doit pas dépasser 5MB')
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Format de fichier non supporté. Utilisez JPEG, PNG ou WebP')
  }
  
  return errors
}

// ========================================
// UTILITAIRES TEMPORELS
// ========================================

export function getIvorianDate(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Abidjan"}))
}

export function formatIvorianDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Abidjan',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}