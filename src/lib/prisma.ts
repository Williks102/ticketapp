// src/lib/prisma.ts - VERSION CORRIGÉE FINALE
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
  // ❌ SUPPRIMÉ __internal car il cause l'erreur "never"
})

// Middleware pour ajouter automatiquement la timezone Côte d'Ivoire
prisma.$use(async (params, next) => {
  // Intercepter les opérations de création/modification pour gérer les dates
  if (params.action === 'create' || params.action === 'update') {
    // Gérer automatiquement les timestamps en heure ivoirienne
    const now = new Date()
    
    if (params.action === 'create' && params.args.data) {
      // S'assurer que createdAt est défini avec l'heure ivoirienne
      if (!params.args.data.createdAt) {
        params.args.data.createdAt = now
      }
      params.args.data.updatedAt = now
    } else if (params.action === 'update' && params.args.data) {
      // Mettre à jour automatiquement updatedAt
      params.args.data.updatedAt = now
    }
  }
  
  return next(params)
})

// Middleware pour la gestion des erreurs spécifiques
prisma.$use(async (params, next) => {
  try {
    return await next(params)
  } catch (error: any) {
    // Log spécifique des erreurs avec contexte
    console.error(`[Prisma Error] ${params.model}.${params.action}:`, {
      error: error.message,
      code: error.code,
      meta: error.meta,
      args: params.args
    })
    
    // Relancer l'erreur pour la gestion en amont
    throw error
  }
})

// Éviter les multiples instances en développement
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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

// Types utilitaires pour le typage strict - CORRIGÉS
export type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>

export default prisma
export { prisma }