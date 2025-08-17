// src/app/api/user/billets/[id]/pdf/route.ts - Génération PDF des billets
import { NextRequest } from 'next/server'
import { createApiError, authenticateRequest } from '@/lib/api-utils'
import { JWTPayload } from '@/types/api'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET - Télécharger le billet en PDF
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    if (user.role !== 'USER') {
      return createApiError('FORBIDDEN', 'Accès réservé aux utilisateurs', 403)
    }

    // Vérifier que l'utilisateur possède ce billet
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        statut: { not: 'CANCELLED' }
      },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        },
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
            statut: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Vérifier que le billet peut être téléchargé
    if (!['VALID', 'USED'].includes(ticket.statut)) {
      return createApiError('INVALID_TICKET_STATUS', 'Ce billet ne peut pas être téléchargé', 400)
    }

    // Générer le contenu PDF (version texte pour l'instant)
    const pdfContent = generateTicketPDF(ticket, user)

    // Log du téléchargement
    await prisma.activityLog.create({
      data: {
        type: 'USER_ACTION',
        entity: 'ticket',
        entityId: ticket.id,
        action: 'pdf_download',
        newData: {
          ticketNumber: ticket.numeroTicket,
          eventTitle: ticket.event.titre,
          downloadedAt: new Date().toISOString()
        },
        userId: user.id,
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.ip || 'unknown'
        }
      }
    }).catch(err => console.error('❌ Erreur log PDF download:', err))

    // Retourner le PDF (pour l'instant en texte, à remplacer par un vrai PDF)
    return new Response(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="billet-${ticket.numeroTicket}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction pour générer le contenu du billet PDF
function generateTicketPDF(ticket: any, user: JWTPayload): string {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price / 100)
  }

  // Template du billet (à remplacer par une vraie génération PDF)
  return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1200
>>
stream
BT
/F1 16 Tf
50 720 Td
(BILLET ÉLECTRONIQUE) Tj
0 -40 Td
/F1 12 Tf
(━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━) Tj
0 -30 Td
/F1 14 Tf
(${ticket.event.titre}) Tj
0 -25 Td
/F1 10 Tf
(${formatDate(ticket.event.dateDebut)}) Tj
0 -20 Td
(${ticket.event.lieu}) Tj
0 -15 Td
(${ticket.event.adresse || ''}) Tj
0 -30 Td
(━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━) Tj
0 -25 Td
/F1 12 Tf
(INFORMATIONS DU BILLET) Tj
0 -20 Td
/F1 10 Tf
(Numéro: ${ticket.numeroTicket}) Tj
0 -15 Td
(Prix: ${formatPrice(ticket.prix)}) Tj
0 -15 Td
(Statut: ${ticket.statut}) Tj
0 -15 Td
(Titulaire: ${ticket.user.prenom} ${ticket.user.nom}) Tj
0 -15 Td
(Email: ${ticket.user.email}) Tj
0 -30 Td
(━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━) Tj
0 -25 Td
/F1 12 Tf
(QR CODE) Tj
0 -20 Td
/F1 10 Tf
(${ticket.qrCode}) Tj
0 -30 Td
(Présentez ce billet à l'entrée de l'événement) Tj
0 -15 Td
(Assurez-vous que le QR code soit bien visible) Tj
0 -30 Td
(━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━) Tj
0 -25 Td
/F1 8 Tf
(Organisateur: ${ticket.event.organisateur}) Tj
0 -12 Td
(Généré le: ${new Date().toLocaleString('fr-FR')}) Tj
0 -12 Td
(Billet électronique valide - Merci de votre confiance) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000284 00000 n 
0000001540 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1625
%%EOF
`.trim()
}