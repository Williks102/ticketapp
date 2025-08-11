// src/app/api/tickets/purchase/route.ts - VERSION CORRIGÉE
import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError, 
  validateRequired,
  authenticateRequest,
  generateTicketNumber,
  generateQRCode,
  toPrismaNumber
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { 
  PurchaseTicketRequest,
  TicketResponse,
  TicketStatus,
  EventStatus
} from '@/types/api'
import bcrypt from 'bcryptjs'

// POST /api/tickets/purchase - Acheter des billets
export async function POST(request: NextRequest) {
  try {
    const body: PurchaseTicketRequest = await request.json()

    // Validation des champs requis - CORRIGÉ
    const requiredFields = ['eventId', 'quantity', 'userInfo']
    const validationErrors = validateRequired(body, requiredFields)

    if (validationErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Données manquantes',
        400,
        validationErrors
      )
    }

    // Validation des informations utilisateur - CORRIGÉ
    const userInfoRequiredFields = ['email', 'nom', 'prenom']
    const userInfoErrors = validateRequired(body.userInfo, userInfoRequiredFields)

    if (userInfoErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Informations utilisateur manquantes',
        400,
        userInfoErrors
      )
    }

    // Vérifier que l'événement existe et est disponible
    const event = await prisma.event.findUnique({
      where: { id: body.eventId }
    })

    if (!event) {
      return createApiError(
        'EVENT_NOT_FOUND',
        'Événement non trouvé',
        404
      )
    }

    // Vérifier le statut de l'événement
    if (event.statut !== 'ACTIVE') {
      return createApiError(
        'EVENT_NOT_AVAILABLE',
        'Cet événement n\'est pas disponible pour l\'achat',
        400
      )
    }

    // Vérifier les places disponibles
    if (event.placesRestantes < body.quantity) {
      return createApiError(
        'INSUFFICIENT_PLACES',
        `Seulement ${event.placesRestantes} places disponibles`,
        400
      )
    }

    // Gérer l'utilisateur existant ou créer un achat invité
    let userId: string | null = null;
    
    if (body.userId) {
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: body.userId }
      })
      
      if (user) {
        userId = body.userId
      }
    } else if (body.createAccount && body.password) {
      // Créer un nouveau compte utilisateur
      const existingUser = await prisma.user.findUnique({
        where: { email: body.userInfo.email }
      })
      
      if (existingUser) {
        return createApiError(
          'USER_ALREADY_EXISTS',
          'Un compte existe déjà avec cette adresse email',
          400
        )
      }
      
      // Créer le nouvel utilisateur
      const hashedPassword = await bcrypt.hash(body.password, 12)
      const newUser = await prisma.user.create({
        data: {
          email: body.userInfo.email,
          nom: body.userInfo.nom,
          prenom: body.userInfo.prenom,
          telephone: body.userInfo.telephone,
          password: hashedPassword,
          role: 'USER',
          statut: 'ACTIVE'
        }
      })
      
      userId = newUser.id
    }

    // Créer les billets
    const tickets: TicketResponse[] = []
    
    for (let i = 0; i < body.quantity; i++) {
      const numeroTicket = generateTicketNumber()
      const qrCodeData = await generateQRCode({
        eventId: body.eventId,
        numeroTicket,
        userId: userId || 'guest',
        timestamp: Date.now()
      })

      const ticketData = {
        numeroTicket,
        qrCode: qrCodeData,
        statut: 'VALID' as TicketStatus,
        prix: event.prix,
        eventId: body.eventId,
        userId: userId,
        // Info invité si pas d'utilisateur
        ...(userId ? {} : {
          guestEmail: body.userInfo.email,
          guestNom: body.userInfo.nom,
          guestPrenom: body.userInfo.prenom,
          guestTelephone: body.userInfo.telephone
        })
      }

      const ticket = await prisma.ticket.create({
        data: ticketData,
        include: {
          event: {
            select: {
              id: true,
              titre: true,
              lieu: true,
              adresse: true,
              dateDebut: true,
              dateFin: true,
              organisateur: true
            }
          },
          user: userId ? {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          } : undefined
        }
      })

      // Convertir en TicketResponse
      const ticketResponse: TicketResponse = {
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        qrCode: ticket.qrCode,
        statut: ticket.statut as TicketStatus,
        prix: ticket.prix,
        validatedAt: ticket.validatedAt?.toISOString() || null,
        validatedBy: ticket.validatedBy,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        event: {
          id: ticket.event.id,
          titre: ticket.event.titre,
          description: event.description,
          lieu: ticket.event.lieu,
          adresse: ticket.event.adresse,
          dateDebut: ticket.event.dateDebut.toISOString(),
          dateFin: ticket.event.dateFin.toISOString(),
          prix: event.prix,
          nbPlaces: event.nbPlaces,
          placesRestantes: event.placesRestantes - body.quantity,
          statut: event.statut as EventStatus,
          organisateur: ticket.event.organisateur,
          image: event.image,
          categories: event.categories,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString()
        },
        user: ticket.user ? {
          id: ticket.user.id,
          email: ticket.user.email,
          nom: ticket.user.nom,
          prenom: ticket.user.prenom,
          telephone: ticket.user.telephone,
          role: ticket.user.role,
          statut: ticket.user.statut,
          createdAt: ticket.user.createdAt.toISOString(),
          updatedAt: ticket.user.updatedAt.toISOString()
        } : null,
        guestEmail: ticket.guestEmail,
        guestNom: ticket.guestNom,
        guestPrenom: ticket.guestPrenom,
        guestTelephone: ticket.guestTelephone
      }

      tickets.push(ticketResponse)
    }

    // Mettre à jour les places restantes
    await prisma.event.update({
      where: { id: body.eventId },
      data: {
        placesRestantes: {
          decrement: body.quantity
        }
      }
    })

    // Mettre à jour les statistiques de l'événement si elles existent
    await prisma.eventStats.upsert({
      where: { eventId: body.eventId },
      update: {
        ticketsSold: {
          increment: body.quantity
        },
        revenue: {
          increment: event.prix * body.quantity
        }
      },
      create: {
        eventId: body.eventId,
        ticketsSold: body.quantity,
        revenue: event.prix * body.quantity,
        conversionRate: 0,
        averagePrice: event.prix
      }
    })

    const response = {
      tickets,
      totalAmount: event.prix * body.quantity,
      quantity: body.quantity,
      event: {
        id: event.id,
        titre: event.titre,
        lieu: event.lieu,
        dateDebut: event.dateDebut.toISOString(),
        dateFin: event.dateFin.toISOString()
      }
    }

    return createApiResponse(response, 201)

  } catch (error) {
    console.error('Erreur lors de l\'achat de billets:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}