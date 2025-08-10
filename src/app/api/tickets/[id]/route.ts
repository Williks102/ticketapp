// app/api/tickets/[id]/route.ts
import { NextRequest } from 'next/server'
import { ValidateTicketRequest, ValidateTicketResponse, TicketResponse } from '@/types/api'

import { 
  createApiResponse, 
  createApiError, 
  validateRequired,
  authenticateRequest,
  requireAdmin,
  comparePassword,
  generateToken,
  hashPassword,
  validateEmail,
  validatePassword,
  generateTicketNumber,
  generateQRCode
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET /api/tickets/[id] - Récupérer un billet spécifique
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError(
        'UNAUTHORIZED',
        'Authentification requise',
        401
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            lieu: true,
            dateDebut: true,
            dateFin: true
          }
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiError(
        'TICKET_NOT_FOUND',
        'Billet non trouvé',
        404
      )
    }

    // Vérifier les permissions
    if (!requireAdmin(user) && ticket.userId !== user.userId) {
      return createApiError(
        'FORBIDDEN',
        'Accès interdit à ce billet',
        403
      )
    }

    const response: TicketResponse = {
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut,
      prix: ticket.prix,
      createdAt: ticket.createdAt.toISOString(),
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString()
      },
      user: ticket.user ? {
        id: ticket.user.id,
        nom: ticket.user.nom,
        prenom: ticket.user.prenom,
        email: ticket.user.email
      } : undefined,
      guestInfo: !ticket.user ? {
        email: ticket.guestEmail || '',
        nom: ticket.guestNom || '',
        prenom: ticket.guestPrenom || '',
        telephone: ticket.guestTelephone
      } : undefined
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('Erreur lors de la récupération du billet:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/tickets/[id] - Mettre à jour un billet (admin seulement)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError(
        'UNAUTHORIZED',
        'Accès réservé aux administrateurs',
        403
      )
    }

    const body = await request.json()
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id }
    })

    if (!ticket) {
      return createApiError(
        'TICKET_NOT_FOUND',
        'Billet non trouvé',
        404
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.statut) {
      updateData.statut = body.statut
    }

    // Mettre à jour le billet
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            lieu: true,
            dateDebut: true,
            dateFin: true
          }
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    const response: TicketResponse = {
      id: updatedTicket.id,
      numeroTicket: updatedTicket.numeroTicket,
      qrCode: updatedTicket.qrCode,
      statut: updatedTicket.statut,
      prix: updatedTicket.prix,
      createdAt: updatedTicket.createdAt.toISOString(),
      event: {
        id: updatedTicket.event.id,
        titre: updatedTicket.event.titre,
        lieu: updatedTicket.event.lieu,
        dateDebut: updatedTicket.event.dateDebut.toISOString(),
        dateFin: updatedTicket.event.dateFin.toISOString()
      },
      user: updatedTicket.user ? {
        id: updatedTicket.user.id,
        nom: updatedTicket.user.nom,
        prenom: updatedTicket.user.prenom,
        email: updatedTicket.user.email
      } : undefined,
      guestInfo: !updatedTicket.user ? {
        email: updatedTicket.guestEmail || '',
        nom: updatedTicket.guestNom || '',
        prenom: updatedTicket.guestPrenom || '',
        telephone: updatedTicket.guestTelephone
      } : undefined
    }

    return createApiResponse(response, 200, 'Billet mis à jour avec succès')

  } catch (error) {
    console.error('Erreur lors de la mise à jour du billet:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}