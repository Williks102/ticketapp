// src/hooks/useIsClient.ts
import { useEffect, useState } from 'react'

/**
 * Hook pour gérer l'hydratation côté client
 * Résout les erreurs "mounted" et "setMounted" introuvables
 * Évite les problèmes d'hydratation entre serveur et client
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // S'exécute uniquement côté client après l'hydratation
    setIsClient(true)
  }, [])

  return isClient
}