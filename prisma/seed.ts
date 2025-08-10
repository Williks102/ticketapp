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

  // Créer des événements
  const events = await Promise.all([
    prisma.event.create({
      data: {
        titre: 'Concert de Jazz Exceptionnel',
        description: 'Une soirée inoubliable avec les meilleurs musiciens de jazz de la région. Au programme : standards revisités, compositions originales et improvisation.',
        lieu: 'Salle de spectacle Le Trianon',
        adresse: '123 Rue de la Musique, 75001 Paris',
        dateDebut: new Date('2024-12-15T20:00:00'),
        dateFin: new Date('2024-12-15T23:00:00'),
        prix: 35.00,
        nbPlaces: 300,
        placesRestantes: 300,
        organisateur: 'Jazz & Co Productions',
        categories: ['Concerts', 'Jazz', 'Musique'],
        image: '/images/concert-jazz.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Théâtre: Roméo et Juliette',
        description: 'La célèbre tragédie de Shakespeare interprétée par la troupe locale dans une mise en scène moderne et captivante.',
        lieu: 'Théâtre Municipal',
        adresse: '456 Avenue du Théâtre, 75002 Paris',
        dateDebut: new Date('2024-12-20T19:30:00'),
        dateFin: new Date('2024-12-20T22:00:00'),
        prix: 28.00,
        nbPlaces: 200,
        placesRestantes: 200,
        organisateur: 'Troupe Théâtrale de Paris',
        categories: ['Théâtre', 'Classique', 'Culture'],
        image: '/images/theatre.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Festival Gastronomique',
        description: 'Découvrez les saveurs locales avec nos chefs renommés. Dégustations, ateliers culinaires et démonstrations.',
        lieu: 'Parc des Expositions',
        adresse: '789 Boulevard des Saveurs, 75003 Paris',
        dateDebut: new Date('2024-12-22T12:00:00'),
        dateFin: new Date('2024-12-22T18:00:00'),
        prix: 15.00,
        nbPlaces: 500,
        placesRestantes: 500,
        organisateur: 'Association des Chefs',
        categories: ['Gastronomie', 'Festival', 'Famille'],
        image: '/images/festival-gastro.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Concert Rock - The Legends',
        description: 'Soirée rock endiablée avec des groupes locaux et internationaux. Une expérience musicale inoubliable.',
        lieu: 'Zenith Arena',
        adresse: '321 Place du Rock, 75004 Paris',
        dateDebut: new Date('2024-12-25T21:00:00'),
        dateFin: new Date('2024-12-26T01:00:00'),
        prix: 45.00,
        nbPlaces: 800,
        placesRestantes: 800,
        organisateur: 'Rock Events Production',
        categories: ['Concerts', 'Rock', 'Musique'],
        image: '/images/concert-rock.jpg'
      }
    }),

    prisma.event.create({
      data: {
        titre: 'Exposition Art Moderne',
        description: 'Découvrez les œuvres des artistes contemporains les plus en vue. Exposition interactive avec audioguide.',
        lieu: 'Musée des Beaux-Arts',
        adresse: '654 Rue de l\'Art, 75005 Paris',
        dateDebut: new Date('2024-12-28T14:00:00'),
        dateFin: new Date('2024-12-28T18:00:00'),
        prix: 12.00,
        nbPlaces: 150,
        placesRestantes: 150,
        organisateur: 'Musée Municipal',
        categories: ['Expositions', 'Art', 'Culture'],
        image: '/images/expo-art.jpg'
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
        prix: 35.00,
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
        prix: 28.00,
        eventId: events[1].id,
        userId: user1.id,
        statut: 'VALID'
      }
    })
    tickets.push(ticket)
  }

  // Quelques billets invités
  for (let i = 0; i < 5; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2024-${String(300001 + i).padStart(6, '0')}`,
        qrCode: `qr_code_data_${300001 + i}`,
        prix: 15.00,
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
    data: { placesRestantes: 495 } // 500 - 5
  })

  // Créer des statistiques pour les événements
  await prisma.eventStats.create({
    data: {
      eventId: events[0].id,
      ticketsSold: 25,
      revenue: 875.00, // 25 * 35
      conversionRate: 8.33, // 25/300 * 100
      averagePrice: 35.00,
      salesByDay: [
        { date: '2024-12-01', sales: 10, revenue: 350 },
        { date: '2024-12-02', sales: 8, revenue: 280 },
        { date: '2024-12-03', sales: 7, revenue: 245 }
      ]
    }
  })

  await prisma.eventStats.create({
    data: {
      eventId: events[1].id,
      ticketsSold: 15,
      revenue: 420.00, // 15 * 28
      conversionRate: 7.5, // 15/200 * 100
      averagePrice: 28.00,
      salesByDay: [
        { date: '2024-12-01', sales: 5, revenue: 140 },
        { date: '2024-12-02', sales: 10, revenue: 280 }
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
      newData: { quantity: 1, amount: 35.00 },
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
      newData: { title: events[0].titre, price: 35.00 },
      userId: admin.id,
      ipAddress: '192.168.1.100'
    }
  })

  console.log('📊 Statistiques et logs créés')
  console.log('✅ Seeding terminé !')
  
  console.log('\n📋 Comptes créés :')
  console.log('👨‍💼 Admin: admin@simplebillet.com / admin123')
  console.log('👤 User 1: marie.dupont@email.com / user123')
  console.log('👤 User 2: pierre.martin@email.com / user123')
  
  console.log('\n🎪 Événements créés : 5')
  console.log('🎫 Billets créés : 45')
  console.log('📊 Statistiques générées')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })