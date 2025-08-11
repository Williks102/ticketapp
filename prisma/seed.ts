// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Nettoyer les données existantes
  await prisma.ticket.deleteMany()
  await prisma.eventStats.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.payment.deleteMany()

  console.log('🧹 Données existantes supprimées')

  // Créer des utilisateurs
  const adminPassword = await bcrypt.hash('admin123', 12)
  const userPassword = await bcrypt.hash('user123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@simplebillet.com',
      nom: 'Admin',
      prenom: 'Super',
      password: adminPassword,
      role: 'ADMIN',
      telephone: '06 12 34 56 78'
    }
  })

  const user1 = await prisma.user.create({
    data: {
      email: 'marie.dupont@email.com',
      nom: 'Dupont',
      prenom: 'Marie',
      password: userPassword,
      role: 'USER',
      telephone: '06 98 76 54 32'
    }
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'pierre.martin@email.com',
      nom: 'Martin',
      prenom: 'Pierre',
      password: userPassword,
      role: 'USER',
      telephone: '06 11 22 33 44'
    }
  })

  console.log('👥 Utilisateurs créés')

  // Créer des événements avec le bon typage
  const events = await Promise.all([
    prisma.event.create({
      data: {
        titre: 'Concert de Jazz Exceptionnel',
        description: 'Une soirée inoubliable avec les meilleurs musiciens de jazz de la région. Au programme : standards revisités, compositions originales et improvisation.',
        lieu: 'Salle de spectacle Le Trianon',
        adresse: '123 Rue de la Musique, 75001 Paris',
        dateDebut: new Date('2025-12-15T20:00:00'),
        dateFin: new Date('2025-12-15T23:00:00'),
        prix: 2100000, // Prix en centimes (21.000 FCFA)
        nbPlaces: 300,
        placesRestantes: 300,
        organisateur: 'Jazz & Co Productions',
        categories: ['Concerts', 'Jazz', 'Musique'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/concert-jazz.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Théâtre: Roméo et Juliette',
        description: 'La célèbre tragédie de Shakespeare interprétée par la troupe locale dans une mise en scène moderne et captivante.',
        lieu: 'Théâtre Municipal',
        adresse: '456 Avenue du Théâtre, 75002 Paris',
        dateDebut: new Date('2025-12-20T19:30:00'),
        dateFin: new Date('2025-12-20T22:00:00'),
        prix: 1680000, // Prix en centimes (16.800 FCFA)
        nbPlaces: 200,
        placesRestantes: 200,
        organisateur: 'Troupe Théâtrale de Paris',
        categories: ['Théâtre', 'Classique', 'Culture'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/theatre.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Festival Gastronomique',
        description: 'Découvrez les saveurs locales avec nos chefs renommés. Dégustations, ateliers culinaires et démonstrations.',
        lieu: 'Parc des Expositions',
        adresse: '789 Boulevard des Saveurs, 75003 Paris',
        dateDebut: new Date('2025-12-22T12:00:00'),
        dateFin: new Date('2025-12-22T18:00:00'),
        prix: 900000, // Prix en centimes (9.000 FCFA)
        nbPlaces: 500,
        placesRestantes: 500,
        organisateur: 'Association des Chefs',
        categories: ['Gastronomie', 'Festival', 'Famille'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/festival-gastro.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Concert Rock - The Legends',
        description: 'Soirée rock endiablée avec des groupes locaux et internationaux. Une expérience musicale inoubliable.',
        lieu: 'Zenith Arena',
        adresse: '321 Place du Rock, 75004 Paris',
        dateDebut: new Date('2025-12-25T21:00:00'),
        dateFin: new Date('2025-12-26T01:00:00'),
        prix: 2700000, // Prix en centimes (27.000 FCFA)
        nbPlaces: 800,
        placesRestantes: 800,
        organisateur: 'Rock Events Production',
        categories: ['Concerts', 'Rock', 'Musique'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/concert-rock.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Exposition Art Moderne',
        description: 'Découvrez les œuvres des artistes contemporains les plus en vue. Exposition interactive avec audioguide.',
        lieu: 'Musée des Beaux-Arts',
        adresse: '654 Rue de l\'Art, 75005 Paris',
        dateDebut: new Date('2025-12-28T14:00:00'),
        dateFin: new Date('2025-12-28T18:00:00'),
        prix: 720000, // Prix en centimes (7.200 FCFA)
        nbPlaces: 150,
        placesRestantes: 150,
        organisateur: 'Musée Municipal',
        categories: ['Expositions', 'Art', 'Culture'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/expo-art.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Spectacle de Danse Contemporaine',
        description: 'Ballet classique et danse contemporaine par la compagnie nationale. Performance artistique exceptionnelle.',
        lieu: 'Opéra de la Ville',
        adresse: '987 Avenue de l\'Opéra, 75006 Paris',
        dateDebut: new Date('2025-12-30T19:00:00'),
        dateFin: new Date('2025-12-30T21:30:00'),
        prix: 2520000, // Prix en centimes (25.200 FCFA)
        nbPlaces: 180,
        placesRestantes: 180,
        organisateur: 'Compagnie Nationale de Danse',
        categories: ['Spectacles', 'Danse', 'Art'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/danse.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Conférence Tech Innovation 2025',
        description: 'Découvrez les dernières innovations technologiques avec des experts reconnus. Networking et présentations.',
        lieu: 'Centre de Conférence TechHub',
        adresse: '159 Boulevard de l\'Innovation, 75007 Paris',
        dateDebut: new Date('2025-11-15T09:00:00'),
        dateFin: new Date('2025-11-15T18:00:00'),
        prix: 7200000, // Prix en centimes (72.000 FCFA)
        nbPlaces: 300,
        placesRestantes: 300,
        organisateur: 'TechHub Paris',
        categories: ['Conférences', 'Technologie', 'Business'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/tech-conference.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Festival de Cinéma Indépendant',
        description: 'Une sélection des meilleurs films indépendants européens. Projections et rencontres avec les réalisateurs.',
        lieu: 'Cinéma Le Grand Rex',
        adresse: '753 Rue du Cinéma, 75008 Paris',
        dateDebut: new Date('2025-11-20T18:00:00'),
        dateFin: new Date('2025-11-23T23:00:00'),
        prix: 1500000, // Prix en centimes (15.000 FCFA)
        nbPlaces: 400,
        placesRestantes: 400,
        organisateur: 'Association Cinéma Indépendant',
        categories: ['Festivals', 'Cinéma', 'Culture'],
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/events/cinema-festival.jpg'
      }
    })
  ])

  console.log('🎪 Événements créés')

  // Créer quelques billets pour les statistiques
  const tickets = []
  
  // Billets pour le concert de jazz
  for (let i = 0; i < 25; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2024-${String(100001 + i).padStart(6, '0')}`,
        qrCode: `qr_code_data_${100001 + i}`,
        prix: 2100000, // Prix en centimes
        eventId: events[0].id,
        userId: i % 2 === 0 ? user1.id : user2.id,
        statut: i < 20 ? 'VALID' : 'USED',
        validatedAt: i >= 20 ? new Date() : null
      }
    })
    tickets.push(ticket)
  }

  // Billets pour le théâtre
  for (let i = 0; i < 15; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2024-${String(200001 + i).padStart(6, '0')}`,
        qrCode: `qr_code_data_${200001 + i}`,
        prix: 1680000, // Prix en centimes
        eventId: events[1].id,
        userId: user1.id,
        statut: 'VALID'
      }
    })
    tickets.push(ticket)
  }

  // Quelques billets invités pour le festival gastronomique
  for (let i = 0; i < 8; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2024-${String(300001 + i).padStart(6, '0')}`,
        qrCode: `qr_code_data_${300001 + i}`,
        prix: 900000, // Prix en centimes
        eventId: events[2].id,
        guestEmail: `invite${i + 1}@email.com`,
        guestNom: `Nom${i + 1}`,
        guestPrenom: `Prénom${i + 1}`,
        guestTelephone: `06 ${i + 1}0 ${i + 1}0 ${i + 1}0 ${i + 1}0`,
        statut: 'VALID'
      }
    })
    tickets.push(ticket)
  }

  // Billets pour le concert rock
  for (let i = 0; i < 35; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2024-${String(400001 + i).padStart(6, '0')}`,
        qrCode: `qr_code_data_${400001 + i}`,
        prix: 2700000, // Prix en centimes
        eventId: events[3].id,
        userId: i % 3 === 0 ? user1.id : user2.id,
        statut: i < 30 ? 'VALID' : 'USED',
        validatedAt: i >= 30 ? new Date() : null
      }
    })
    tickets.push(ticket)
  }

  console.log('🎫 Billets créés')

  // Mettre à jour les places restantes
  await prisma.event.update({
    where: { id: events[0].id },
    data: { placesRestantes: 275 } // 300 - 25
  })

  await prisma.event.update({
    where: { id: events[1].id },
    data: { placesRestantes: 185 } // 200 - 15
  })

  await prisma.event.update({
    where: { id: events[2].id },
    data: { placesRestantes: 492 } // 500 - 8
  })

  await prisma.event.update({
    where: { id: events[3].id },
    data: { placesRestantes: 765 } // 800 - 35
  })

  // Créer des statistiques pour les événements
  await prisma.eventStats.create({
    data: {
      eventId: events[0].id,
      ticketsSold: 25,
      revenue: 52500000, // 25 * 2100000 centimes
      conversionRate: 8.33, // 25/300 * 100
      averagePrice: 2100000,
      salesByDay: [
        { date: '2024-12-01', sales: 10, revenue: 21000000 },
        { date: '2024-12-02', sales: 8, revenue: 16800000 },
        { date: '2024-12-03', sales: 7, revenue: 14700000 }
      ]
    }
  })

  await prisma.eventStats.create({
    data: {
      eventId: events[1].id,
      ticketsSold: 15,
      revenue: 25200000, // 15 * 1680000 centimes
      conversionRate: 7.5, // 15/200 * 100
      averagePrice: 1680000,
      salesByDay: [
        { date: '2024-12-01', sales: 5, revenue: 8400000 },
        { date: '2024-12-02', sales: 10, revenue: 16800000 }
      ]
    }
  })

  await prisma.eventStats.create({
    data: {
      eventId: events[3].id,
      ticketsSold: 35,
      revenue: 94500000, // 35 * 2700000 centimes
      conversionRate: 4.38, // 35/800 * 100
      averagePrice: 2700000,
      salesByDay: [
        { date: '2024-12-01', sales: 15, revenue: 40500000 },
        { date: '2024-12-02', sales: 12, revenue: 32400000 },
        { date: '2024-12-03', sales: 8, revenue: 21600000 }
      ]
    }
  })

  // Créer quelques logs d'activité
  await prisma.activityLog.create({
    data: {
      type: 'USER_ACTION',
      entity: 'ticket',
      entityId: tickets[0].id,
      action: 'purchase',
      newData: { quantity: 1, amount: 2100000 },
      userId: user1.id,
      ipAddress: '192.168.1.1'
    }
  })

  await prisma.activityLog.create({
    data: {
      type: 'ADMIN_ACTION',
      entity: 'event',
      entityId: events[0].id,
      action: 'create',
      newData: { title: events[0].titre, price: 2100000 },
      userId: admin.id,
      ipAddress: '192.168.1.100'
    }
  })

  console.log('📊 Statistiques et logs créés')
  console.log('✅ Seeding terminé !')
  console.log(`
  📋 Résumé:
  - ${await prisma.user.count()} utilisateurs créés
  - ${await prisma.event.count()} événements créés
  - ${await prisma.ticket.count()} billets créés
  - ${await prisma.eventStats.count()} statistiques créées
  `)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })