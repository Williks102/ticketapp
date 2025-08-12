import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest } from '@/lib/api-utils'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    // Seuls les USER peuvent accéder (pas les admins)
    if (user.role !== 'USER') {
      return createApiError('FORBIDDEN', 'Accès réservé aux utilisateurs', 403)
    }

    console.log(`👤 User ${user.email} accède à ses statistiques personnelles`)

    // 👤 STATISTIQUES PERSONNELLES UNIQUEMENT
    const userTickets = await prisma.ticket.findMany({
      where: { 
        userId: user.id, 
        statut: { not: 'CANCELLED' } 
      },
      include: { 
        event: { 
          select: { 
            id: true,
            titre: true, 
            dateDebut: true, 
            dateFin: true,
            lieu: true,
            statut: true 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalTickets = userTickets.length
    const totalSpent = userTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)
    const eventsAttended = new Set(userTickets.map(t => t.eventId)).size
    
    const now = new Date()
    const upcomingTickets = userTickets.filter(t => new Date(t.event.dateDebut) > now)
    const pastTickets = userTickets.filter(t => new Date(t.event.dateFin) <= now)
    const usedTickets = userTickets.filter(t => t.statut === 'USED')

    // Statistiques mensuelles
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const thisMonthTickets = userTickets.filter(t => new Date(t.createdAt) >= thisMonth)
    const thisMonthSpent = thisMonthTickets.reduce((sum, ticket) => sum + Number(ticket.prix), 0)

    // Catégories préférées (basées sur les événements fréquentés)
    const categoryStats = userTickets.reduce((acc: any, ticket) => {
      const categories = ticket.event.categories || []
      categories.forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1
      })
      return acc
    }, {})

    const favoriteCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))

    const userStats = {
      // 📊 Statistiques personnelles
      totalTickets,
      totalSpent,
      eventsAttended,
      upcomingEvents: upcomingTickets.length,
      pastEvents: pastTickets.length,
      usedTickets: usedTickets.length,
      
      // 📈 Données mensuelles
      thisMonthTickets: thisMonthTickets.length,
      thisMonthSpent,
      
      // 🎯 Préférences
      favoriteCategories,
      averageTicketPrice: totalTickets > 0 ? Math.round(totalSpent / totalTickets) : 0,
      
      // 📅 Activité récente
      recentTickets: userTickets.slice(0, 5).map(ticket => ({
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        eventTitle: ticket.event.titre,
        eventDate: ticket.event.dateDebut.toISOString(),
        price: ticket.prix,
        status: ticket.statut,
        venue: ticket.event.lieu,
        purchaseDate: ticket.createdAt.toISOString()
      }))
    }

    return createApiResponse(userStats)

  } catch (error) {
    console.error('❌ Erreur API user stats:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}