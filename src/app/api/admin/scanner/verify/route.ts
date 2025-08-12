// src/app/api/admin/scanner/verify/route.ts
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

// POST /api/admin/scanner/verify - Vérifier un billet sans le valider
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { qrData, eventId } = body

    if (!qrData) {
      return createApiError('VALIDATION_ERROR', 'Données QR code manquantes', 400)
    }

    // Analyser les données du QR code
    let ticketData
    try {
      if (qrData.startsWith('{')) {
        ticketData = JSON.parse(qrData)
      } else {
        ticketData = { numeroTicket: qrData }
      }
    } catch (error) {
      return createApiResponse({
        valid: false,
        reason: 'QR_CODE_INVALID',
        message: 'QR code illisible ou corrompu',
        ticket: null,
        event: null,
        holder: null,
        checks: {
          qrCodeReadable: false
        }
      })
    }

    // Rechercher le billet
    const searchCriteria = ticketData.numeroTicket ? 
      { numeroTicket: ticketData.numeroTicket } : 
      { id: ticketData.id }

    const ticket = await prisma.ticket.findUnique({
      where: searchCriteria,
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true,
            telephone: true
          }
        },
        event: {
          select: {
            id: true,
            titre: true,
            lieu: true,
            dateDebut: true,
            dateFin: true,
            statut: true,
            prix: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiResponse({
        valid: false,
        reason: 'TICKET_NOT_FOUND',
        message: 'Billet non trouvé dans la base de données',
        ticket: null,
        event: null,
        holder: null,
        checks: {
          qrCodeReadable: true,
          ticketExists: false
        }
      })
    }

    // Effectuer toutes les vérifications sans valider
    const now = new Date()
    const eventStart = new Date(ticket.event.dateDebut)
    const eventEnd = new Date(ticket.event.dateFin)

    const checks = {
      qrCodeReadable: true,
      ticketExists: true,
      correctEvent: !eventId || ticket.eventId === eventId,
      eventActive: ticket.event.statut === 'ACTIVE',
      eventStarted: now >= eventStart,
      eventNotEnded: now <= eventEnd,
      ticketValid: ticket.statut === 'VALID',
      ticketNotCancelled: ticket.statut !== 'CANCELLED',
      ticketNotUsed: ticket.statut !== 'USED'
    }

    // Le billet est valide si toutes les vérifications passent
    const isValid = Object.values(checks).every(check => check === true)

    let reason = ''
    let message = ''

    if (!isValid) {
      if (!checks.correctEvent) {
        reason = 'WRONG_EVENT'
        message = `Ce billet est pour "${ticket.event.titre}", pas pour l'événement sélectionné`
      } else if (!checks.eventActive) {
        reason = 'EVENT_INACTIVE'
        message = `Événement "${ticket.event.titre}" annulé ou inactif`
      } else if (!checks.eventStarted) {
        const timeUntilStart = Math.ceil((eventStart.getTime() - now.getTime()) / (1000 * 60))
        reason = 'EVENT_NOT_STARTED'
        message = `L'événement commence dans ${timeUntilStart} minutes`
      } else if (!checks.eventNotEnded) {
        const hoursAfterEnd = Math.ceil((now.getTime() - eventEnd.getTime()) / (1000 * 60 * 60))
        reason = 'EVENT_ENDED'
        message = `L'événement s'est terminé il y a ${hoursAfterEnd}h`
      } else if (!checks.ticketNotCancelled) {
        reason = 'TICKET_CANCELLED'
        message = `Billet #${ticket.numeroTicket} annulé`
      } else if (!checks.ticketNotUsed) {
        const validatedDate = ticket.validatedAt ? 
          ticket.validatedAt.toLocaleDateString('fr-FR', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
          }) : 'date inconnue'
        reason = 'TICKET_ALREADY_USED'
        message = `Billet #${ticket.numeroTicket} déjà utilisé le ${validatedDate}`
      } else {
        reason = 'UNKNOWN_ERROR'
        message = 'Erreur de validation inconnue'
      }
    }

    const response = {
      valid: isValid,
      reason: isValid ? null : reason,
      message: isValid ? `✅ Billet #${ticket.numeroTicket} prêt à être scanné` : `❌ ${message}`,
      
      ticket: {
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        statut: ticket.statut,
        prix: Number(ticket.prix),
        isGratuit: Number(ticket.prix) === 0,
        createdAt: ticket.createdAt.toISOString(),
        validatedAt: ticket.validatedAt?.toISOString() || null
      },
      
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString(),
        statut: ticket.event.statut
      },
      
      holder: ticket.user ? {
        type: 'user',
        nom: ticket.user.nom,
        prenom: ticket.user.prenom,
        email: ticket.user.email,
        telephone: ticket.user.telephone
      } : {
        type: 'guest',
        nom: ticket.guestNom,
        prenom: ticket.guestPrenom,
        email: ticket.guestEmail,
        telephone: ticket.guestTelephone
      },
      
      checks,
      
      // Informations temporelles utiles
      timing: {
        currentTime: now.toISOString(),
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        minutesUntilStart: Math.ceil((eventStart.getTime() - now.getTime()) / (1000 * 60)),
        minutesUntilEnd: Math.ceil((eventEnd.getTime() - now.getTime()) / (1000 * 60))
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API scanner verify:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur lors de la vérification', 500)
  } finally {
    await prisma.$disconnect()
  }
}

