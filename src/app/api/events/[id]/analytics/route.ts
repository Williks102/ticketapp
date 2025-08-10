// app/api/events/[id]/analytics/route.ts
export async function GET(
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

    // Récupérer les statistiques détaillées de l'événement
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        tickets: {
          select: {
            id: true,
            prix: true,
            statut: true,
            createdAt: true
          }
        }
      }
    })

    if (!event) {
      return createApiError(
        'EVENT_NOT_FOUND',
        'Événement non trouvé',
        404
      )
    }

    const validTickets = event.tickets.filter(t => t.statut !== 'CANCELLED')
    const totalTickets = validTickets.length
    const revenue = validTickets.reduce((sum, ticket) => sum + ticket.prix, 0)
    
    // Calculer les ventes par jour
    const salesByDay = validTickets.reduce((acc: any, ticket) => {
      const date = ticket.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, tickets: 0, revenue: 0 }
      }
      acc[date].tickets++
      acc[date].revenue += ticket.prix
      return acc
    }, {})

    const salesByDayArray = Object.values(salesByDay).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    )

    // Calculer le taux de conversion (simplifié)
    const conversionRate = event.nbPlaces > 0 ? (totalTickets / event.nbPlaces) * 100 : 0

    const analytics = {
      eventId: event.id,
      totalTickets,
      revenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
      salesByDay: salesByDayArray,
      averageTicketPrice: totalTickets > 0 ? revenue / totalTickets : 0,
      soldOutPercentage: (totalTickets / event.nbPlaces) * 100
    }

    return createApiResponse(analytics)

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}