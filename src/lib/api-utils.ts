// src/lib/api-utils.ts - VERSION COMPLÈTE CORRIGÉE
// Résout les problèmes : regex [05 07], événements gratuits, validations trop strictes

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import { JWTPayload } from '@/types/api'

// ========================================
// CONSTANTES ET CONFIGURATION
// ========================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const SALT_ROUNDS = 12

// ========================================
// TYPES ET INTERFACES
// ========================================



interface ApiErrorResponse {
  success: false
  error: {
    type: string
    message: string
    details?: string[]
  }
  timestamp: string
}

interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
}

// ========================================
// UTILITAIRES DE RÉPONSE API
// ========================================

export function createApiResponse<T>(
  data: T, 
  status: number = 200, 
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status })
}

export function createApiError(
  type: string,
  message: string,
  status: number = 400,
  details?: string[]
): NextResponse<ApiErrorResponse> {
  const error: ApiErrorResponse = {
    success: false,
    error: {
      type,
      message,
      details
    },
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(error, { status })
}

// ========================================
// AUTHENTIFICATION ET SÉCURITÉ
// ========================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  return verifyToken(token)
}

export function requireAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'ADMIN'
}

// ========================================
// VALIDATIONS CORRIGÉES
// ========================================

// ✅ CORRIGÉ : Email regex complète (était tronquée)
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
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

// ✅ CORRIGÉ : Validation téléphone assouplie - résout problème [05 07]
export function validateIvorianPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true // Optionnel
  
  // Nettoyage : enlever tous les caractères non-numériques sauf +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Patterns très permissifs pour différents formats
  const patterns = [
    /^\+225\d{8,10}$/,      // +225xxxxxxxx (international)
    /^225\d{8,10}$/,        // 225xxxxxxxx 
    /^0\d{8,9}$/,           // 0xxxxxxxx (local avec 0)
    /^\d{8,10}$/,           // xxxxxxxx (numéro simple)
    /^(05|06|07)\d{7,9}$/   // ✅ RÉSOUT le problème [05 07] - commence par 05,06,07
  ]
  
  return patterns.some(pattern => pattern.test(cleaned))
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

// ✅ CORRIGÉ : Validation événements - PERMET PRIX GRATUITS
export function validateEventData(data: any): string[] {
  const errors: string[] = []
  
  // Validation des dates (assouplie)
  if (data.dateDebut && data.dateFin) {
    const debut = new Date(data.dateDebut)
    const fin = new Date(data.dateFin)
    
    if (debut >= fin) {
      errors.push('La date de fin doit être postérieure à la date de début')
    }
    
    // ✅ ASSOUPLI : Permettre les événements passés (pour import/migration)
    // if (debut < new Date()) {
    //   errors.push('La date de début ne peut pas être dans le passé')
    // }
  }
  
  // ✅ CORRIGÉ : PRIX GRATUITS AUTORISÉS (prix >= 0)
  if (data.prix !== undefined && data.prix !== null && data.prix !== '') {
    const prix = typeof data.prix === 'string' ? 
      parseFloat(data.prix.replace(/[^\d.,]/g, '').replace(',', '.')) : data.prix
    if (isNaN(prix) || prix < 0) {
      errors.push('Le prix doit être un nombre positif ou zéro (gratuit)')
    }
  }
  
  // Validation du nombre de places
  if (data.nbPlaces !== undefined) {
    const places = typeof data.nbPlaces === 'string' ? 
      parseInt(data.nbPlaces.replace(/[^\d]/g, '')) : data.nbPlaces
    if (isNaN(places) || places < 1) {
      errors.push('Le nombre de places doit être un nombre positif')
    }
  }
  
  return errors
}

// ✅ CORRIGÉ : Validation utilisateur assouplie
export function validateUserData(data: any): string[] {
  const errors: string[] = []
  
  // Validation email
  if (data.email && !validateEmail(data.email)) {
    errors.push('Adresse email invalide')
  }
  
  // ✅ TÉLÉPHONE NON-BLOQUANT (résout problème [05 07])
  if (data.telephone && data.telephone.trim() !== '') {
    if (!validateIvorianPhone(data.telephone)) {
      // Avertissement plutôt qu'erreur bloquante
      console.warn(`Numéro de téléphone format non standard: ${data.telephone}`)
      // Ne pas bloquer la validation - juste log
    }
  }
  
  // Validation nom et prénom (garde compatibilité avec profile/route.ts)
  if (data.nom && data.nom.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères')
  }
  
  if (data.prenom && data.prenom.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères')
  }
  
  return errors
}

// ========================================
// GÉNÉRATION DE BILLETS - CORRIGÉE
// ========================================

export function generateTicketNumber(prefix: string = 'TKT'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${timestamp}-${random}`
}

// ✅ CORRIGÉ : était "void & Promise<string>"
export async function generateQRCode(ticketData: any): Promise<string> {
  try {
    const dataString = JSON.stringify({
      ticketId: ticketData.id || 'pending',
      eventId: ticketData.eventId,
      userId: ticketData.userId || 'guest',
      numeroTicket: ticketData.numeroTicket,
      timestamp: ticketData.timestamp || Date.now()
    })
    
    // ✅ CORRIGÉ : QRCode.toDataURL retourne Promise<string>, pas void
    const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })
    
    return qrCodeDataUrl
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
// UTILITAIRES DIVERS CORRIGÉS
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

// ✅ CORRIGÉ : Normalisation téléphone plus flexible (gère [05 07])
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Nettoyage de base
  const cleaned = phone.replace(/[\s\-\.()]/g, '')
  
  // ✅ GESTION DES NUMÉROS [05 06 07] IVOIRIENS
  if (/^(05|06|07)\d{7,8}$/.test(cleaned)) {
    return `+225${cleaned}`
  }
  
  // Normalisation standard
  if (cleaned.startsWith('+225')) {
    return cleaned
  } else if (cleaned.startsWith('225')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0') && cleaned.length >= 8) {
    return `+225${cleaned.substring(1)}`
  } else if (cleaned.length >= 7 && cleaned.length <= 10) {
    return `+225${cleaned}`
  }
  
  // Si format non reconnu, retourner tel quel (pas d'erreur)
  return phone
}

// ========================================
// UTILITAIRES POUR LES PRIX (FCFA)
// ========================================

export function formatPriceFCFA(priceInCents: number): string {
  if (priceInCents === 0) {
    return 'GRATUIT'
  }
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

// ========================================
// NOUVELLES FONCTIONS - VALIDATION FLEXIBLE
// ========================================








// ✅ NOUVEAU : Validation flexible pour import/migration
export function validateUserDataFlexible(data: any, strict: boolean = false): string[] {
  if (strict) {
    return validateUserData(data) // Mode strict existant
  }
  
  // Mode ultra-souple pour import de données
  const errors: string[] = []
  
  // Seulement les validations critiques
  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    errors.push('Email invalide')
  }
  
  return errors
}

// ✅ NOUVEAU : Helper pour affichage prix (gère gratuit)
export function formatEventPrice(price: number): string {
  if (price === 0) {
    return 'GRATUIT'
  }
  return `${(price / 100).toLocaleString('fr-FR')} FCFA`
}


// ✅ Vérifier si un événement est gratuit
export function isEventFree(price: number): boolean {
  return price === 0
}

// ✅ Vérifier si un utilisateur peut réserver un événement gratuit
export function canReserveFreeEvent(event: any, userId?: string): {
  canReserve: boolean
  reason?: string
} {
  if (!isEventFree(event.prix)) {
    return { canReserve: false, reason: 'Événement non gratuit' }
  }

  if (event.statut !== 'ACTIVE') {
    return { canReserve: false, reason: 'Événement non disponible' }
  }

  if (event.placesRestantes <= 0) {
    return { canReserve: false, reason: 'Plus de places disponibles' }
  }

  // Vérifier que l'événement n'est pas dans le passé
  const eventDate = new Date(event.dateDebut)
  const now = new Date()
  if (eventDate <= now) {
    return { canReserve: false, reason: 'Événement déjà passé' }
  }

  return { canReserve: true }
}

// ✅ Formater le texte du bouton d'action selon le type d'événement
export function getEventActionText(event: any, loading: boolean = false): string {
  if (loading) return 'En cours...'
  
  if (event.statut !== 'ACTIVE') return 'Indisponible'
  if (event.placesRestantes <= 0) return 'Complet'
  
  if (isEventFree(event.prix)) {
    return 'Réserver gratuitement'
  }
  
  return `Acheter - ${formatEventPrice(event.prix)}`
}

// ✅ Obtenir la classe CSS du bouton d'action
export function getEventActionButtonClass(event: any, loading: boolean = false): string {
  const baseClass = "w-full py-2 px-4 rounded-md font-medium text-sm transition-colors duration-200"
  
  if (event.statut !== 'ACTIVE' || event.placesRestantes <= 0) {
    return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`
  }
  
  if (loading) {
    return `${baseClass} bg-gray-400 text-white cursor-not-allowed`
  }
  
  if (isEventFree(event.prix)) {
    return `${baseClass} bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500`
  }
  
  return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500`
}

// ✅ Obtenir la classe CSS du badge de prix
export function getPriceBadgeClass(price: number): string {
  if (isEventFree(price)) {
    return "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
  }
  return "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
}

// ✅ Filtrer les événements par type de prix
export function filterEventsByPriceType(
  events: any[], 
  priceType: 'all' | 'free' | 'paid'
): any[] {
  switch (priceType) {
    case 'free':
      return events.filter(event => isEventFree(event.prix))
    case 'paid':
      return events.filter(event => !isEventFree(event.prix))
    case 'all':
    default:
      return events
  }
}

// ✅ Compter les événements par type de prix
export function countEventsByPriceType(events: any[]): {
  total: number
  free: number
  paid: number
} {
  const total = events.length
  const free = events.filter(event => isEventFree(event.prix)).length
  const paid = total - free

  return { total, free, paid }
}

// ✅ Valider les données d'un événement gratuit avant création
export function validateFreeEventData(eventData: any): string[] {
  const errors: string[] = []

  // Validations de base (réutiliser les existantes)
  const baseErrors = validateRequired(eventData, [
    'titre', 'description', 'lieu', 'adresse', 
    'dateDebut', 'dateFin', 'nbPlaces', 'organisateur'
  ])
  errors.push(...baseErrors)

  // Validation spécifique pour événement gratuit
  if (eventData.prix !== 0) {
    errors.push('Le prix doit être 0 pour un événement gratuit')
  }

  // Validation des dates
  const dateDebut = new Date(eventData.dateDebut)
  const dateFin = new Date(eventData.dateFin)
  const now = new Date()

  if (dateDebut <= now) {
    errors.push('La date de début doit être dans le futur')
  }

  if (dateFin <= dateDebut) {
    errors.push('La date de fin doit être après la date de début')
  }

  return errors
}

// ✅ Générer un message de confirmation pour réservation gratuite
export function generateFreeReservationMessage(eventTitle: string, ticketNumber: string): string {
  return `🎉 Félicitations ! Votre billet gratuit pour "${eventTitle}" a été réservé avec succès.

📧 Numéro de billet : ${ticketNumber}
✅ Votre billet est immédiatement valide
📱 Vous pouvez le retrouver dans "Mes billets"

Merci de votre intérêt pour cet événement !`
}

// ✅ Créer les métadonnées pour un log d'activité (réservation gratuite)
export function createFreeReservationLogData(eventTitle: string, ticketNumber: string) {
  return {
    action: 'free_reservation',
    eventTitle,
    ticketNumber,
    amount: 0,
    type: 'gratuit',
    timestamp: new Date().toISOString()
  }
}

// ========================================
// UTILITAIRES POUR L'INTERFACE UTILISATEUR
// ========================================

// ✅ Obtenir l'icône appropriée selon le type d'événement
export function getEventTypeIcon(price: number): string {
  return isEventFree(price) ? '✨' : '💰'
}

// ✅ Obtenir le message d'aide selon le type d'événement
export function getEventTypeHelpText(price: number): string {
  if (isEventFree(price)) {
    return 'Réservation gratuite - Aucun paiement requis'
  }
  return `Paiement sécurisé requis - ${formatEventPrice(price)}`
}

// ✅ Trier les événements avec priorité aux gratuits (optionnel)
export function sortEventsWithFreePriority(events: any[]): any[] {
  return [...events].sort((a, b) => {
    // Gratuits en premier
    if (isEventFree(a.prix) && !isEventFree(b.prix)) return -1
    if (!isEventFree(a.prix) && isEventFree(b.prix)) return 1
    
    // Puis par date
    return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
  })
}

// ========================================
// VALIDATION ET SANITISATION SPÉCIFIQUE
// ========================================

// ✅ Nettoyer et valider les données de réservation gratuite
export function sanitizeFreeReservationData(data: any) {
  return {
    eventId: sanitizeString(data.eventId || ''),
    userId: sanitizeString(data.userId || ''),
    prix: 0, // Toujours 0 pour gratuit
    statut: 'VALID',
    // Pas de données de paiement pour les gratuits
    guestEmail: data.guestEmail ? sanitizeString(data.guestEmail) : null,
    guestNom: data.guestNom ? sanitizeString(data.guestNom) : null,
    guestPrenom: data.guestPrenom ? sanitizeString(data.guestPrenom) : null
  }
}

