import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

// POST /api/admin/scanner/validate - Valider un billet via QR code
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { qrData, eventId, location } = body

    if (!qrData) {
      return createApiError('VALIDATION_ERROR', 'Données QR code manquantes', 400)
    }

    // Analyser les données du QR code
    let ticketData
    try {
      // Le QR code peut contenir soit du JSON, soit juste le numéro de billet
      if (qrData.startsWith('{')) {
        ticketData = JSON.parse(qrData)
      } else {
        // Si c'est juste un string, on assume que c'est le numéro de billet
        ticketData = { numeroTicket: qrData }
      }
    } catch (error) {
      return createApiError('VALIDATION_ERROR', 'QR code invalide ou illisible', 400)
    }

    // Rechercher le billet par numéro ou par ID
    const searchCriteria = ticketData.numeroTicket ? 
      { numeroTicket: ticketData.numeroTicket } : 
      { id: ticketData.id }

    // Récupérer le billet avec ses relations
    const ticket = await prisma.ticket.findUnique({
      where: searchCriteria,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            telephone: true
          }
        },
        event: {
          select: {
            id: true,
            titre: true,
            lieu: true,
            adresse: true,
            dateDebut: true,
            dateFin: true,
            statut: true,
            organisateur: true,
            prix: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé dans la base de données', 404)
    }

    // Vérifications de sécurité
    const now = new Date()
    const eventStart = new Date(ticket.event.dateDebut)
    const eventEnd = new Date(ticket.event.dateFin)

    // Vérifier que c'est le bon événement (si spécifié)
    if (eventId && ticket.eventId !== eventId) {
      return createApiError('VALIDATION_ERROR', 
        `Ce billet est pour "${ticket.event.titre}", pas pour l'événement sélectionné`, 400)
    }

    // Vérifier le statut de l'événement
    if (ticket.event.statut !== 'ACTIVE') {
      return createApiError('EVENT_INACTIVE', 
        `Événement "${ticket.event.titre}" annulé ou inactif`, 400)
    }

    // Vérifier les dates de l'événement
    if (now < eventStart) {
      const timeUntilStart = Math.ceil((eventStart.getTime() - now.getTime()) / (1000 * 60))
      return createApiError('EVENT_NOT_STARTED', 
        `L'événement "${ticket.event.titre}" commence dans ${timeUntilStart} minutes`, 400)
    }

    if (now > eventEnd) {
      const hoursAfterEnd = Math.ceil((now.getTime() - eventEnd.getTime()) / (1000 * 60 * 60))
      return createApiError('EVENT_ENDED', 
        `L'événement "${ticket.event.titre}" s'est terminé il y a ${hoursAfterEnd}h`, 400)
    }

    // Vérifier le statut du billet
    switch (ticket.statut) {
      case 'CANCELLED':
        return createApiError('TICKET_CANCELLED', 
          `Billet #${ticket.numeroTicket} annulé`, 400)
      
      case 'USED':
        const validatedDate = ticket.validatedAt ? 
          ticket.validatedAt.toLocaleDateString('fr-FR', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
          }) : 'date inconnue'
        
        return createApiError('TICKET_ALREADY_USED', 
          `Billet #${ticket.numeroTicket} déjà utilisé le ${validatedDate}`, 409)
      
      case 'VALID':
        // OK, on peut valider
        break
        
      default:
        return createApiError('TICKET_INVALID', 
          `Statut de billet invalide: ${ticket.statut}`, 400)
    }

    // Tout est OK, valider le billet
    const validatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        statut: 'USED',
        validatedAt: now,
        validatedBy: user.id
      }
    })

    // Log de l'activité de validation
    await prisma.activityLog.create({
      data: {
        type: 'VALIDATION_ACTION',
        entity: 'ticket',
        entityId: ticket.id,
        action: 'validate',
        newData: {
          numeroTicket: ticket.numeroTicket,
          eventTitle: ticket.event.titre,
          eventId: ticket.event.id,
          validatedBy: user.id,
          validatedByName: `${user.prenom} ${user.nom}`,
          validatedAt: now.toISOString(),
          scanLocation: location || 'Entrée principale',
          holderType: ticket.user ? 'user' : 'guest',
          holderName: ticket.user ? 
            `${ticket.user.prenom} ${ticket.user.nom}` : 
            `${ticket.guestPrenom} ${ticket.guestNom}`,
          ticketPrice: ticket.prix,
          isGratuit: Number(ticket.prix) === 0
        },
        userId: user.id
      }
    })

    // Préparer la réponse de validation réussie
    const response = {
      success: true,
      message: `✅ Billet #${ticket.numeroTicket} validé avec succès !`,
      
      ticket: {
        id: validatedTicket.id,
        numeroTicket: validatedTicket.numeroTicket,
        statut: validatedTicket.statut,
        prix: Number(validatedTicket.prix),
        isGratuit: Number(validatedTicket.prix) === 0,
        validatedAt: validatedTicket.validatedAt?.toISOString(),
        validatedBy: user.id,
        qrCode: validatedTicket.qrCode
      },
      
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        adresse: ticket.event.adresse,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString(),
        organisateur: ticket.event.organisateur,
        prix: Number(ticket.event.prix)
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
      
      validation: {
        validatedAt: now.toISOString(),
        validatedByAdmin: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom
        },
        location: location || 'Entrée principale',
        timestamp: now.getTime()
      },

      // Informations supplémentaires pour l'interface
      ui: {
        successSound: true,
        displayDuration: 3000, // 3 secondes
        backgroundColor: Number(ticket.prix) === 0 ? '#10b981' : '#3b82f6', // Vert pour gratuit, bleu pour payant
        icon: Number(ticket.prix) === 0 ? '✨' : '💰'
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API scanner validate:', error)
    
    // Log de l'erreur pour debug
    await prisma.activityLog.create({
      data: {
        type: 'SYSTEM_ACTION',
        entity: 'scanner',
        entityId: 'validation_error',
        action: 'error',
        newData: {
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          timestamp: new Date().toISOString(),
          userId: user?.id || 'unknown'
        },
        userId: user?.id || null
      }
    }).catch(() => {}) // Ignorer les erreurs de logging

    return createApiError('INTERNAL_ERROR', 'Erreur serveur lors de la validation', 500)
  } finally {
    await prisma.$disconnect()
  }
}