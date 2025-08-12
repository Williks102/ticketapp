// src/app/api/admin/scanner/validate/route.ts - VERSION COMPLÈTE HARMONISÉE
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { 
  createApiResponse, 
  createApiError, 
  authenticateRequest, 
  requireAdmin 
} from '@/lib/api-utils'
import { JWTPayload } from '@/types/api'

const prisma = new PrismaClient()

// Helper pour s'assurer que user a nom et prenom
async function ensureCompleteUser(user: JWTPayload): Promise<JWTPayload & { nom: string; prenom: string }> {
  if (user.nom && user.prenom) {
    return user as JWTPayload & { nom: string; prenom: string }
  }
  
  // Fallback - récupérer depuis la DB si nécessaire
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nom: true, prenom: true }
  })
  
  if (!fullUser) {
    throw new Error('Utilisateur admin non trouvé')
  }
  
  return {
    ...user,
    nom: fullUser.nom,
    prenom: fullUser.prenom
  }
}

// POST /api/admin/scanner/validate - Valider un billet via QR code
export async function POST(request: NextRequest) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // ✅ S'assurer que l'admin a des infos complètes
    const completeUser = await ensureCompleteUser(user)

    const body = await request.json()
    const { qrData, ticketId, eventId, location } = body

    // Validation des données d'entrée
    if (!qrData && !ticketId) {
      return createApiError('VALIDATION_ERROR', 'QR code ou ID de billet requis', 400)
    }

    let searchCriteria: any

    if (ticketId) {
      // Recherche directe par ID
      searchCriteria = { id: ticketId }
    } else {
      // Analyser les données du QR code
      let ticketData
      try {
        if (qrData.startsWith('{')) {
          ticketData = JSON.parse(qrData)
        } else {
          // Si c'est juste un string, on assume que c'est le numéro de billet
          ticketData = { numeroTicket: qrData }
        }
        
        searchCriteria = ticketData.id ? 
          { id: ticketData.id } : 
          { numeroTicket: ticketData.numeroTicket }
      } catch (error) {
        return createApiError('VALIDATION_ERROR', 'QR code invalide ou illisible', 400)
      }
    }

    // Rechercher le billet avec toutes les relations nécessaires
    const ticket = await prisma.ticket.findFirst({
      where: searchCriteria,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            telephone: true,
            role: true
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
            prix: true,
            organisateur: true,
            statut: true,
            categories: true // ✅ Inclure categories
          }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Vérifications de validité
    const now = new Date()
    const eventStart = new Date(ticket.event.dateDebut)
    const eventEnd = new Date(ticket.event.dateFin)

    // Vérifier que l'événement correspond (si eventId fourni)
    if (eventId && ticket.event.id !== eventId) {
      return createApiError('EVENT_MISMATCH', 
        'Ce billet n\'est pas pour cet événement', 400)
    }

    // Vérifier le statut de l'événement
    if (ticket.event.statut !== 'ACTIVE') {
      return createApiError('EVENT_INACTIVE', 
        `Événement "${ticket.event.titre}" n'est pas actif (statut: ${ticket.event.statut})`, 400)
    }

    // Vérifier que l'événement n'est pas fini
    if (now > eventEnd) {
      return createApiError('EVENT_ENDED', 
        `L'événement "${ticket.event.titre}" est terminé depuis le ${eventEnd.toLocaleDateString('fr-FR')}`, 400)
    }

    // Optionnel : Vérifier que l'événement a commencé 
    // (Commentez cette ligne si vous voulez permettre la validation avant le début)
    // if (now < eventStart) {
    //   return createApiError('EVENT_NOT_STARTED', 
    //     `L'événement "${ticket.event.titre}" n'a pas encore commencé`, 400)
    // }

    // Vérifier le statut du billet
    switch (ticket.statut) {
      case 'CANCELLED':
        return createApiError('TICKET_CANCELLED', 
          `Billet #${ticket.numeroTicket} a été annulé`, 409)
      
      case 'EXPIRED':
        return createApiError('TICKET_EXPIRED', 
          `Billet #${ticket.numeroTicket} a expiré`, 409)
      
      case 'USED':
        const validatedDate = ticket.validatedAt ? 
          ticket.validatedAt.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
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

    // ✅ Tout est OK, valider le billet
    const validatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        statut: 'USED',
        validatedAt: now,
        validatedBy: completeUser.id // ✅ Utiliser completeUser
      }
    })

    // ✅ Log de l'activité de validation avec infos complètes
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
          validatedBy: completeUser.id,
          validatedByName: `${completeUser.prenom} ${completeUser.nom}`, // ✅ Maintenant sûr
          validatedAt: now.toISOString(),
          scanLocation: location || 'Entrée principale',
          holderType: ticket.user ? 'user' : 'guest',
          holderName: ticket.user ? 
            `${ticket.user.prenom} ${ticket.user.nom}` : 
            `${ticket.guestPrenom} ${ticket.guestNom}`,
          ticketPrice: Number(ticket.prix),
          isGratuit: Number(ticket.prix) === 0,
          eventCategories: ticket.event.categories
        },
        userId: completeUser.id, // ✅ Utiliser completeUser.id
        metadata: {
          scanType: ticketId ? 'direct_id' : 'qr_code',
          location: location,
          timestamp: now.toISOString()
        }
      }
    })

    // ✅ Préparer la réponse de validation réussie
    const response = {
      success: true,
      message: `✅ Billet #${ticket.numeroTicket} validé avec succès !`,
      
      // Informations du billet validé
      ticket: {
        id: validatedTicket.id,
        numeroTicket: validatedTicket.numeroTicket,
        statut: validatedTicket.statut,
        prix: Number(validatedTicket.prix),
        isGratuit: Number(validatedTicket.prix) === 0,
        validatedAt: validatedTicket.validatedAt?.toISOString(),
        validatedBy: completeUser.id,
        qrCode: validatedTicket.qrCode
      },
      
      // Informations de l'événement
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        adresse: ticket.event.adresse,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString(),
        organisateur: ticket.event.organisateur,
        prix: Number(ticket.event.prix),
        categories: ticket.event.categories
      },
      
      // Informations du porteur du billet
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
      
      // ✅ Informations de validation avec admin complet
      validation: {
        validatedAt: now.toISOString(),
        validatedByAdmin: {
          id: completeUser.id,        // ✅ Maintenant sûr
          email: completeUser.email,  // ✅ Maintenant sûr
          nom: completeUser.nom,      // ✅ Maintenant sûr
          prenom: completeUser.prenom // ✅ Maintenant sûr
        },
        location: location || 'Entrée principale',
        timestamp: now.getTime()
      },

      // Informations supplémentaires pour l'interface
      ui: {
        successSound: true,
        displayDuration: 3000, // 3 secondes
        backgroundColor: Number(ticket.prix) === 0 ? '#10b981' : '#3b82f6', // Vert pour gratuit, bleu pour payant
        icon: Number(ticket.prix) === 0 ? '✨' : '💰',
        confetti: true // Pour déclencher les confettis dans l'interface
      },

      // Statistiques temps réel pour le dashboard
      stats: {
        eventTitle: ticket.event.titre,
        validationCount: await prisma.ticket.count({
          where: { 
            eventId: ticket.event.id, 
            statut: 'USED' 
          }
        }),
        remainingTickets: await prisma.ticket.count({
          where: { 
            eventId: ticket.event.id, 
            statut: 'VALID' 
          }
        })
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API scanner validate:', error)
    
    // ✅ Log de l'erreur pour debug avec gestion d'erreur
    try {
      const user = await authenticateRequest(request) // Re-authentifier pour le log
      await prisma.activityLog.create({
        data: {
          type: 'SYSTEM_ACTION',
          entity: 'scanner',
          entityId: 'validation_error',
          action: 'error',
          newData: {
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            timestamp: new Date().toISOString(),
            stack: error instanceof Error ? error.stack : null
          },
          userId: user?.id || null, // ✅ Utiliser user.id
          metadata: {
            endpoint: '/api/admin/scanner/validate',
            method: 'POST'
          }
        }
      })
    } catch (logError) {
      console.error('❌ Erreur lors du logging:', logError)
    }

    // Retourner une erreur appropriée selon le type
    if (error instanceof Error) {
      if (error.message.includes('Utilisateur admin non trouvé')) {
        return createApiError('ADMIN_NOT_FOUND', 'Administrateur non trouvé', 404)
      }
      
      if (error.message.includes('prisma')) {
        return createApiError('DATABASE_ERROR', 'Erreur de base de données', 500)
      }
    }

    return createApiError('INTERNAL_ERROR', 'Erreur serveur lors de la validation', 500)
  } finally {
    await prisma.$disconnect()
  }
}