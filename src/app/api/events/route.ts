import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  createApiResponse,
  createApiError,
  authenticateRequest,
  requireAdmin,
  getPaginationParams,
  validateRequired
} from '@/lib/api-utils'
import {
  CreateEventRequest,
  EventsListResponse,
  EventResponse,
  EventStatus,  // ← NOUVEAU
  toPrismaNumber  // ← NOUVEAU (optionnel)
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

    let orderBy: any = {}
    switch (sortBy) {
      case 'title':
        orderBy.titre = sortOrder
        break
      case 'price':
        orderBy.prix = sortOrder
        break
      case 'revenue':
        orderBy.dateDebut = sortOrder
        break
      default:
        orderBy.dateDebut = sortOrder
    }

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

    // Transformer les données avec corrections TypeScript
    const eventsResponse: EventResponse[] = events.map(event => {
      const validTickets = event.tickets.filter(t => t.statut !== 'CANCELLED')
      const ticketsVendus = validTickets.length
      const revenue = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)

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
        placesRestantes: event.placesRestantes,
        statut: event.statut as 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE',
        organisateur: event.organisateur,
        image: event.image,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        ticketsVendus,
        revenue
      }
    })

    const response: EventsListResponse = {
      events: eventsResponse,
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
        'VALIDATION_ERROR',
        'La date de début doit être dans le futur',
        400
      )
    }

    if (dateFin <= dateDebut) {
      return createApiError(
        'VALIDATION_ERROR',
        'La date de fin doit être après la date de début',
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
      prix: Number(event.prix),
      nbPlaces: event.nbPlaces,
      placesRestantes: event.placesRestantes,
      statut: event.statut as 'ACTIVE' | 'INACTIVE' | 'COMPLET' | 'ANNULE',
      organisateur: event.organisateur,
      image: event.image,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      ticketsVendus: 0,
      revenue: 0
    }

    return createApiResponse(response, 201)

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