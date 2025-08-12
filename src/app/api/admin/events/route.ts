// src/app/api/admin/events/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin, validateRequired } from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { EventStatus } from '@/types/api'

// GET /api/admin/events - Liste des événements pour admin
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') as EventStatus || undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Construction de la requête de recherche
    const whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lieu: { contains: search, mode: 'insensitive' } },
        { organisateur: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      whereConditions.statut = status
    }

    // Récupération des événements avec statistiques
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tickets: {
            where: { statut: { not: 'CANCELLED' } },
            select: { prix: true, statut: true }
          }
        }
      }),
      prisma.event.count({ where: whereConditions })
    ])

    // Calculer les statistiques pour chaque événement
    const eventsWithStats = events.map(event => {
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
        placesRestantes: event.placesRestantes,
        statut: event.statut,
        organisateur: event.organisateur,
        image: event.image,
        categories: event.categories,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        
        // Statistiques calculées
        ticketsVendus,
        revenue,
        tauxRemplissage: Math.round(tauxRemplissage * 100) / 100,
        isGratuit: Number(event.prix) === 0
      }
    })

    const response = {
      events: eventsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        status,
        sortBy,
        sortOrder
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin events GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/events - Créer un nouvel événement
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()

    // Validation des champs requis
    const requiredFields = [
      'titre', 'description', 'lieu', 'adresse', 
      'dateDebut', 'dateFin', 'prix', 'nbPlaces', 'organisateur'
    ]
    const validationErrors = validateRequired(body, requiredFields)

    if (validationErrors.length > 0) {
      return createApiError('VALIDATION_ERROR', 'Données manquantes', 400, validationErrors)
    }

    // Validation des dates
    const dateDebut = new Date(body.dateDebut)
    const dateFin = new Date(body.dateFin)
    const now = new Date()

    if (dateDebut <= now) {
      return createApiError('VALIDATION_ERROR', 'La date de début doit être dans le futur', 400)
    }

    if (dateFin <= dateDebut) {
      return createApiError('VALIDATION_ERROR', 'La date de fin doit être après la date de début', 400)
    }

    // Validation du prix (peut être 0 pour gratuit)
    if (body.prix < 0) {
      return createApiError('VALIDATION_ERROR', 'Le prix ne peut pas être négatif', 400)
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
        prix: Number(body.prix),
        nbPlaces: Number(body.nbPlaces),
        placesRestantes: Number(body.nbPlaces),
        organisateur: body.organisateur,
        image: body.image || null,
        categories: body.categories || [],
        statut: 'ACTIVE'
      }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'event',
        entityId: event.id,
        action: 'create',
        newData: {
          title: event.titre,
          price: event.prix,
          places: event.nbPlaces,
          isGratuit: event.prix === 0
        },
        userId: user.id
      }
    })

    const response = {
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
      statut: event.statut,
      organisateur: event.organisateur,
      image: event.image,
      categories: event.categories,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      ticketsVendus: 0,
      revenue: 0,
      isGratuit: event.prix === 0
    }

    return createApiResponse(response, 201)

  } catch (error) {
    console.error('❌ Erreur API admin events POST:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}