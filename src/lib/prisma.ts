// src/lib/prisma.ts - VERSION CORRIGÉE SIMPLE
import { PrismaClient } from '@prisma/client'

// Configuration globale pour éviter les instances multiples en développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Instance Prisma avec configuration simplifiée
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty'
})

// Éviter les instances multiples en développement
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Fonction de déconnexion propre
async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
    console.log('🔌 Prisma disconnected')
  } catch (error) {
    console.error('❌ Erreur déconnexion Prisma:', error)
  }
}

// Export par défaut
export default prisma

// Types utiles réexportés depuis Prisma
export type {
  User,
  Event,
  Ticket,
  EventStats,
  ActivityLog,
  Payment,
  TempReservation,
  Role as UserRole,
  UserStatus,
  EventStatus,
  TicketStatus,
  ActivityType,
  PaymentStatus
} from '@prisma/client'

// Hook de nettoyage pour la fermeture de l'application
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    disconnectPrisma()
  })

  process.on('SIGINT', () => {
    disconnectPrisma()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    disconnectPrisma()
    process.exit(0)
  })
}