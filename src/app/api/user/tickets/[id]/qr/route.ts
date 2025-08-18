// src/app/api/user/billets/[id]/qr/route.ts - API pour QR codes spécifiques
import { NextRequest } from 'next/server'
import { createApiResponse, createApiError, authenticateRequest, getClientIP } from '@/lib/api-utils'
import { JWTPayload } from '@/types/api'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// GET - Récupérer le QR code d'un billet spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    if (user.role !== 'USER') {
      return createApiError('FORBIDDEN', 'Accès réservé aux utilisateurs', 403)
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json, png, svg
    const size = parseInt(searchParams.get('size') || '200')

    // Vérifier que l'utilisateur possède ce billet
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        statut: { not: 'CANCELLED' }
      },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            lieu: true,
            dateDebut: true,
            dateFin: true,
            organisateur: true,
            statut: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé ou non autorisé', 404)
    }

    // Vérifier que le billet peut afficher un QR code
    if (!['VALID', 'USED'].includes(ticket.statut)) {
      return createApiError('INVALID_TICKET_STATUS', 'Ce billet ne peut pas afficher de QR code', 400)
    }

    const qrData = {
      ticketId: ticket.id,
      numeroTicket: ticket.numeroTicket,
      qrCode: ticket.qrCode,
      eventId: ticket.event.id,
      eventTitle: ticket.event.titre,
      eventDate: ticket.event.dateDebut.toISOString(),
      eventVenue: ticket.event.lieu,
      userId: user.id,
      generatedAt: new Date().toISOString()
    }

    // Log de l'accès au QR code
    await prisma.activityLog.create({
      data: {
        type: 'USER_ACTION',
        entity: 'ticket',
        entityId: ticket.id,
        action: 'qr_access',
        newData: {
          ticketNumber: ticket.numeroTicket,
          eventTitle: ticket.event.titre,
          format,
          userAgent: request.headers.get('user-agent')
        },
        userId: user.id,
        metadata: {
          ipAddress: getClientIP(request) || 'unknown'
        }
      }
    }).catch(err => console.error('❌ Erreur log QR access:', err))

    // Retourner selon le format demandé
    switch (format) {
      case 'png':
        // TODO: Générer une vraie image PNG du QR code
        return new Response('QR Code PNG generation not implemented yet', {
          status: 501,
          headers: { 'Content-Type': 'text/plain' }
        })

      case 'svg':
        // Générer un QR code SVG simple
        const svgQR = generateSVGQRCode(ticket.qrCode, size)
        return new Response(svgQR, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })

      case 'json':
      default:
        return createApiResponse({
          qrData,
          ticket: {
            id: ticket.id,
            numeroTicket: ticket.numeroTicket,
            statut: ticket.statut,
            prix: Number(ticket.prix),
            canValidate: ticket.statut === 'VALID',
            event: {
              id: ticket.event.id,
              titre: ticket.event.titre,
              lieu: ticket.event.lieu,
              dateDebut: ticket.event.dateDebut.toISOString(),
              dateFin: ticket.event.dateFin.toISOString(),
              organisateur: ticket.event.organisateur,
              statut: ticket.event.statut
            }
          },
          security: {
            generatedAt: qrData.generatedAt,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
            checksum: generateChecksum(ticket.qrCode, ticket.id, user.id)
          }
        })
    }

  } catch (error) {
    console.error('❌ Erreur API QR code:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Régénérer le QR code d'un billet (si nécessaire)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user: JWTPayload | null = await authenticateRequest(request)
    
    if (!user) {
      return createApiError('UNAUTHORIZED', 'Authentification requise', 401)
    }

    if (user.role !== 'USER') {
      return createApiError('FORBIDDEN', 'Accès réservé aux utilisateurs', 403)
    }

    const body = await request.json()
    const { reason } = body

    // Vérifier que l'utilisateur possède ce billet
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        statut: 'VALID' // Seuls les billets valides peuvent être régénérés
      },
      include: {
        event: {
          select: {
            id: true,
            titre: true,
            statut: true
          }
        }
      }
    })

    if (!ticket) {
      return createApiError('TICKET_NOT_FOUND', 'Billet non trouvé ou non modifiable', 404)
    }

    // Générer un nouveau QR code
    const newQRCode = `QR-${ticket.numeroTicket}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Mettre à jour le billet
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: { 
        qrCode: newQRCode,
        updatedAt: new Date()
      }
    })

    // Log de la régénération
    await prisma.activityLog.create({
      data: {
        type: 'USER_ACTION',
        entity: 'ticket',
        entityId: ticket.id,
        action: 'qr_regenerated',
        oldData: { oldQRCode: ticket.qrCode },
        newData: { 
          newQRCode: newQRCode,
          reason: reason || 'User request'
        },
        userId: user.id
      }
    }).catch(err => console.error('❌ Erreur log QR regen:', err))

    return createApiResponse({
      message: 'QR code régénéré avec succès',
      ticket: {
        id: updatedTicket.id,
        numeroTicket: updatedTicket.numeroTicket,
        qrCode: updatedTicket.qrCode,
        updatedAt: updatedTicket.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Erreur régénération QR:', error)
    return createApiError('INTERNAL_ERROR', 'Erreur serveur', 500)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction utilitaire pour générer un QR code SVG simple
function generateSVGQRCode(data: string, size: number = 200): string {
  // Version simplifiée - dans un vrai projet, utiliser une vraie librairie QR
  const gridSize = 25
  const cellSize = size / gridSize
  
  let cells = ''
  
  // Générer un pattern pseudo-aléatoire basé sur les données
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const hash = data.charCodeAt((i * gridSize + j) % data.length)
      if (hash % 3 === 0) {
        cells += `<rect x="${i * cellSize}" y="${j * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`
      }
    }
  }
  
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="white"/>
  ${cells}
  <!-- Coins de position -->
  <rect x="0" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="black"/>
  <rect x="${cellSize}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="white"/>
  <rect x="${cellSize * 2}" y="${cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="black"/>
  
  <rect x="${size - cellSize * 7}" y="0" width="${cellSize * 7}" height="${cellSize * 7}" fill="black"/>
  <rect x="${size - cellSize * 6}" y="${cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="white"/>
  <rect x="${size - cellSize * 5}" y="${cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="black"/>
  
  <rect x="0" y="${size - cellSize * 7}" width="${cellSize * 7}" height="${cellSize * 7}" fill="black"/>
  <rect x="${cellSize}" y="${size - cellSize * 6}" width="${cellSize * 5}" height="${cellSize * 5}" fill="white"/>
  <rect x="${cellSize * 2}" y="${size - cellSize * 5}" width="${cellSize * 3}" height="${cellSize * 3}" fill="black"/>
</svg>`.trim()
}

// Fonction utilitaire pour générer un checksum de sécurité
function generateChecksum(qrCode: string, ticketId: string, userId: string): string {
  const data = `${qrCode}-${ticketId}-${userId}-${Date.now()}`
  // Version simplifiée - dans un vrai projet, utiliser crypto
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}