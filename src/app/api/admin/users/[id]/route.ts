// src/app/api/admin/users/[id]/route.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin, hashPassword } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET /api/admin/users/[id] - Détails d'un utilisateur
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    // Récupérer l'utilisateur avec ses tickets et événements
    const userData = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          include: {
            event: {
              select: {
                id: true,
                titre: true,
                dateDebut: true,
                dateFin: true,
                lieu: true,
                statut: true,
                organisateur: true,
                prix: true
              }
            }
          }
        }
      }
    })

    if (!userData) {
      return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    // Calculer les statistiques de l'utilisateur
    const validTickets = userData.tickets.filter(t => t.statut !== 'CANCELLED')
    const totalTickets = validTickets.length
    const totalSpent = validTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    const averageSpent = totalTickets > 0 ? Math.round(totalSpent / totalTickets) : 0
    const freeTickets = validTickets.filter(t => Number(t.prix) === 0).length
    const paidTickets = validTickets.filter(t => Number(t.prix) > 0).length
    const usedTickets = validTickets.filter(t => t.statut === 'USED').length
    const validTicketsCount = validTickets.filter(t => t.statut === 'VALID').length

    // ✅ CRÉER const response avec la structure correcte
    const response = {
      // Informations de base de l'utilisateur
      id: userData.id,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      telephone: userData.telephone,
      role: userData.role,
      statut: userData.statut,
      createdAt: userData.createdAt.toISOString(),
      updatedAt: userData.updatedAt.toISOString(),
      lastLogin: userData.lastLogin?.toISOString() || null,
      
      // ✅ STATISTIQUES dans un objet séparé (résout l'erreur activeTickets)
      stats: {
        totalTickets,
        totalSpent,
        averageSpent,
        freeTickets,
        paidTickets,
        eventsAttended: usedTickets,
        upcomingEvents: validTicketsCount,
        activeTickets: validTicketsCount // ✅ Propriété qui causait l'erreur
      },
      
      // Tickets avec détails des événements
      tickets: validTickets.map(ticket => ({
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        statut: ticket.statut,
        prix: Number(ticket.prix),
        createdAt: ticket.createdAt.toISOString(),
        validatedAt: ticket.validatedAt?.toISOString() || null,
        validatedBy: ticket.validatedBy,
        
        // Informations événement
        event: {
          id: ticket.event.id,
          titre: ticket.event.titre,
          dateDebut: ticket.event.dateDebut.toISOString(),
          dateFin: ticket.event.dateFin.toISOString(),
          lieu: ticket.event.lieu,
          statut: ticket.event.statut,
          organisateur: ticket.event.organisateur,
          prix: Number(ticket.event.prix),
          isEventPast: ticket.event.dateFin < new Date(),
          isEventUpcoming: ticket.event.dateDebut > new Date()
        }
      })),
      
      // Métadonnées supplémentaires
      metadata: {
        hasTickets: totalTickets > 0,
        canDelete: totalTickets === 0,
        joinedDate: userData.createdAt.toISOString(),
        isActive: userData.statut === 'ACTIVE',
        isAdmin: userData.role === 'ADMIN'
      }
    }

    // Log de l'activité admin
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: params.id,
        action: 'view_details',
        newData: {
          userEmail: userData.email,
          ticketsCount: totalTickets
        },
        userId: user.id,
        metadata: {
          adminEmail: user.email,
          viewedUserRole: userData.role
        }
      }
    })

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin user GET:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  }
}

// PUT /api/admin/users/[id] - Modifier un utilisateur
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const body = await request.json()

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return createApiError('USER_NOT_FOUND', 'Utilisateur non trouvé', 404)
    }

    // Préparer les données de mise à jour
    const updateData: any = {}

    if (body.nom) updateData.nom = body.nom
    if (body.prenom) updateData.prenom = body.prenom
    if (body.telephone !== undefined) updateData.telephone = body.telephone
    if (body.email && body.email !== existingUser.email) {
      // Vérifier que le nouvel email n'existe pas déjà
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email }
      })
      if (emailExists) {
        return createApiError('EMAIL_EXISTS', 'Cet email est déjà utilisé', 409)
      }
      updateData.email = body.email
    }
    if (body.role && ['USER', 'ADMIN', 'MODERATOR'].includes(body.role)) {
      updateData.role = body.role
    }
    if (body.statut && ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'].includes(body.statut)) {
      updateData.statut = body.statut
    }
    if (body.password) {
      updateData.password = await hashPassword(body.password)
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: params.id,
        action: 'update',
        oldData: {
          email: existingUser.email,
          nom: existingUser.nom,
          prenom: existingUser.prenom,
          role: existingUser.role,
          statut: existingUser.statut
        },
        newData: updateData,
        userId: user.id
      }
    })

    // Préparer la réponse (sans le mot de passe)
    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      nom: updatedUser.nom,
      prenom: updatedUser.prenom,
      telephone: updatedUser.telephone,
      role: updatedUser.role,
      statut: updatedUser.statut,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      lastLogin: updatedUser.lastLogin?.toISOString() || null
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API admin user PUT:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  }
}

// DELETE /api/admin/users/[id] - Supprimer un utilisateur
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const cancelTickets = searchParams.get('cancelTickets') === 'true'
    const transferTickets = searchParams.get('transferTickets') === 'true'
    const force = searchParams.get('force') === 'true'

    // Récupérer l'utilisateur avec ses tickets actifs
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          where: { statut: { not: 'CANCELLED' } },
          include: {
            event: {
              select: {
                id: true,
                titre: true,
                dateDebut: true
              }
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
        where: { 
          role: 'ADMIN',
          statut: 'ACTIVE',
          id: { not: params.id }
        }
      })
      
      if (adminCount === 0) {
        return createApiError(
          'LAST_ADMIN',
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
            cancelTickets: 'Annuler tous les billets - Ajouter ?cancelTickets=true',
            transferTickets: 'Transférer les billets en invités - Ajouter ?transferTickets=true',
            force: 'Suppression forcée (déconseillée) - Ajouter ?force=true'
          }
        }
      )
    }

    // Traitement selon l'option choisie
    if (hasActiveTickets) {
      if (cancelTickets) {
        // Option 1 : Annuler tous les billets et libérer les places
        await prisma.$transaction(async (tx) => {
          await tx.ticket.updateMany({
            where: { 
              userId: params.id, 
              statut: { not: 'CANCELLED' } 
            },
            data: { statut: 'CANCELLED' }
          })

          // Libérer les places pour chaque événement
          for (const ticket of activeTickets) {
            await tx.event.update({
              where: { id: ticket.event.id },
              data: {
                placesRestantes: { increment: 1 }
              }
            })
          }
        })
      } else if (transferTickets) {
        // Option 2 : Transférer en billets invités
        await prisma.ticket.updateMany({
          where: { 
            userId: params.id, 
            statut: { not: 'CANCELLED' } 
          },
          data: {
            userId: null,
            guestEmail: existingUser.email,
            guestNom: existingUser.nom,
            guestPrenom: existingUser.prenom,
            guestTelephone: existingUser.telephone
          }
        })
      }
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: params.id }
    })

    // Log de l'activité
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
    console.error('❌ Erreur API admin user DELETE:', error)
    
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return createApiError(
        'FOREIGN_KEY_CONSTRAINT',
        'Impossible de supprimer cet utilisateur à cause de dépendances.',
        409
      )
    }
    
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  }
}