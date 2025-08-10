import Link from 'next/link'
import { EventCard } from '@/components/EventCard'
import { SearchBar } from '@/components/SearchBar'

// Données d'exemple - à remplacer par des données de la base
const eventsExemple = [
  {
    id: '1',
    titre: 'Concert de Jazz',
    description: 'Une soirée exceptionnelle avec les meilleurs musiciens de jazz de la région',
    lieu: 'Salle de spectacle Le Trianon',
    dateDebut: new Date('2024-12-15T20:00:00'),
    prix: 35.00,
    placesRestantes: 150,
    image: '/images/concert-jazz.jpg'
  },
  {
    id: '2',
    titre: 'Théâtre: Roméo et Juliette',
    description: 'La célèbre pièce de Shakespeare interprétée par la troupe locale',
    lieu: 'Théâtre Municipal',
    dateDebut: new Date('2024-12-20T19:30:00'),
    prix: 28.00,
    placesRestantes: 75,
    image: '/images/theatre.jpg'
  },
  {
    id: '3',
    titre: 'Festival Gastronomique',
    description: 'Découvrez les saveurs locales avec nos chefs renommés',
    lieu: 'Parc des Expositions',
    dateDebut: new Date('2024-12-22T12:00:00'),
    prix: 15.00,
    placesRestantes: 300,
    image: '/images/festival-gastro.jpg'
  }
]

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
          Découvrez les meilleurs événements
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Trouvez et réservez vos billets pour les concerts, spectacles, et événements près de chez vous
        </p>
        <SearchBar />
      </section>

      {/* Section Événements à la une */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Événements à la une</h2>
          <Link href="/evenements" className="btn-primary">
            Voir tous les événements
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsExemple.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* Section Avantages */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Paiement sécurisé</h3>
          <p className="text-gray-600">Vos données sont protégées avec un cryptage de niveau bancaire</p>
        </div>
        
        <div className="text-center">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Réservation instantanée</h3>
          <p className="text-gray-600">Recevez vos billets immédiatement par email</p>
        </div>
        
        <div className="text-center">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Billets authentiques</h3>
          <p className="text-gray-600">Tous nos billets sont vérifiés et authentiques</p>
        </div>
      </section>
    </div>
  )
}