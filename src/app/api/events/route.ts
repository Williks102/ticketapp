import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  createApiResponse,
  createApiError,
  authenticateRequest,
  requireAdmin,
  getPaginationParams,
  createPaginationMeta,
  validateRequired,
  extractQueryParams
} from '@/lib/api-utils'
import {
  CreateEventRequest,
  EventsListResponse,
  EventsQueryParams,
  EventResponse
} from '@/types/api'

const prisma = new PrismaClient()

// GET /api/events - Récupérer la liste des événements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPaginationParams(searchParams)

    // Construire les filtres
    const where: any = {}
    
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { lieu: { contains: search, mode: 'insensitive' } },
        { organisateur: { contains: search, mode: 'insensitive' } }
      ]
    }

    const lieu = searchParams.get('lieu')
    if (lieu) {
      where.lieu = { contains: lieu, mode: 'insensitive' }
    }

    const status = searchParams.get('status')
    if (status) {
      where.statut = status
    }

    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      where.dateDebut = {}
      if (dateFrom) where.dateDebut.gte = new Date(dateFrom)
      if (dateTo) where.dateDebut.lte = new Date(dateTo)
    }

    // Ordre de tri
    const sortBy = searchParams.get('sortBy') || 'dateDebut'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Récupérer les événements avec pagination
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          tickets: {
            select: {
              id: true,
              prix: true,
              statut: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    // Transformer les données pour inclure les statistiques
    const eventsWithStats: EventResponse[] = events.map(event => {
      const ticketsVendus = event.tickets.filter(t => t.statut !== 'CANCELLED').length
      const revenue = event.tickets
        .filter(t => t.statut !== 'CANCELLED')
        .reduce((sum, ticket) => sum + ticket.prix, 0)

      return {
        id: event.id,
        titre: event.titre,
        description: event.description,
        lieu: event.lieu,
        adresse: event.adresse,
        dateDebut: event.dateDebut.toISOString(),
        dateFin: event.dateFin.toISOString(),
        prix: event.prix,
        nbPlaces: event.nbPlaces,
        placesRestantes: event.placesRestantes,
        statut: event.statut,
        organisateur: event.organisateur,
        image: event.image,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        ticketsVendus,
        revenue
      }
    })

    const response: EventsListResponse = {
      events: eventsWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/events - Créer un nouvel événement
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError(
        'UNAUTHORIZED',
        'Accès réservé aux administrateurs',
        403
      )
    }

    const body: CreateEventRequest = await request.json()

    // Validation des champs requis
    const requiredFields = [
      'titre', 'description', 'lieu', 'adresse',
      'dateDebut', 'dateFin', 'prix', 'nbPlaces', 'organisateur'
    ]
    const validationErrors = validateRequired(body, requiredFields)

    if (validationErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Données manquantes',
        400,
        validationErrors
      )
    }

    // Validation des dates
    const dateDebut = new Date(body.dateDebut)
    const dateFin = new Date(body.dateFin)
    const now = new Date()

    if (dateDebut <= now) {
      return createApiError(
        'INVALID_DATE',
        'La date de début doit être dans le futur',
        400
      )
    }

    if (dateFin <= dateDebut) {
      return createApiError(
        'INVALID_DATE',
        'La date de fin doit être après la date de début',
        400
      )
    }

    // Validation du prix et du nombre de places
    if (body.prix < 0) {
      return createApiError(
        'INVALID_PRICE',
        'Le prix ne peut pas être négatif',
        400
      )
    }

    if (body.nbPlaces < 1) {
      return createApiError(
        'INVALID_PLACES',
        'Le nombre de places doit être supérieur à 0',
        400
      )
    }

    // Créer l'événement
    const event = await prisma.event.create({
      data: {
        titre: body.titre,
        description: body.description,
        lieu: body.lieu,
        adresse: body.adresse,
        dateDebut,
        dateFin,
        prix: body.prix,
        nbPlaces: body.nbPlaces,
        placesRestantes: body.nbPlaces,
        organisateur: body.organisateur,
        image: body.image,
        statut: 'ACTIVE'
      }
    })

    const response: EventResponse = {
      id: event.id,
      titre: event.titre,
      description: event.description,
      lieu: event.lieu,
      adresse: event.adresse,
      dateDebut: event.dateDebut.toISOString(),
      dateFin: event.dateFin.toISOString(),
      prix: event.prix,
      nbPlaces: event.nbPlaces,
      placesRestantes: event.placesRestantes,
      statut: event.statut,
      organisateur: event.organisateur,
      image: event.image,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    }

    return createApiResponse(response, 201, 'Événement créé avec succès')

  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}