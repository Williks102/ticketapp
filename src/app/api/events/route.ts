// src/app/api/events/route.ts - VERSION COMPLÈTE CORRIGÉE
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, validateRequired, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { EventResponse, CreateEventRequest } from '@/types/api'

// Interface pour la réponse de liste d'événements
interface EventsListResponse {
  events: EventResponse[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// GET /api/events - Récupérer tous les événements (publique)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search')?.trim()
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priceType = searchParams.get('priceType') // 'free', 'paid'
    const sortBy = searchParams.get('sortBy') || 'dateDebut'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'
    const upcoming = searchParams.get('upcoming') === 'true'

    console.log('🔄 Récupération des événements publics...')

    // Construire les conditions de filtrage
    const where: any = {
      statut: 'ACTIVE' // Seuls les événements actifs sont visibles publiquement
    }

    // Filtrage par recherche textuelle
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lieu: { contains: search, mode: 'insensitive' } },
        { organisateur: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtrage par catégorie
    if (category) {
      where.categories = {
        has: category
      }
    }

    // Filtrage par type de prix
    if (priceType === 'free') {
      where.prix = 0
    } else if (priceType === 'paid') {
      where.prix = { gt: 0 }
    }

    // Filtrage par statut spécifique (si admin)
    if (status && status !== 'ACTIVE') {
      // Vérifier l'authentification admin pour voir autres statuts
      try {
        const user = await authenticateRequest(request)
        if (user && requireAdmin(user)) {
          where.statut = status
        }
      } catch (error) {
        // Ignorer l'erreur d'auth, continuer avec ACTIVE seulement
      }
    }

    // Filtrage événements à venir uniquement
    if (upcoming) {
      where.dateDebut = {
        gte: new Date()
      }
    }

    // Compter le total
    const total = await prisma.event.count({ where })

    // Calculer l'offset
    const skip = (page - 1) * limit

    // Construire l'ordre de tri
    const orderBy: any = {}
    if (sortBy === 'prix') {
      orderBy.prix = sortOrder
    } else if (sortBy === 'popularite') {
      // Trier par nombre de billets vendus (requiert une sous-requête)
      orderBy.tickets = {
        _count: sortOrder
      }
    } else if (sortBy === 'places') {
      orderBy.nbPlaces = sortOrder
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Récupérer les événements avec leurs statistiques
    const events = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        tickets: {
          where: { statut: { not: 'CANCELLED' } },
          select: {
            id: true,
            prix: true,
            statut: true
          }
        }
      }
    })

    // Formater les événements avec statistiques
    const eventsResponse: EventResponse[] = events.map(event => {
      const validTickets = event.tickets
      const ticketsVendus = validTickets.length
      const revenue = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
      const tauxRemplissage = event.nbPlaces > 0 ? (ticketsVendus / event.nbPlaces) * 100 : 0

      return {
        id: event.id,
        titre: event.titre,
        description: event.description,
        lieu: event.lieu,
        adresse: event.adresse,
        dateDebut: event.dateDebut.toISOString(),
        dateFin: event.dateFin.toISOString(),
        prix: Number(event.prix),
        nbPlaces: event.nbPlaces,
        placesRestantes: Math.max(0, event.nbPlaces - ticketsVendus),
        statut: event.statut as 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE' | 'TERMINE',
        organisateur: event.organisateur,
        image: event.image,
        categories: event.categories,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        ticketsVendus,
        revenue,
        tauxRemplissage: Math.round(tauxRemplissage * 100) / 100,
        isGratuit: Number(event.prix) === 0,
        isComplet: ticketsVendus >= event.nbPlaces,
        isUpcoming: event.dateDebut > new Date(),
        isPast: event.dateFin < new Date()
      }
    })

    const totalPages = Math.ceil(total / limit)

    const response: EventsListResponse = {
      events: eventsResponse,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    console.log(`✅ ${events.length} événements récupérés (page ${page}/${totalPages})`)

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API events GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur lors de la récupération des événements', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/events - Créer un nouvel événement (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body: CreateEventRequest = await request.json()

    console.log('🔄 Création d\'un nouvel événement...')

    // Validation des champs requis
    const requiredFields = [
      'titre', 'description', 'lieu', 'adresse', 
      'dateDebut', 'dateFin', 'prix', 'nbPlaces', 'organisateur'
    ]
    const validationErrors = validateRequired(body, requiredFields)

    if (validationErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Champs manquants',
        400,
        validationErrors
      )
    }

    // Validation des types et formats
    if (typeof body.prix !== 'number' || body.prix < 0) {
      return createApiError('VALIDATION_ERROR', 'Le prix doit être un nombre positif', 400)
    }

    if (typeof body.nbPlaces !== 'number' || body.nbPlaces <= 0) {
      return createApiError('VALIDATION_ERROR', 'Le nombre de places doit être un nombre positif', 400)
    }

    // Validation des dates
    const dateDebut = new Date(body.dateDebut)
    const dateFin = new Date(body.dateFin)
    const now = new Date()

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      return createApiError('VALIDATION_ERROR', 'Format de date invalide', 400)
    }

    if (dateDebut <= now) {
      return createApiError('VALIDATION_ERROR', 'La date de début doit être dans le futur', 400)
    }

    if (dateFin <= dateDebut) {
      return createApiError('VALIDATION_ERROR', 'La date de fin doit être après la date de début', 400)
    }

    // Validation de l'image URL (optionnel)
    if (body.image && !isValidImageUrl(body.image)) {
      return createApiError('VALIDATION_ERROR', 'URL d\'image invalide', 400)
    }

    // Validation des catégories
    const validCategories = [
      'concert', 'theatre', 'festival', 'sport', 'conference', 
      'exposition', 'cinema', 'danse', 'spectacle', 'autre'
    ]
    if (body.categories && body.categories.some(cat => !validCategories.includes(cat))) {
      return createApiError('VALIDATION_ERROR', 'Catégorie invalide', 400)
    }

    // Vérifier les doublons potentiels
    const existingEvent = await prisma.event.findFirst({
      where: {
        titre: body.titre,
        lieu: body.lieu,
        dateDebut: dateDebut,
        organisateur: body.organisateur
      }
    })

    if (existingEvent) {
      return createApiError(
        'DUPLICATE_EVENT',
        'Un événement similaire existe déjà (même titre, lieu, date et organisateur)',
        409
      )
    }

    // Créer l'événement
    const event = await prisma.event.create({
      data: {
        titre: body.titre.trim(),
        description: body.description.trim(),
        lieu: body.lieu.trim(),
        adresse: body.adresse.trim(),
        dateDebut,
        dateFin,
        prix: Math.round(body.prix * 100), // Convertir en centimes
        nbPlaces: body.nbPlaces,
        placesRestantes: body.nbPlaces,
        organisateur: body.organisateur.trim(),
        image: body.image?.trim() || null,
        categories: body.categories || [],
        statut: 'ACTIVE'
      }
    })

    // Créer les statistiques initiales de l'événement
    await prisma.eventStats.create({
      data: {
        eventId: event.id,
        ticketsSold: 0,
        revenue: 0,
        conversionRate: 0,
        averagePrice: event.prix,
        salesByDay: []
      }
    })

    // Log de l'activité admin
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'event',
        entityId: event.id,
        action: 'create',
        newData: {
          titre: event.titre,
          prix: event.prix,
          nbPlaces: event.nbPlaces,
          isGratuit: event.prix === 0,
          organisateur: event.organisateur
        },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          eventDate: event.dateDebut.toISOString(),
          timestamp: new Date().toISOString()
        }
      }
    })

    // Formater la réponse
    const response: EventResponse = {
      id: event.id,
      titre: event.titre,
      description: event.description,
      lieu: event.lieu,
      adresse: event.adresse,
      dateDebut: event.dateDebut.toISOString(),
      dateFin: event.dateFin.toISOString(),
      prix: Number(event.prix),
      nbPlaces: event.nbPlaces,
      placesRestantes: event.placesRestantes,
      statut: event.statut as 'ACTIVE',
      organisateur: event.organisateur,
      image: event.image,
      categories: event.categories,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      ticketsVendus: 0,
      revenue: 0,
      tauxRemplissage: 0,
      isGratuit: event.prix === 0,
      isComplet: false,
      isUpcoming: true,
      isPast: false
    }

    console.log('✅ Événement créé avec succès:', event.titre)

    return createApiResponse(response, 201, 'Événement créé avec succès')

  } catch (error) {
    console.error('❌ Erreur API events POST:', error)
    
    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return createApiError('DUPLICATE_ERROR', 'Données dupliquées détectées', 409)
      }
      if (error.message.includes('Foreign key')) {
        return createApiError('REFERENCE_ERROR', 'Référence invalide', 400)
      }
    }

    return createApiError('INTERNAL_ERROR', 'Erreur lors de la création de l\'événement', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction utilitaire pour valider une URL d'image
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const validProtocols = ['http:', 'https:']
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    
    if (!validProtocols.includes(parsedUrl.protocol)) {
      return false
    }

    const pathname = parsedUrl.pathname.toLowerCase()
    return validExtensions.some(ext => pathname.endsWith(ext)) || 
           pathname.includes('/upload/') || // Cloudinary ou similaire
           parsedUrl.hostname.includes('cloudinary') ||
           parsedUrl.hostname.includes('amazonaws') ||
           parsedUrl.hostname.includes('unsplash') ||
           parsedUrl.hostname.includes('pixabay')
  } catch {
    return false
  }
}