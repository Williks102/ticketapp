// Mettre à jour: src/app/page.tsx
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// Version simplifiée sans appels BDD pour éviter les erreurs
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar />
      
      {/* Contenu principal */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-50 to-white-100 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Découvrez vos prochains
              <span className="text-orange-600 block">événements</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Réservez vos billets en toute simplicité pour les concerts, spectacles, 
              festivals et événements près de chez vous.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/evenements" 
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 py-3 rounded-lg transition-colors text-lg"
              >
                Voir les événements
              </a>
              <a 
                href="/admin/events/new" 
                className="bg-white hover:bg-gray-50 text-orange-600 font-medium px-8 py-3 rounded-lg border border-orange-600 transition-colors text-lg"
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
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="lieu"
                      placeholder="Ville ou lieu..."
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <select 
                      name="category"
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Toutes catégories</option>
                      <option value="concerts">Concerts</option>
                      <option value="theatre">Théâtre</option>
                      <option value="festivals">Festivals</option>
                      <option value="sport">Sport</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Rechercher
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Message temporaire */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Configuration en cours
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Les événements seront bientôt disponibles
            </p>
            <a 
              href="/admin/events/new" 
              className="bg-orange-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Créer votre premier événement
            </a>
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
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}