// src/app/api/user/tickets/route.ts - CORRECTION COMPLÈTE
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Début récupération billets utilisateur')
    
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    console.log(`👤 User ${user.email} récupère ses billets`)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)
    const status = searchParams.get('status') || '' // 'upcoming', 'past', 'valid', 'used'
    const includeQR = searchParams.get('includeQR') === 'true'

    console.log(`👤 User ${user.email} récupère ses billets (includeQR: ${includeQR})`)

    const now = new Date()

    // ✅ CORRECTION 1: Simplifier la construction des conditions
    let whereClause: any = {
      userId: user.id // Condition de base obligatoire
    }

    // ✅ CORRECTION 2: Gérer les filtres de statut différemment
    if (status === 'upcoming') {
      whereClause.event = {
        dateDebut: { gte: now }
      }
    } else if (status === 'past') {
      whereClause.event = {
        dateFin: { lt: now }
      }
    } else if (status === 'valid') {
      whereClause.statut = 'VALID'
    } else if (status === 'used') {
      whereClause.statut = 'USED'
    }

    console.log('🔍 Conditions de recherche:', JSON.stringify(whereClause, null, 2))

    // ✅ CORRECTION 3: Séparer le count du findMany
    let total: number
    let tickets: any[]

    try {
      // Compter d'abord
      console.log('📊 Comptage des billets...')
      total = await prisma.ticket.count({ 
        where: whereClause 
      })
      console.log(`📊 Total billets trouvés: ${total}`)

      // Ensuite récupérer
      console.log('🎫 Récupération des billets...')
      tickets = await prisma.ticket.findMany({
        where: whereClause,
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
              organisateur: true,
              image: true,
              categories: true,
              statut: true,
              prix: true,
              nbPlaces: true,
              placesRestantes: true,
              createdAt: true,
              updatedAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
      console.log(`🎫 Billets récupérés: ${tickets.length}`)

    } catch (prismaError) {
      console.error('❌ Erreur Prisma spécifique:', prismaError)
      
      // ✅ CORRECTION 4: Fallback plus simple en cas d'erreur
      console.log('🔄 Tentative avec requête simplifiée...')
      
      try {
        tickets = await prisma.ticket.findMany({
          where: { userId: user.id },
          include: {
            event: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })
        total = tickets.length
        console.log(`✅ Fallback réussi: ${tickets.length} billets`)
      } catch (fallbackError) {
        console.error('❌ Même le fallback a échoué:', fallbackError)
        throw fallbackError
      }
    }

    // ✅ CORRECTION 5: Formater la réponse de manière sécurisée
    const ticketsResponse = tickets.map(ticket => {
      try {
        return {
          id: ticket.id,
          numeroTicket: ticket.numeroTicket,
          qrCode: includeQR ? ticket.qrCode : undefined,
          statut: ticket.statut,
          prix: Number(ticket.prix || 0),
          validatedAt: ticket.validatedAt?.toISOString() || null,
          validatedBy: ticket.validatedBy || null,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
          
          // Informations événement
          event: {
            id: ticket.event.id,
            titre: ticket.event.titre,
            description: ticket.event.description || '',
            lieu: ticket.event.lieu,
            adresse: ticket.event.adresse || '',
            dateDebut: ticket.event.dateDebut.toISOString(),
            dateFin: ticket.event.dateFin.toISOString(),
            organisateur: ticket.event.organisateur || '',
            image: ticket.event.image || null,
            categories: ticket.event.categories || [],
            statut: ticket.event.statut,
            prix: Number(ticket.event.prix || 0),
            nbPlaces: ticket.event.nbPlaces || 0,
            placesRestantes: ticket.event.placesRestantes || 0,
            createdAt: ticket.event.createdAt.toISOString(),
            updatedAt: ticket.event.updatedAt.toISOString()
          },
          
          // Métadonnées utiles
          canShowQR: ticket.statut === 'VALID',
          canDownload: ['VALID', 'USED'].includes(ticket.statut),
          isExpired: ticket.event.dateFin < now && ticket.statut === 'VALID',
          daysUntilEvent: ticket.event.dateDebut > now 
            ? Math.ceil((ticket.event.dateDebut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null
        }
      } catch (formatError) {
        console.error('❌ Erreur formatage billet:', formatError, 'Billet:', ticket.id)
        // Retourner un format minimal en cas d'erreur
        return {
          id: ticket.id,
          numeroTicket: ticket.numeroTicket,
          statut: ticket.statut,
          prix: Number(ticket.prix || 0),
          createdAt: ticket.createdAt.toISOString(),
          event: {
            id: ticket.event?.id || 'unknown',
            titre: ticket.event?.titre || 'Événement inconnu',
            dateDebut: ticket.event?.dateDebut?.toISOString() || new Date().toISOString(),
            dateFin: ticket.event?.dateFin?.toISOString() || new Date().toISOString()
          }
        }
      }
    })

    const response = {
      tickets: ticketsResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      summary: {
        totalTickets: total,
        validTickets: tickets.filter(t => t.statut === 'VALID').length,
        usedTickets: tickets.filter(t => t.statut === 'USED').length,
        upcomingEvents: tickets.filter(t => t.event && new Date(t.event.dateDebut) > now).length
      }
    }

    console.log('✅ Réponse formatée avec succès')
    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API user billets:', error)
    
    // ✅ CORRECTION 6: Réponse d'erreur plus détaillée pour le debug
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const errorName = error instanceof Error ? error.constructor.name : 'UnknownError'
    
    console.error('❌ Détails erreur:', {
      name: errorName,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'Pas de stack'
    })
    
    return createApiError(
      'INTERNAL_ERROR', 
      `Erreur lors de la récupération des billets: ${errorMessage}`, 
      500
    )
  } finally {
    // ✅ CORRECTION 7: Toujours déconnecter Prisma
    try {
      await prisma.$disconnect()
      console.log('🔌 Prisma disconnected')
    } catch (disconnectError) {
      console.error('⚠️ Erreur déconnexion Prisma:', disconnectError)
    }
  }
}

// ========================================
// SOLUTIONS ALTERNATIVES SI PROBLÈME PERSISTE
// ========================================

// Si l'erreur persiste, essayez ces commandes :

// 1. Regenerer le client Prisma
// npx prisma generate

// 2. Vérifier la base de données
// npx prisma db pull

// 3. Redémarrer complètement
// rm -rf .next
// npm run dev

// 4. Vérifier la connexion DB
// npx prisma studio