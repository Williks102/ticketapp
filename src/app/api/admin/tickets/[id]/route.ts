// src/app/api/admin/tickets/[id]/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET /api/admin/tickets/[id] - Détails d'un billet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            telephone: true,
            role: true,
            createdAt: true,
            lastLogin: true
          }
        },
        event: {
          include: {
            tickets: {
              where: { statut: { not: 'CANCELLED' } },
              select: { id: true, statut: true }
            }
          }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Récupérer l'admin qui a validé (si applicable)
    let validatedByAdmin = null
    if (ticket.validatedBy) {
      validatedByAdmin = await prisma.user.findUnique({
        where: { id: ticket.validatedBy },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true
        }
      })
    }

    // Calculer des statistiques sur l'événement
    const eventTickets = ticket.event.tickets
    const totalSold = eventTickets.length
    const validCount = eventTickets.filter(t => t.statut === 'VALID').length
    const usedCount = eventTickets.filter(t => t.statut === 'USED').length

    const response = {
      // Informations de base du billet
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut,
      prix: Number(ticket.prix),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      validatedAt: ticket.validatedAt?.toISOString() || null,
      validatedBy: ticket.validatedBy,
      
      // Type de billet
      isGratuit: Number(ticket.prix) === 0,
      
      // Informations utilisateur ou invité
      user: ticket.user ? {
        id: ticket.user.id,
        email: ticket.user.email,
        nom: ticket.user.nom,
        prenom: ticket.user.prenom,
        telephone: ticket.user.telephone,
        role: ticket.user.role,
        createdAt: ticket.user.createdAt.toISOString(),
        lastLogin: ticket.user.lastLogin?.toISOString() || null
      } : null,
      
      guest: !ticket.user ? {
        email: ticket.guestEmail,
        nom: ticket.guestNom,
        prenom: ticket.guestPrenom,
        telephone: ticket.guestTelephone
      } : null,
      
      // Informations événement complètes
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        description: ticket.event.description,
        lieu: ticket.event.lieu,
        adresse: ticket.event.adresse,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString(),
        prix: Number(ticket.event.prix),
        nbPlaces: ticket.event.nbPlaces,
        placesRestantes: ticket.event.placesRestantes,
        statut: ticket.event.statut,
        organisateur: ticket.event.organisateur,
        image: ticket.event.image,
        categories: ticket.event.categories,
        
        // Statistiques de l'événement
        stats: {
          totalSold,
          validCount,
          usedCount,
          fillRate: ticket.event.nbPlaces > 0 ? Math.round((totalSold / ticket.event.nbPlaces) * 100) : 0
        }
      },
      
      // Informations de validation
      validation: ticket.validatedBy ? {
        validatedAt: ticket.validatedAt?.toISOString(),
        validatedBy: validatedByAdmin ? {
          id: validatedByAdmin.id,
          email: validatedByAdmin.email,
          nom: validatedByAdmin.nom,
          prenom: validatedByAdmin.prenom
        } : { id: ticket.validatedBy, email: 'Admin supprimé' }
      } : null,
      
      // Métadonnées utiles
      metadata: {
        canBeValidated: ticket.statut === 'VALID' && 
                       ticket.event.statut === 'ACTIVE' && 
                       new Date() >= new Date(ticket.event.dateDebut) &&
                       new Date() <= new Date(ticket.event.dateFin),
        canBeCancelled: ticket.statut === 'VALID',
        isEventPast: new Date() > new Date(ticket.event.dateFin),
        daysUntilEvent: Math.ceil((new Date(ticket.event.dateDebut).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin ticket detail:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/admin/tickets/[id] - Modifier un billet
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()

    // Vérifier que le billet existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { 
        event: {
          select: { id: true, titre: true, dateDebut: true, dateFin: true, statut: true }
        }
      }
    })

    if (!existingTicket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    const updateData: any = {}
    let shouldUpdateEventPlaces = false
    let placeAdjustment = 0

    // Gestion du changement de statut
    if (body.statut && body.statut !== existingTicket.statut) {
      if (!['VALID', 'USED', 'CANCELLED'].includes(body.statut)) {
        return createApiError('VALIDATION_ERROR', 'Statut invalide', 400)
      }

      const oldStatus = existingTicket.statut
      const newStatus = body.statut

      updateData.statut = newStatus

      // Logique de validation
      if (newStatus === 'USED' && oldStatus === 'VALID') {
        // Vérifier que l'événement peut être validé
        const now = new Date()
        const eventStart = new Date(existingTicket.event.dateDebut)
        const eventEnd = new Date(existingTicket.event.dateFin)

        if (existingTicket.event.statut !== 'ACTIVE') {
          return createApiError('EVENT_INACTIVE', 'Impossible de valider un billet pour un événement inactif', 400)
        }

        if (now < eventStart) {
          return createApiError('EVENT_NOT_STARTED', 'L\'événement n\'a pas encore commencé', 400)
        }

        if (now > eventEnd) {
          return createApiError('EVENT_ENDED', 'L\'événement est terminé', 400)
        }

        updateData.validatedAt = new Date()
        updateData.validatedBy = user.id
      }

      // Gestion des places disponibles
      if (oldStatus === 'VALID' && newStatus === 'CANCELLED') {
        // Libérer une place
        shouldUpdateEventPlaces = true
        placeAdjustment = 1
      } else if (oldStatus === 'CANCELLED' && newStatus === 'VALID') {
        // Reprendre une place
        shouldUpdateEventPlaces = true
        placeAdjustment = -1
      }
    }

    // Transaction pour mettre à jour le billet et éventuellement l'événement
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le billet
      const updatedTicket = await tx.ticket.update({
        where: { id: params.id },
        data: updateData
      })

      // Mettre à jour les places de l'événement si nécessaire
      if (shouldUpdateEventPlaces) {
        await tx.event.update({
          where: { id: existingTicket.eventId },
          data: {
            placesRestantes: {
              increment: placeAdjustment
            }
          }
        })
      }

      return updatedTicket
    })

    // Log de l'activité
    const actionType = body.statut === 'USED' ? 'validate' : 
                      body.statut === 'CANCELLED' ? 'cancel' : 'update'

    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'ticket',
        entityId: params.id,
        action: actionType,
        oldData: {
          statut: existingTicket.statut,
          eventTitle: existingTicket.event.titre
        },
        newData: {
          statut: result.statut,
          validatedBy: updateData.validatedBy,
          validatedAt: updateData.validatedAt?.toISOString()
        },
        userId: user.id
      }
    })

    const response = {
      id: result.id,
      numeroTicket: result.numeroTicket,
      statut: result.statut,
      validatedAt: result.validatedAt?.toISOString() || null,
      validatedBy: result.validatedBy,
      updatedAt: result.updatedAt.toISOString(),
      message: actionType === 'validate' ? 'Billet validé avec succès' :
               actionType === 'cancel' ? 'Billet annulé avec succès' :
               'Billet mis à jour avec succès'
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin ticket update:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/admin/tickets/[id] - Supprimer un billet
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // Vérifier que le billet existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { 
        event: {
          select: { titre: true }
        }
      }
    })

    if (!existingTicket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Vérifier que le billet peut être supprimé
    if (existingTicket.statut === 'USED') {
      return createApiError('CONFLICT', 'Impossible de supprimer un billet déjà utilisé', 409)
    }

    // Demander confirmation via query parameter pour les suppressions
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm') === 'true'

    if (!confirm) {
      return createApiError(
        'CONFIRMATION_REQUIRED', 
        'Ajoutez ?confirm=true pour confirmer la suppression', 
        400
      )
    }

    // Supprimer le billet et libérer la place
    await prisma.$transaction(async (tx) => {
      await tx.ticket.delete({
        where: { id: params.id }
      })

      // Libérer la place si le billet n'était pas déjà annulé
      if (existingTicket.statut !== 'CANCELLED') {
        await tx.event.update({
          where: { id: existingTicket.eventId },
          data: {
            placesRestantes: {
              increment: 1
            }
          }
        })
      }
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'ticket',
        entityId: params.id,
        action: 'delete',
        oldData: {
          numeroTicket: existingTicket.numeroTicket,
          statut: existingTicket.statut,
          prix: existingTicket.prix,
          eventTitle: existingTicket.event.titre
        },
        userId: user.id
      }
    })

    return createApiResponse({ 
      message: 'Billet supprimé avec succès',
      deletedTicketId: params.id,
      numeroTicket: existingTicket.numeroTicket
    })

  } catch (error) {
    console.error('❌ Erreur API admin ticket delete:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/admin/tickets/[id]/resend - Renvoyer le billet par email
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { email: true, nom: true, prenom: true }
        },
        event: {
          select: { titre: true, lieu: true, dateDebut: true }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    const recipientEmail = ticket.user?.email || ticket.guestEmail
    const recipientName = ticket.user ? 
      `${ticket.user.prenom} ${ticket.user.nom}` : 
      `${ticket.guestPrenom} ${ticket.guestNom}`

    if (!recipientEmail) {
      return createApiError('NO_EMAIL', 'Aucune adresse email associée à ce billet', 400)
    }

    // Ici vous intégreriez votre service d'email
    // Pour l'exemple, on simule l'envoi
    const emailSent = true // await sendTicketEmail(ticket, recipientEmail, recipientName)

    if (emailSent) {
      // Log de l'activité
      await prisma.activityLog.create({
        data: {
          type: 'ADMIN_ACTION',
          entity: 'ticket',
          entityId: params.id,
          action: 'resend_email',
          newData: {
            recipientEmail,
            recipientName,
            eventTitle: ticket.event.titre
          },
          userId: user.id
        }
      })

      return createApiResponse({
        message: 'Billet renvoyé par email avec succès',
        recipientEmail,
        recipientName
      })
    } else {
      return createApiError('EMAIL_FAILED', 'Échec de l\'envoi de l\'email', 500)
    }

  } catch (error) {
    console.error('❌ Erreur API admin ticket resend:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}