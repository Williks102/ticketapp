// app/api/tickets/purchase/route.ts
import { 
  createApiResponse, 
  createApiError, 
  validateRequired,
  authenticateRequest,
  requireAdmin,
  comparePassword,
  generateToken,
  hashPassword,
  validateEmail,
  validatePassword,
  generateTicketNumber,
  generateQRCode
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'
import { PurchaseTicketRequest } from '@/types/api'

// POST /api/tickets/purchase - Acheter des billets
export async function POST(request: NextRequest) {
  try {
    const body: PurchaseTicketRequest = await request.json()

    // Validation des champs requis
    const requiredFields = ['eventId', 'quantity', 'userInfo']
    const validationErrors = validateRequired(body, requiredFields)

    if (validationErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Données manquantes',
        400,
        validationErrors
      )
    }

    // Validation des informations utilisateur
    const userInfoRequiredFields = ['email', 'nom', 'prenom']
    const userInfoErrors = validateRequired(body.userInfo, userInfoRequiredFields)

    if (userInfoErrors.length > 0) {
      return createApiError(
        'VALIDATION_ERROR',
        'Informations utilisateur manquantes',
        400,
        userInfoErrors
      )
    }

    // Vérifier que l'événement existe et est disponible
    const event = await prisma.event.findUnique({
      where: { id: body.eventId }
    })

    if (!event) {
      return createApiError(
        'EVENT_NOT_FOUND',
        'Événement non trouvé',
        404
      )
    }

    if (event.statut !== 'ACTIVE') {
      return createApiError(
        'EVENT_NOT_AVAILABLE',
        'Cet événement n\'est plus disponible à la vente',
        400
      )
    }

    if (event.placesRestantes < body.quantity) {
      return createApiError(
        'INSUFFICIENT_PLACES',
        `Seulement ${event.placesRestantes} places disponibles`,
        400
      )
    }

    // Vérifier si l'événement est dans le futur
    if (event.dateDebut <= new Date()) {
      return createApiError(
        'EVENT_PAST',
        'Impossible d\'acheter des billets pour un événement passé',
        400
      )
    }

    let userId: string | null = null

    // Gestion de l'utilisateur
    if (!body.guestPurchase) {
      // Vérifier si l'utilisateur existe
      let user = await prisma.user.findUnique({
        where: { email: body.userInfo.email }
      })

      if (user) {
        userId = user.id
      } else if (body.createAccount && body.password) {
        // Créer un nouveau compte
        const hashedPassword = await hashPassword(body.password)
        user = await prisma.user.create({
          data: {
            email: body.userInfo.email,
            nom: body.userInfo.nom,
            prenom: body.userInfo.prenom,
            telephone: body.userInfo.telephone,
            password: hashedPassword,
            role: 'USER'
          }
        })
        userId = user.id
      }
    }

    // Créer les billets
    const tickets = []
    
    for (let i = 0; i < body.quantity; i++) {
      const numeroTicket = generateTicketNumber()
      const qrCodeData = `${numeroTicket}|${event.id}|${body.userInfo.email}`
      const qrCode = await generateQRCode(qrCodeData)

      const ticketData: any = {
        numeroTicket,
        qrCode,
        prix: event.prix,
        eventId: event.id,
        statut: 'VALID'
      }

      if (userId) {
        ticketData.userId = userId
      } else {
        // Achat invité
        ticketData.guestEmail = body.userInfo.email
        ticketData.guestNom = body.userInfo.nom
        ticketData.guestPrenom = body.userInfo.prenom
        ticketData.guestTelephone = body.userInfo.telephone
      }

      const ticket = await prisma.ticket.create({
        data: ticketData,
        include: {
          event: {
            select: {
              id: true,
              titre: true,
              lieu: true,
              dateDebut: true,
              dateFin: true
            }
          }
        }
      })

      tickets.push(ticket)
    }

    // Mettre à jour le nombre de places restantes
    await prisma.event.update({
      where: { id: body.eventId },
      data: {
        placesRestantes: event.placesRestantes - body.quantity
      }
    })

    // Transformer les données de réponse
    const ticketsResponse: TicketResponse[] = tickets.map(ticket => ({
      id: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      statut: ticket.statut,
      prix: ticket.prix,
      createdAt: ticket.createdAt.toISOString(),
      event: {
        id: ticket.event.id,
        titre: ticket.event.titre,
        lieu: ticket.event.lieu,
        dateDebut: ticket.event.dateDebut.toISOString(),
        dateFin: ticket.event.dateFin.toISOString()
      },
      guestInfo: !userId ? {
        email: body.userInfo.email,
        nom: body.userInfo.nom,
        prenom: body.userInfo.prenom,
        telephone: body.userInfo.telephone
      } : undefined
    }))

    return createApiResponse(
      { 
        tickets: ticketsResponse,
        totalAmount: tickets.length * event.prix,
        message: `${tickets.length} billet(s) acheté(s) avec succès`
      },
      201
    )

  } catch (error) {
    console.error('Erreur lors de l\'achat des billets:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}
