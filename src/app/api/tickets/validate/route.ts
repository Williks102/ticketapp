// src/app/api/tickets/validate/route.ts - VERSION CORRIGÉE
import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest,
  requireAdmin
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { 
  ValidateTicketRequest, 
  ValidateTicketResponse, 
  TicketResponse, 
  TicketStatus,
  EventStatus,
  UserRole,
  UserStatus,
  toPrismaNumber
} from '@/types/api'

// Fonction helper pour créer la réponse ticket avec types corrects
function createTicketResponse(ticketData: any): TicketResponse {
  return {
    id: ticketData.id,
    numeroTicket: ticketData.numeroTicket,
    qrCode: ticketData.qrCode,
    statut: ticketData.statut as TicketStatus,
    prix: toPrismaNumber(ticketData.prix),
    validatedAt: ticketData.validatedAt?.toISOString() || null,
    validatedBy: ticketData.validatedBy,
    createdAt: ticketData.createdAt.toISOString(),
    updatedAt: ticketData.updatedAt.toISOString(),
    event: {
      id: ticketData.event.id,
      titre: ticketData.event.titre,
      description: ticketData.event.description || '',
      lieu: ticketData.event.lieu,
      adresse: ticketData.event.adresse || '',
      dateDebut: ticketData.event.dateDebut.toISOString(),
      dateFin: ticketData.event.dateFin.toISOString(),
      prix: toPrismaNumber(ticketData.event.prix),
      nbPlaces: ticketData.event.nbPlaces,
      placesRestantes: ticketData.event.placesRestantes,
      statut: ticketData.event.statut as EventStatus,
      organisateur: ticketData.event.organisateur,
      image: ticketData.event.image,
      categories: ticketData.event.categories || [],
      createdAt: ticketData.event.createdAt.toISOString(),
      updatedAt: ticketData.event.updatedAt.toISOString()
    },
    user: ticketData.user ? {
      id: ticketData.user.id,
      email: ticketData.user.email,
      nom: ticketData.user.nom,
      prenom: ticketData.user.prenom,
      telephone: ticketData.user.telephone,
      role: ticketData.user.role as UserRole,
      statut: ticketData.user.statut as UserStatus,
      createdAt: ticketData.user.createdAt.toISOString(),
      updatedAt: ticketData.user.updatedAt.toISOString(),
      lastLogin: ticketData.user.lastLogin?.toISOString() || null
    } : null,
    guestEmail: ticketData.guestEmail,
    guestNom: ticketData.guestNom,
    guestPrenom: ticketData.guestPrenom,
    guestTelephone: ticketData.guestTelephone
  }
}

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

    const body: ValidateTicketRequest = await request.json()

    // CORRIGÉ : utiliser 'ticketCode' au lieu de 'numeroTicket'
    if (!body.ticketCode) {
      return createApiError(
        'VALIDATION_ERROR',
        'Code de billet requis',
        400
      )
    }

    // Rechercher le billet par numéro de ticket
    const ticket = await prisma.ticket.findUnique({
      where: { numeroTicket: body.ticketCode },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            description: true,
            lieu: true,
            adresse: true,
            dateDebut: true,
            dateFin: true,
            prix: true,
            nbPlaces: true,
            placesRestantes: true,
            statut: true,
            organisateur: true,
            image: true,
            categories: true,
            createdAt: true,
            updatedAt: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            telephone: true,
            role: true,
            statut: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true
          }
        }
      }
    })

    if (!ticket) {
      const response: ValidateTicketResponse = {
        success: false,
        message: 'Billet non trouvé. Vérifiez le code QR ou le numéro de billet.'
      }
      return createApiResponse(response)
    }

    // Vérifier le statut du billet - ANNULÉ
    if (ticket.statut === 'CANCELLED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: 'Ce billet a été annulé et ne peut pas être utilisé.'
      }
      return createApiResponse(response)
    }

    // Vérifier si le billet a expiré
    if (ticket.statut === 'EXPIRED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: 'Ce billet a expiré et ne peut plus être utilisé.'
      }
      return createApiResponse(response)
    }

    // Vérifier si le billet a déjà été utilisé
    if (ticket.statut === 'USED') {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: `Ce billet a déjà été validé le ${ticket.validatedAt?.toLocaleDateString('fr-FR')} par ${ticket.validatedBy}.`
      }
      return createApiResponse(response)
    }

    // Vérifier que l'événement n'est pas terminé
    if (new Date() > ticket.event.dateFin) {
      const response: ValidateTicketResponse = {
        success: false,
        ticket: createTicketResponse(ticket),
        message: 'Cet événement est terminé. Le billet ne peut plus être validé.'
      }
      return createApiResponse(response)
    }

    // Valider le billet
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        statut: 'USED',
        validatedAt: new Date(),
        validatedBy: body.validatedBy || user.userId
      },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            description: true,
            lieu: true,
            adresse: true,
            dateDebut: true,
            dateFin: true,
            prix: true,
            nbPlaces: true,
            placesRestantes: true,
            statut: true,
            organisateur: true,
            image: true,
            categories: true,
            createdAt: true,
            updatedAt: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            telephone: true,
            role: true,
            statut: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true
          }
        }
      }
    })

    // Réponse de succès
    const response: ValidateTicketResponse = {
      success: true,
      message: 'Billet validé avec succès!',
      ticket: createTicketResponse(updatedTicket),
      validationInfo: {
        validatedAt: updatedTicket.validatedAt!.toISOString(),
        validatedBy: updatedTicket.validatedBy!
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la validation du billet:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}