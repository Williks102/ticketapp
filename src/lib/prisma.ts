// src/lib/prisma.ts - VERSION CORRIGÉE SANS $USE
import { PrismaClient } from '@prisma/client'

// Configuration globale pour éviter les multiples instances en développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuration du client Prisma CORRIGÉE
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  }
})

// ✅ SUPPRESSION DES MIDDLEWARES $use (dépréciés)
// Les middlewares $use ne sont plus supportés dans les versions récentes de Prisma
// À la place, nous utilisons des fonctions helper pour la gestion des dates

// Éviter les multiples instances en développement
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

// Fonction utilitaire pour la déconnexion propre
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Erreur lors de la déconnexion de Prisma:', error)
  }
}

// Fonction utilitaire pour vérifier la connexion
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Connexion à la base de données établie')
    return true
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error)
    return false
  }
}

// Fonction utilitaire pour les transactions sécurisées
export async function executeTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(fn, {
      maxWait: 5000, // 5 secondes max d'attente
      timeout: 10000, // 10 secondes max d'exécution
      isolationLevel: 'ReadCommitted'
    })
  } catch (error) {
    console.error('Erreur lors de la transaction:', error)
    throw error
  }
}

// ========================================
// FONCTIONS HELPER POUR LES DATES
// ========================================

// Helper pour créer des données avec timestamp ivoirien
export function createWithIvorianTime<T extends { createdAt?: Date; updatedAt?: Date }>(
  data: T
): T & { createdAt: Date; updatedAt: Date } {
  const now = new Date()
  return {
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: now
  }
}

// Helper pour mettre à jour avec timestamp ivoirien
export function updateWithIvorianTime<T extends { updatedAt?: Date }>(
  data: T
): T & { updatedAt: Date } {
  return {
    ...data,
    updatedAt: new Date()
  }
}

// ========================================
// FONCTIONS WRAPPER POUR LES OPÉRATIONS COURANTES
// ========================================

// Wrapper pour les créations avec gestion automatique des dates
export async function createWithTimestamp<T extends Record<string, any>>(
  model: any,
  data: T
) {
  return await model.create({
    data: createWithIvorianTime(data)
  })
}

// Wrapper pour les mises à jour avec gestion automatique des dates
export async function updateWithTimestamp<T extends Record<string, any>>(
  model: any,
  where: any,
  data: T
) {
  return await model.update({
    where,
    data: updateWithIvorianTime(data)
  })
}

// ========================================
// TYPES UTILITAIRES
// ========================================

// Type pour les transactions Prisma
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// ========================================
// GESTIONNAIRE D'ERREURS PRISMA
// ========================================

export function handlePrismaError(error: any) {
  console.error('[Prisma Error]:', {
    message: error.message,
    code: error.code,
    meta: error.meta,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
  
  // Mapper les erreurs Prisma vers des messages utilisateur-friendly
  if (error.code === 'P2002') {
    return {
      type: 'UNIQUE_CONSTRAINT',
      message: 'Cette donnée existe déjà',
      field: error.meta?.target?.[0] || 'unknown'
    }
  }
  
  if (error.code === 'P2003') {
    return {
      type: 'FOREIGN_KEY_CONSTRAINT',
      message: 'Référence invalide',
      field: error.meta?.field_name || 'unknown'
    }
  }
  
  if (error.code === 'P2025') {
    return {
      type: 'RECORD_NOT_FOUND',
      message: 'Enregistrement non trouvé',
      field: 'id'
    }
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: 'Erreur de base de données',
    field: 'unknown'
  }
}

// ========================================
// EXPORTS
// ========================================

export default prisma
export { prisma }

// Hook de nettoyage pour la fermeture de l'application
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    disconnectPrisma()
  })
}