// app/api/user/tickets/[id]/pdf/route.ts
import { NextRequest } from 'next/server'
import { 
  createApiResponse, 
  createApiError,
  authenticateRequest
} from '@/lib/api-utils'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET - Générer et télécharger le PDF d'un billet
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Non autorisé', 401)
    }

    const ticketId = params.id
    const userId = user.userId

    // Récupérer le billet avec toutes les informations nécessaires
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId: userId // S'assurer que l'utilisateur possède ce billet
      },
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
            categories: true
          }
        },
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé', 404)
    }

    // Générer le HTML du billet pour le PDF
    const ticketHTML = generateTicketHTML(ticket)

    // En production, vous utiliseriez une librairie comme puppeteer ou jsPDF
    // Pour l'instant, on retourne le HTML qui peut être converti côté client
    const response = new Response(ticketHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="billet-${ticket.numeroTicket}.html"`
      }
    })

    return response

  } catch (error) {
    console.error('Erreur génération PDF billet:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur interne du serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

function generateTicketHTML(ticket: any): string {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price / 100) // Conversion depuis les centimes
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Billet - ${ticket.event.titre}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .ticket {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            max-width: 800px;
            width: 100%;
            position: relative;
        }
        
        .ticket::before {
            content: '';
            position: absolute;
            top: 50%;
            right: -10px;
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            transform: translateY(-50%);
        }
        
        .ticket::after {
            content: '';
            position: absolute;
            top: 50%;
            left: -10px;
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            transform: translateY(-50%);
        }
        
        .ticket-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }
        
        .ticket-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .ticket-subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .ticket-body {
            padding: 40px;
            display: grid;
            grid-template-columns: 1fr 200px;
            gap: 40px;
        }
        
        .ticket-info {
            display: grid;
            gap: 20px;
        }
        
        .info-group {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .info-icon {
            width: 24px;
            height: 24px;
            background: #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            flex-shrink: 0;
        }
        
        .info-content h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .info-content p {
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }
        
        .qr-section {
            text-align: center;
            padding: 20px;
            border: 2px dashed #ddd;
            border-radius: 10px;
        }
        
        .qr-code {
            width: 150px;
            height: 150px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 10px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #666;
            position: relative;
        }
        
        .ticket-number {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            color: #667eea;
            margin-top: 10px;
        }
        
        .ticket-footer {
            background: #f8f9fa;
            padding: 20px 40px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        
        .price-badge {
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
        }
        
        .status-badge {
            background: #17a2b8;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="ticket-header">
            <div class="ticket-title">${ticket.event.titre}</div>
            <div class="ticket-subtitle">Organisé par ${ticket.event.organisateur}</div>
            <span class="status-badge">${getStatusLabel(ticket.statut)}</span>
        </div>
        
        <div class="ticket-body">
            <div class="ticket-info">
                <div class="info-group">
                    <div class="info-icon">📅</div>
                    <div class="info-content">
                        <h3>Date et heure</h3>
                        <p>${formatDate(ticket.event.dateDebut)}</p>
                    </div>
                </div>
                
                <div class="info-group">
                    <div class="info-icon">📍</div>
                    <div class="info-content">
                        <h3>Lieu</h3>
                        <p>${ticket.event.lieu}</p>
                        <p style="font-size: 14px; color: #666; font-weight: normal;">${ticket.event.adresse}</p>
                    </div>
                </div>
                
                <div class="info-group">
                    <div class="info-icon">👤</div>
                    <div class="info-content">
                        <h3>Titulaire</h3>
                        <p>${ticket.user.prenom} ${ticket.user.nom}</p>
                        <p style="font-size: 14px; color: #666; font-weight: normal;">${ticket.user.email}</p>
                    </div>
                </div>
                
                <div class="info-group">
                    <div class="info-icon">💰</div>
                    <div class="info-content">
                        <h3>Prix</h3>
                        <p>${formatPrice(ticket.prix)}</p>
                    </div>
                </div>
                
                ${ticket.validatedAt ? `
                <div class="info-group">
                    <div class="info-icon">✅</div>
                    <div class="info-content">
                        <h3>Validé le</h3>
                        <p>${formatDate(new Date(ticket.validatedAt))}</p>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="qr-section">
                <div class="qr-code">
                    <!-- En production, insérez ici le QR code généré -->
                    <div style="text-align: center;">
                        <div style="font-size: 16px; margin-bottom: 10px;">📱</div>
                        <div>QR Code</div>
                        <div style="font-size: 10px; margin-top: 5px;">Scannez à l'entrée</div>
                    </div>
                </div>
                <div class="ticket-number">${ticket.numeroTicket}</div>
                <p style="font-size: 11px; color: #666; margin-top: 10px;">
                    Présentez ce QR code à l'entrée
                </p>
            </div>
        </div>
        
        <div class="ticket-footer">
            <p><strong>Conditions importantes :</strong></p>
            <p>• Ce billet est personnel et non cessible</p>
            <p>• Présentez-vous 30 minutes avant le début de l'événement</p>
            <p>• En cas de perte, contactez le support avec votre numéro de billet</p>
            <p style="margin-top: 10px;">
                Billet généré le ${formatDate(new Date())} • 
                Support: support@votreplateforme.com
            </p>
        </div>
    </div>
</body>
</html>
  `
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'VALID': return 'Valide'
    case 'USED': return 'Utilisé'
    case 'CANCELLED': return 'Annulé'
    case 'EXPIRED': return 'Expiré'
    default: return status
  }
}