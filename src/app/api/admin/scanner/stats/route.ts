import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, requireAdmin } from '@/lib/api-utils'
import prisma from '@/lib/prisma'
// GET /api/admin/scanner/stats - Statistiques de scan pour un événement
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user || !requireAdmin(user)) {
      return createApiError('FORBIDDEN', 'Accès réservé aux administrateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const timeframe = searchParams.get('timeframe') || '24h' // 1h, 24h, 7d

    if (!eventId) {
      return createApiError('VALIDATION_ERROR', 'ID événement requis', 400)
    }

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return createApiError('EVENT_NOT_FOUND', 'Événement non trouvé', 404)
    }

    // Définir la période selon le timeframe
    const now = new Date()
    let startTime = new Date()
    
    switch (timeframe) {
      case '1h':
        startTime.setHours(startTime.getHours() - 1)
        break
      case '24h':
        startTime.setDate(startTime.getDate() - 1)
        break
      case '7d':
        startTime.setDate(startTime.getDate() - 7)
        break
      default:
        startTime.setDate(startTime.getDate() - 1)
    }

    // Récupérer tous les billets de l'événement
    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      include: {
        user: {
          select: { nom: true, prenom: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer les statistiques globales
    const totalTickets = tickets.length
    const validTickets = tickets.filter(t => t.statut === 'VALID').length
    const usedTickets = tickets.filter(t => t.statut === 'USED').length
    const cancelledTickets = tickets.filter(t => t.statut === 'CANCELLED').length
    const freeTickets = tickets.filter(t => Number(t.prix) === 0).length
    const paidTickets = totalTickets - freeTickets

    // Validations récentes (selon le timeframe)
    const recentValidations = tickets
      .filter(t => t.validatedAt && t.validatedAt >= startTime)
      .map(t => ({
        id: t.id,
        numeroTicket: t.numeroTicket,
        validatedAt: t.validatedAt!.toISOString(),
        validatedBy: t.validatedBy,
        prix: Number(t.prix),
        isGratuit: Number(t.prix) === 0,
        holder: t.user ? {
          type: 'user',
          nom: `${t.user.prenom} ${t.user.nom}`,
          email: t.user.email
        } : {
          type: 'guest',
          nom: `${t.guestPrenom} ${t.guestNom}`,
          email: t.guestEmail
        }
      }))
      .sort((a, b) => new Date(b.validatedAt).getTime() - new Date(a.validatedAt).getTime())

    // Statistiques par intervalle (heures pour 24h, jours pour 7d)
    const intervals = timeframe === '7d' ? 7 : timeframe === '24h' ? 24 : 1
    const intervalType = timeframe === '7d' ? 'day' : 'hour'
    
    const validationsByInterval = Array.from({ length: intervals }, (_, i) => {
      const intervalStart = new Date(now)
      const intervalEnd = new Date(now)
      
      if (intervalType === 'day') {
        intervalStart.setDate(intervalStart.getDate() - (intervals - 1 - i))
        intervalStart.setHours(0, 0, 0, 0)
        intervalEnd.setDate(intervalEnd.getDate() - (intervals - 1 - i))
        intervalEnd.setHours(23, 59, 59, 999)
      } else {
        intervalStart.setHours(intervalStart.getHours() - (intervals - 1 - i))
        intervalStart.setMinutes(0, 0, 0)
        intervalEnd.setHours(intervalEnd.getHours() - (intervals - 1 - i))
        intervalEnd.setMinutes(59, 59, 999)
      }
      
      const validationsInInterval = recentValidations.filter(v => {
        const validatedTime = new Date(v.validatedAt)
        return validatedTime >= intervalStart && validatedTime <= intervalEnd
      })

      return {
        [intervalType]: intervalType === 'day' ? 
          intervalStart.toISOString().split('T')[0] : 
          intervalStart.getHours(),
        validations: validationsInInterval.length,
        freeValidations: validationsInInterval.filter(v => v.isGratuit).length,
        paidValidations: validationsInInterval.filter(v => !v.isGratuit).length,
        period: intervalType === 'day' ? 
          intervalStart.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) :
          `${intervalStart.getHours()}h-${intervalEnd.getHours()}h`
      }
    })

    // Top validateurs (admins qui scannent le plus)
    const topValidators = await prisma.ticket.groupBy({
      by: ['validatedBy'],
      where: {
        eventId,
        validatedAt: { gte: startTime },
        validatedBy: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    })

    // Enrichir avec les infos des admins
    const validatorsWithDetails = await Promise.all(
      topValidators.map(async (validator) => {
        const admin = await prisma.user.findUnique({
          where: { id: validator.validatedBy! },
          select: { nom: true, prenom: true, email: true }
        })
        
        return {
          adminId: validator.validatedBy,
          admin: admin ? {
            nom: `${admin.prenom} ${admin.nom}`,
            email: admin.email
          } : { nom: 'Admin supprimé', email: '' },
          validations: validator._count.id
        }
      })
    )

    const response = {
      event: {
        id: event.id,
        titre: event.titre,
        lieu: event.lieu,
        dateDebut: event.dateDebut.toISOString(),
        dateFin: event.dateFin.toISOString(),
        statut: event.statut,
        isEventActive: event.statut === 'ACTIVE' && 
                       now >= event.dateDebut && 
                       now <= event.dateFin
      },
      
      timeframe: {
        type: timeframe,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        label: timeframe === '1h' ? 'Dernière heure' :
               timeframe === '24h' ? 'Dernières 24h' :
               'Derniers 7 jours'
      },
      
      stats: {
        totalTickets,
        validTickets,
        usedTickets,
        cancelledTickets,
        freeTickets,
        paidTickets,
        validationRate: totalTickets > 0 ? Math.round((usedTickets / totalTickets) * 100) : 0,
        remainingToValidate: validTickets,
        recentValidationsCount: recentValidations.length
      },
      
      recentValidations: recentValidations.slice(0, 50), // Dernières 50 validations
      validationsByInterval,
      topValidators: validatorsWithDetails,
      
      scanActivity: {
        lastHour: tickets.filter(t => 
          t.validatedAt && 
          t.validatedAt >= new Date(now.getTime() - 60 * 60 * 1000)
        ).length,
        currentSession: recentValidations.length,
        peakHour: validationsByInterval.reduce((peak, current) => 
          current.validations > peak.validations ? current : peak, 
          { validations: 0, period: 'Aucune' }
        )
      },
      
      // Données temps réel pour dashboard
      realtime: {
        timestamp: now.toISOString(),
        nextRefresh: new Date(now.getTime() + 30000).toISOString(), // 30 secondes
        isLive: event.statut === 'ACTIVE' && now >= event.dateDebut && now <= event.dateFin
      }
    }

    return createApiResponse(response)

  } catch (error) {
    console.error('❌ Erreur API scanner stats:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}