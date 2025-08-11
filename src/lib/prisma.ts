// src/lib/prisma.ts - CLIENT PRISMA OPTIMISÉ
import { PrismaClient } from '@prisma/client'

// Configuration globale pour éviter les multiples instances en développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuration du client Prisma optimisée pour la Côte d'Ivoire
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Configuration optimisée pour la région
  __internal: {
    engine: {
      config: {
        // Configuration spécifique si nécessaire
      }
    }
  }
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

// Fonction utilitaire pour les requêtes avec retry automatique
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Retry seulement pour certains types d'erreurs
      if (
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017'    // Server has closed the connection
      ) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          console.log(`Tentative ${attempt} échouée, retry dans ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
      
      // Si ce n'est pas une erreur de retry ou si on a atteint le max, on lance l'erreur
      throw error
    }
  }
  
  throw lastError
}

// Types utilitaires pour le typage strict
export type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>

// Extensions pour faciliter l'utilisation
export const prismaExtended = prisma.$extends({
  result: {
    ticket: {
      // Calculer automatiquement le statut d'expiration
      isExpired: {
        needs: { createdAt: true },
        compute(ticket) {
          // Un billet expire 24h après la fin de l'événement
          // Cette logique peut être ajustée selon les besoins
          return false // Placeholder - à implémenter selon la logique métier
        }
      }
    },
    event: {
      // Calculer automatiquement les places vendues
      ticketsSold: {
        needs: { nbPlaces: true, placesRestantes: true },
        compute(event) {
          return event.nbPlaces - event.placesRestantes
        }
      },
      // Vérifier si l'événement est complet
      isFull: {
        needs: { placesRestantes: true },
        compute(event) {
          return event.placesRestantes <= 0
        }
      }
    }
  },
  query: {
    // Middleware spécifique pour les événements
    event: {
      create({ args, query }) {
        // S'assurer que placesRestantes = nbPlaces à la création
        if (args.data.nbPlaces && !args.data.placesRestantes) {
          args.data.placesRestantes = args.data.nbPlaces
        }
        return query(args)
      }
    }
  }
})

export default prisma
export { prisma, prismaExtended }