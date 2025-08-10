// app/api/tickets/[id]/pdf/route.ts
import { NextRequest } from 'next/server'
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


export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createApiError(
        'UNAUTHORIZED',
        'Authentification requise',
        401
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        event: true,
        user: true
      }
    })

    if (!ticket) {
      return createApiError(
        'TICKET_NOT_FOUND',
        'Billet non trouvé',
        404
      )
    }

    // Vérifier les permissions
    if (!requireAdmin(user) && ticket.userId !== user.userId) {
      return createApiError(
        'FORBIDDEN',
        'Accès interdit à ce billet',
        403
      )
    }

    // Générer le PDF (implémentation simplifiée)
    // Dans une vraie application, utiliser jsPDF ou Puppeteer
    const pdfContent = `
      Billet: ${ticket.numeroTicket}
      Événement: ${ticket.event.titre}
      Lieu: ${ticket.event.lieu}
      Date: ${ticket.event.dateDebut.toLocaleDateString('fr-FR')}
      Prix: ${ticket.prix}€
      Statut: ${ticket.statut}
    `

    // Retourner le contenu PDF (ici simulé)
    return new Response(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="billet-${ticket.numeroTicket}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    return createApiError(
      'INTERNAL_ERROR',
      'Erreur interne du serveur',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}