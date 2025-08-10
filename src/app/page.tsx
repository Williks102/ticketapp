// src/app/page.tsx - AVEC APPELS BDD RÉELS

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { EventResponse } from '@/types/api'

// Fonction pour récupérer les événements depuis l'API
async function getEvents(): Promise<EventResponse[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/events?limit=6&status=ACTIVE&sortBy=date&sortOrder=asc`, {
      cache: 'no-store', // Pour avoir les données les plus récentes
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des événements')
    }
    
    const data = await response.json()
    return data.data?.events || []
  } catch (error) {
    console.error('Erreur:', error)
    return []
  }
}

// Fonction pour récupérer les statistiques du dashboard
async function getStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/dashboard/stats`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques')
    }
    
    const data = await response.json()
    return data.data || { totalEvents: 0, totalTickets: 0, totalUsers: 0 }
  } catch (error) {
    console.error('Erreur stats:', error)
    return { totalEvents: 0, totalTickets: 0, totalUsers: 0 }
  }
}

export default async function HomePage() {
  // Récupération des données côté serveur
  const [events, stats] = await Promise.all([
    getEvents(),
    getStats()
  ])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar />
      
      {/* Contenu principal */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Découvrez vos prochains
              <span className="text-blue-600 block">événements</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Réservez vos billets en toute simplicité pour les concerts, spectacles, 
              festivals et événements près de chez vous.
            </p>
            
            {/* Statistiques en temps réel */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{stats.totalEvents}</div>
                <div className="text-gray-600">Événements actifs</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{stats.totalTickets}</div>
                <div className="text-gray-600">Billets vendus</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">{stats.totalUsers}</div>
                <div className="text-gray-600">Utilisateurs</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/evenements" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors text-lg"
              >
                Voir les événements
              </a>
              <a 
                href="/admin/events/new" 
                className="bg-white hover:bg-gray-50 text-blue-600 font-medium px-8 py-3 rounded-lg border border-blue-600 transition-colors text-lg"
              >
                Organiser un événement
              </a>
            </div>
          </div>
        </section>

        {/* Barre de recherche */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 -mt-10 relative z-10">
                <form action="/evenements" method="GET" className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="search"
                      placeholder="Rechercher un événement..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="lieu"
                      placeholder="Ville ou lieu..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <select 
                      name="category"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Toutes catégories</option>
                      <option value="concerts">Concerts</option>
                      <option value="theatre">Théâtre</option>
                      <option value="festivals">Festivals</option>
                      <option value="sport">Sport</option>
                      <option value="expositions">Expositions</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Rechercher
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Événements populaires - DONNÉES RÉELLES */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Événements à venir
              </h2>
              <p className="text-xl text-gray-600">
                {events.length > 0 
                  ? `Découvrez les ${events.length} prochains événements` 
                  : 'Aucun événement disponible pour le moment'
                }
              </p>
            </div>

            {/* Grille d'événements avec données réelles */}
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image de l'événement */}
                    <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative">
                      {event.image ? (
                        <img 
                          src={event.image} 
                          alt={event.titre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-16 h-16 text-white/70" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                          </svg>
                        </div>
                      )}
                      
                      {/* Badge statut */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          event.statut === 'ACTIVE' 
                            ? 'bg-green-500 text-white' 
                            : event.statut === 'COMPLET'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {event.statut === 'ACTIVE' ? 'Disponible' : 
                           event.statut === 'COMPLET' ? 'Complet' : 
                           event.statut}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Date */}
                      <div className="text-sm text-blue-600 font-medium mb-2">
                        {formatDate(event.dateDebut)}
                      </div>
                      
                      {/* Titre */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {event.titre}
                      </h3>
                      
                      {/* Lieu */}
                      <p className="text-gray-600 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                        {event.lieu}
                      </p>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      {/* Places restantes */}
                      <div className="text-sm text-gray-500 mb-4">
                        {event.placesRestantes > 0 
                          ? `${event.placesRestantes} places restantes`
                          : 'Plus de places disponibles'
                        }
                      </div>
                      
                      {/* Prix et bouton */}
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(event.prix)}
                        </span>
                        <a
                          href={`/reservation/${event.id}`}
                          className={`font-medium px-4 py-2 rounded-lg transition-colors ${
                            event.placesRestantes > 0 && event.statut === 'ACTIVE'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {event.placesRestantes > 0 && event.statut === 'ACTIVE' 
                            ? 'Réserver' 
                            : 'Indisponible'
                          }
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Message si aucun événement
              <div className="text-center py-12">
                <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 className="text-xl font-medium text-gray-500 mb-2">
                  Aucun événement disponible
                </h3>
                <p className="text-gray-400 mb-6">
                  Les organisateurs n'ont pas encore publié d'événements.
                </p>
                <a 
                  href="/admin/events/new" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Créer le premier événement
                </a>
              </div>
            )}

            {/* Lien vers tous les événements */}
            {events.length > 0 && (
              <div className="text-center mt-12">
                <a 
                  href="/evenements" 
                  className="bg-white hover:bg-gray-50 text-blue-600 font-medium px-8 py-3 rounded-lg border border-blue-600 transition-colors text-lg"
                >
                  Voir tous les événements
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Catégories */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Explorez par catégorie
              </h2>
              <p className="text-xl text-gray-600">
                Trouvez exactement ce que vous cherchez
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Concerts */}
              <a href="/evenements?category=concerts" className="group text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Concerts</h3>
                <p className="text-gray-600">Jazz, Rock, Pop, Classique</p>
              </a>

              {/* Théâtre */}
              <a href="/evenements?category=theatre" className="group text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-200 transition-colors">
                  <svg className="w-8 h-8 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Théâtre</h3>
                <p className="text-gray-600">Comédie, Drame, Musical</p>
              </a>

              {/* Festivals */}
              <a href="/evenements?category=festivals" className="group text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                  <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Festivals</h3>
                <p className="text-gray-600">Musique, Gastronomie, Art</p>
              </a>

              {/* Sport */}
              <a href="/evenements?category=sport" className="group text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sport</h3>
                <p className="text-gray-600">Football, Tennis, Basketball</p>
              </a>
            </div>
          </div>
        </section>

        {/* Pourquoi nous choisir */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pourquoi choisir Simple Billet ?
              </h2>
              <p className="text-xl text-gray-600">
                Une expérience de réservation simplifiée et sécurisée
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Avantage 1 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Paiement sécurisé
                </h3>
                <p className="text-gray-600">
                  Vos transactions sont protégées par un cryptage de niveau bancaire
                </p>
              </div>

              {/* Avantage 2 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Réservation instantanée
                </h3>
                <p className="text-gray-600">
                  Recevez vos billets immédiatement par email après votre achat
                </p>
              </div>

              {/* Avantage 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Support 24/7
                </h3>
                <p className="text-gray-600">
                  Notre équipe est disponible pour vous aider à tout moment
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}