// src/app/api/admin/users/[id]/route.ts - DELETE CORRIGÉ
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// DELETE /api/admin/users/[id] - Supprimer un utilisateur
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const transferTickets = searchParams.get('transferTickets') === 'true'
    const cancelTickets = searchParams.get('cancelTickets') === 'true'

    // Empêcher l'auto-suppression
    if (user.id === params.id) {
      return createApiError(
        'FORBIDDEN', 
        'Vous ne pouvez pas supprimer votre propre compte', 
        403
      )
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          where: { statut: { not: 'CANCELLED' } },
          include: {
            event: {
              select: { titre: true, dateDebut: true }
            }
          }
        }
      }
    })

    if (!existingUser) {
      return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    // Empêcher la suppression du dernier admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', id: { not: params.id } }
      })
      
      if (adminCount === 0) {
        return createApiError(
          'FORBIDDEN',
          'Impossible de supprimer le dernier administrateur',
          403
        )
      }
    }

    const activeTickets = existingUser.tickets
    const hasActiveTickets = activeTickets.length > 0

    // Si l'utilisateur a des billets actifs et aucune option n'est spécifiée
    if (hasActiveTickets && !force && !transferTickets && !cancelTickets) {
      return createApiError(
        'CONFLICT',
        `Impossible de supprimer un utilisateur avec ${activeTickets.length} billet(s) actif(s).`,
        409,
        {
          activeTickets: activeTickets.length,
          tickets: activeTickets.map(ticket => ({
            id: ticket.id,
            numeroTicket: ticket.numeroTicket,
            eventTitle: ticket.event.titre,
            eventDate: ticket.event.dateDebut.toISOString(),
            statut: ticket.statut
          })),
          options: {
            cancelTickets: `Annuler tous les billets - Ajouter ?cancelTickets=true`,
            transferTickets: `Transférer les billets en invités - Ajouter ?transferTickets=true`,
            force: `Suppression forcée (déconseillée) - Ajouter ?force=true`
          }
        }
      )
    }

    // Traitement selon l'option choisie
    if (hasActiveTickets) {
      if (cancelTickets) {
        // Option 1 : Annuler tous les billets et libérer les places
        await prisma.$transaction(async (tx) => {
          // Annuler tous les billets
          const cancelledTickets = await tx.ticket.updateMany({
            where: { 
              userId: params.id, 
              statut: { not: 'CANCELLED' } 
            },
            data: { statut: 'CANCELLED' }
          })

          // Libérer les places pour chaque événement
          for (const ticket of activeTickets) {
            await tx.event.update({
              where: { id: ticket.eventId },
              data: {
                placesRestantes: { increment: 1 }
              }
            })
          }

          // Log des annulations
          for (const ticket of activeTickets) {
            await tx.activityLog.create({
              data: {
                type: 'ADMIN_ACTION',
                entity: 'ticket',
                entityId: ticket.id,
                action: 'cancel',
                oldData: {
                  statut: ticket.statut,
                  numeroTicket: ticket.numeroTicket
                },
                newData: {
                  statut: 'CANCELLED',
                  reason: 'User deletion'
                },
                userId: user.id,
                metadata: {
                  reason: 'Annulation automatique lors de la suppression de l\'utilisateur',
                  deletedUserId: params.id
                }
              }
            })
          }
        })

      } else if (transferTickets) {
        // Option 2 : Transférer les billets en tant qu'invités
        await prisma.$transaction(async (tx) => {
          for (const ticket of activeTickets) {
            await tx.ticket.update({
              where: { id: ticket.id },
              data: {
                userId: null, // Retirer l'association utilisateur
                guestEmail: existingUser.email,
                guestNom: existingUser.nom,
                guestPrenom: existingUser.prenom,
                guestTelephone: existingUser.telephone
              }
            })

            // Log du transfert
            await tx.activityLog.create({
              data: {
                type: 'ADMIN_ACTION',
                entity: 'ticket',
                entityId: ticket.id,
                action: 'transfer',
                oldData: {
                  userId: params.id,
                  userEmail: existingUser.email
                },
                newData: {
                  userId: null,
                  guestEmail: existingUser.email,
                  guestNom: existingUser.nom,
                  guestPrenom: existingUser.prenom
                },
                userId: user.id,
                metadata: {
                  reason: 'Transfert en invité lors de la suppression de l\'utilisateur',
                  originalUserId: params.id
                }
              }
            })
          }
        })

      } else if (force) {
        // Option 3 : Suppression forcée (déconseillée)
        console.warn(`⚠️ Suppression forcée de l'utilisateur ${existingUser.email} avec ${activeTickets.length} billets actifs`)
        
        // Log d'avertissement pour la suppression forcée
        await prisma.activityLog.create({
          data: {
            type: 'ADMIN_ACTION',
            entity: 'user',
            entityId: params.id,
            action: 'force_delete',
            oldData: {
              email: existingUser.email,
              activeTicketsCount: activeTickets.length
            },
            userId: user.id,
            metadata: {
              warning: 'Suppression forcée avec billets actifs',
              ticketsAffected: activeTickets.map(t => t.numeroTicket)
            }
          }
        })
      }
    }

    // Supprimer l'utilisateur (les billets deviendront orphelins si force=true)
    await prisma.user.delete({
      where: { id: params.id }
    })

    // Log de l'activité de suppression
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: params.id,
        action: 'delete',
        oldData: {
          email: existingUser.email,
          nom: existingUser.nom,
          prenom: existingUser.prenom,
          role: existingUser.role,
          activeTicketsCount: activeTickets.length
        },
        userId: user.id,
        metadata: {
          deletionMethod: hasActiveTickets ? 
            (cancelTickets ? 'cancel_tickets' : 
             transferTickets ? 'transfer_tickets' : 
             force ? 'force' : 'normal') : 'normal',
          ticketsProcessed: activeTickets.length
        }
      }
    })

    const message = hasActiveTickets ? 
      `Utilisateur supprimé avec succès. ${activeTickets.length} billet(s) ${
        cancelTickets ? 'annulé(s)' : 
        transferTickets ? 'transféré(s) en invité' : 
        'traité(s)'
      }.` : 
      'Utilisateur supprimé avec succès'

    return createApiResponse({ 
      message,
      deletedUserId: params.id,
      deletedUserEmail: existingUser.email,
      processedTickets: activeTickets.length,
      method: hasActiveTickets ? 
        (cancelTickets ? 'cancel_tickets' : 
         transferTickets ? 'transfer_tickets' : 
         force ? 'force' : 'normal') : 'normal'
    })

  } catch (error) {
    console.error('❌ Erreur API admin user delete:', error)
    
    // Gestion spécifique des erreurs de contrainte
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return createApiError(
        'FOREIGN_KEY_CONSTRAINT',
        'Impossible de supprimer cet utilisateur à cause de dépendances. Utilisez les options de transfert ou d\'annulation.',
        409
      )
    }
    
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}