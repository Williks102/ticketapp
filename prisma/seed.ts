// prisma/seed.ts - VERSION COMPLÈTE CORRIGÉE
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Nettoyer les données existantes dans l'ordre correct (à cause des clés étrangères)
  await prisma.activityLog.deleteMany()
  await prisma.eventStats.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.tempReservation.deleteMany()

  console.log('🧹 Données existantes supprimées')

  // ========================================
  // CRÉATION DES UTILISATEURS
  // ========================================

  const adminPassword = await bcrypt.hash('admin123', 12)
  const userPassword = await bcrypt.hash('user123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@simplebillet.com',
      nom: 'Admin',
      prenom: 'Super',
      password: adminPassword,
      role: 'ADMIN',
      telephone: '05 12 34 56 78',
      statut: 'ACTIVE'
    }
  })

  const user1 = await prisma.user.create({
    data: {
      email: 'marie.dupont@email.com',
      nom: 'Dupont',
      prenom: 'Marie',
      password: userPassword,
      role: 'USER',
      telephone: '05 98 76 54 32',
      statut: 'ACTIVE'
    }
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'pierre.martin@email.com',
      nom: 'Martin',
      prenom: 'Pierre',
      password: userPassword,
      role: 'USER',
      telephone: '05 11 22 33 44',
      statut: 'ACTIVE'
    }
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'sophie.bernard@email.com',
      nom: 'Bernard',
      prenom: 'Sophie',
      password: userPassword,
      role: 'USER',
      telephone: '05 55 66 77 88',
      statut: 'ACTIVE'
    }
  })

  console.log('👥 Utilisateurs créés')

  // ========================================
  // CRÉATION DES ÉVÉNEMENTS
  // ========================================

  const events = await Promise.all([
    // 1. Concert de Jazz (événement payant populaire)
    prisma.event.create({
      data: {
        titre: 'Concert de Jazz Exceptionnel',
        description: 'Une soirée inoubliable avec les meilleurs musiciens de jazz de la région. Au programme : standards revisités, compositions originales et improvisation. Avec en guest star le célèbre saxophoniste international Marcus Williams.',
        lieu: 'Salle de spectacle Le Trianon',
        adresse: '123 Rue de la Musique, Plateau, Abidjan',
        dateDebut: new Date('2025-09-15T20:00:00'),
        dateFin: new Date('2025-09-15T23:00:00'),
        prix: 2100000, // 21.000 FCFA en centimes
        nbPlaces: 300,
        placesRestantes: 300,
        organisateur: 'Jazz & Co Productions',
        categories: ['concert', 'jazz'],
        statut: 'ACTIVE',
        image: null
      }
    }),

    // 2. Théâtre (événement culture)
    prisma.event.create({
      data: {
        titre: 'Théâtre: Roméo et Juliette',
        description: 'La célèbre tragédie de Shakespeare interprétée par la troupe nationale dans une mise en scène moderne et captivante. Une adaptation contemporaine qui bouleverse les codes.',
        lieu: 'Théâtre National',
        adresse: '456 Avenue du Théâtre, Cocody, Abidjan',
        dateDebut: new Date('2025-09-20T19:30:00'),
        dateFin: new Date('2025-09-20T22:00:00'),
        prix: 1680000, // 16.800 FCFA en centimes
        nbPlaces: 200,
        placesRestantes: 200,
        organisateur: 'Compagnie Théâtrale Ivoirienne',
        categories: ['theatre', 'culture'],
        statut: 'ACTIVE',
        image: null
      }
    }),

    // 3. Festival Gastronomique (événement gratuit)
    prisma.event.create({
      data: {
        titre: 'Festival de Gastronomie Locale',
        description: 'Découvrez les saveurs authentiques de la Côte d\'Ivoire lors de ce festival gratuit. Dégustations, démonstrations culinaires et rencontres avec les chefs locaux.',
        lieu: 'Place de la République',
        adresse: '789 Place de la République, Plateau, Abidjan',
        dateDebut: new Date('2025-09-25T16:00:00'),
        dateFin: new Date('2025-09-25T22:00:00'),
        prix: 0, // Gratuit
        nbPlaces: 500,
        placesRestantes: 500,
        organisateur: 'Office de Tourisme d\'Abidjan',
        categories: ['festival', 'gastronomie'],
        statut: 'ACTIVE',
        image: null
      }
    }),

    // 4. Concert Rock (grand événement)
    prisma.event.create({
      data: {
        titre: 'Rock Festival - Nuit Électrique',
        description: 'Le plus grand festival de rock de l\'année avec des groupes internationaux et locaux. Une nuit électrisante avec 6 heures de concert non-stop dans une ambiance exceptionnelle.',
        lieu: 'Palais de la Culture',
        adresse: '321 Boulevard Latrille, Cocody, Abidjan',
        dateDebut: new Date('2025-10-05T19:00:00'),
        dateFin: new Date('2025-10-06T01:00:00'),
        prix: 2700000, // 27.000 FCFA en centimes
        nbPlaces: 800,
        placesRestantes: 800,
        organisateur: 'Rock Productions CI',
        categories: ['concert', 'rock'],
        statut: 'ACTIVE',
        image: null
      }
    }),

    // 5. Spectacle de Danse (événement culturel premium)
    prisma.event.create({
      data: {
        titre: 'Spectacle de Danse Contemporaine',
        description: 'Performance artistique exceptionnelle mêlant danse contemporaine et traditions africaines. Une création originale de la compagnie nationale de danse.',
        lieu: 'Opéra de la Ville',
        adresse: '987 Avenue de l\'Opéra, Marcory, Abidjan',
        dateDebut: new Date('2025-10-10T19:00:00'),
        dateFin: new Date('2025-10-10T21:30:00'),
        prix: 2520000, // 25.200 FCFA en centimes
        nbPlaces: 180,
        placesRestantes: 180,
        organisateur: 'Compagnie Nationale de Danse',
        categories: ['spectacle', 'danse'],
        statut: 'ACTIVE',
        image: null
      }
    }),

    // 6. Conférence Tech (événement business)
    prisma.event.create({
      data: {
        titre: 'Conférence Tech Innovation 2025',
        description: 'Découvrez les dernières innovations technologiques avec des experts reconnus. Networking, présentations et ateliers sur l\'IA, la blockchain et les technologies émergentes.',
        lieu: 'Centre de Conférence TechHub',
        adresse: '159 Boulevard de l\'Innovation, Zone 4, Abidjan',
        dateDebut: new Date('2025-10-15T09:00:00'),
        dateFin: new Date('2025-10-15T18:00:00'),
        prix: 7200000, // 72.000 FCFA en centimes
        nbPlaces: 300,
        placesRestantes: 300,
        organisateur: 'TechHub Abidjan',
        categories: ['conference', 'technologie'],
        statut: 'ACTIVE',
        image: null
      }
    }),

    // 7. Festival de Cinéma (événement culturel accessible)
    prisma.event.create({
      data: {
        titre: 'Festival de Cinéma Africain',
        description: 'Une sélection des meilleurs films africains contemporains. Projections, rencontres avec les réalisateurs et débats sur le cinéma africain moderne.',
        lieu: 'Cinéma Le Grand Rex',
        adresse: '753 Rue du Cinéma, Treichville, Abidjan',
        dateDebut: new Date('2025-10-20T18:00:00'),
        dateFin: new Date('2025-10-23T23:00:00'),
        prix: 1500000, // 15.000 FCFA en centimes
        nbPlaces: 400,
        placesRestantes: 400,
        organisateur: 'Association Cinéma Africain',
        categories: ['festival', 'cinema'],
        statut: 'ACTIVE',
        image: null
      }
    }),

    // 8. Atelier Culinaire (événement intime)
    prisma.event.create({
      data: {
        titre: 'Atelier Cuisine Traditionnelle',
        description: 'Apprenez à cuisiner les plats traditionnels ivoiriens avec un chef reconnu. Atelier pratique incluant dégustation et recettes à emporter.',
        lieu: 'École de Cuisine Le Gourmand',
        adresse: '147 Rue de la Gastronomie, Cocody, Abidjan',
        dateDebut: new Date('2025-10-25T14:00:00'),
        dateFin: new Date('2025-10-25T17:00:00'),
        prix: 4500000, // 45.000 FCFA en centimes
        nbPlaces: 25,
        placesRestantes: 25,
        organisateur: 'Chef Kouassi Restaurant',
        categories: ['atelier', 'gastronomie'],
        statut: 'ACTIVE',
        image: null
      }
    })
  ])

  console.log('🎪 Événements créés')

  // ========================================
  // CRÉATION DES BILLETS
  // ========================================

  const tickets = []
  
  // Billets pour le concert de jazz (25 billets vendus)
  for (let i = 0; i < 25; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2025-${String(100001 + i).padStart(6, '0')}`,
        qrCode: `QR_${Date.now()}_${100001 + i}`,
        prix: 2100000, // Prix en centimes
        eventId: events[0].id,
        userId: i % 2 === 0 ? user1.id : user2.id,
        statut: i < 20 ? 'VALID' : 'USED',
        validatedAt: i >= 20 ? new Date(Date.now() - Math.random() * 86400000) : null // Validés dans les dernières 24h
      }
    })
    tickets.push(ticket)
  }

  // Billets pour le théâtre (15 billets vendus)
  for (let i = 0; i < 15; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2025-${String(200001 + i).padStart(6, '0')}`,
        qrCode: `QR_${Date.now()}_${200001 + i}`,
        prix: 1680000, // Prix en centimes
        eventId: events[1].id,
        userId: i % 3 === 0 ? user1.id : (i % 3 === 1 ? user2.id : user3.id),
        statut: 'VALID'
      }
    })
    tickets.push(ticket)
  }

  // Billets gratuits pour le festival gastronomique (20 réservations)
  for (let i = 0; i < 20; i++) {
    const isGuest = i < 8 // 8 premiers en invités, 12 avec compte
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2025-${String(300001 + i).padStart(6, '0')}`,
        qrCode: `QR_${Date.now()}_${300001 + i}`,
        prix: 0, // Gratuit
        eventId: events[2].id,
        userId: !isGuest ? (i % 3 === 0 ? user1.id : (i % 3 === 1 ? user2.id : user3.id)) : null,
        guestEmail: isGuest ? `invite${i + 1}@email.com` : null,
        guestNom: isGuest ? `Nom${i + 1}` : null,
        guestPrenom: isGuest ? `Prénom${i + 1}` : null,
        guestTelephone: isGuest ? `05 ${(i + 1).toString().padStart(2, '0')} ${(i + 1).toString().padStart(2, '0')} ${(i + 1).toString().padStart(2, '0')} ${(i + 1).toString().padStart(2, '0')}` : null,
        statut: 'VALID'
      }
    })
    tickets.push(ticket)
  }

  // Billets pour le concert rock (35 billets vendus)
  for (let i = 0; i < 35; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2025-${String(400001 + i).padStart(6, '0')}`,
        qrCode: `QR_${Date.now()}_${400001 + i}`,
        prix: 2700000, // Prix en centimes
        eventId: events[3].id,
        userId: i % 3 === 0 ? user1.id : (i % 3 === 1 ? user2.id : user3.id),
        statut: i < 30 ? 'VALID' : 'USED',
        validatedAt: i >= 30 ? new Date(Date.now() - Math.random() * 172800000) : null // Validés dans les dernières 48h
      }
    })
    tickets.push(ticket)
  }

  // Quelques billets pour la conférence tech (12 billets vendus)
  for (let i = 0; i < 12; i++) {
    const ticket = await prisma.ticket.create({
      data: {
        numeroTicket: `TKT-2025-${String(600001 + i).padStart(6, '0')}`,
        qrCode: `QR_${Date.now()}_${600001 + i}`,
        prix: 7200000, // Prix en centimes
        eventId: events[5].id,
        userId: i % 3 === 0 ? user1.id : (i % 3 === 1 ? user2.id : user3.id),
        statut: 'VALID'
      }
    })
    tickets.push(ticket)
  }

  console.log('🎫 Billets créés')

  // ========================================
  // MISE À JOUR DES PLACES RESTANTES
  // ========================================

  await Promise.all([
    prisma.event.update({
      where: { id: events[0].id },
      data: { placesRestantes: 275 } // 300 - 25
    }),
    prisma.event.update({
      where: { id: events[1].id },
      data: { placesRestantes: 185 } // 200 - 15
    }),
    prisma.event.update({
      where: { id: events[2].id },
      data: { placesRestantes: 480 } // 500 - 20
    }),
    prisma.event.update({
      where: { id: events[3].id },
      data: { placesRestantes: 765 } // 800 - 35
    }),
    prisma.event.update({
      where: { id: events[5].id },
      data: { placesRestantes: 288 } // 300 - 12
    })
  ])

  console.log('📊 Places restantes mises à jour')

  // ========================================
  // CRÉATION DES STATISTIQUES D'ÉVÉNEMENTS
  // ========================================

  await Promise.all([
    // Stats pour le concert de jazz
    prisma.eventStats.create({
      data: {
        eventId: events[0].id,
        ticketsSold: 25,
        revenue: 52500000, // 25 * 2100000 centimes
        conversionRate: 8.33, // 25/300 * 100
        averagePrice: 2100000,
        salesByDay: [
          { date: '2025-08-10', sales: 10, revenue: 21000000 },
          { date: '2025-08-11', sales: 8, revenue: 16800000 },
          { date: '2025-08-12', sales: 7, revenue: 14700000 }
        ]
      }
    }),

    // Stats pour le théâtre
    prisma.eventStats.create({
      data: {
        eventId: events[1].id,
        ticketsSold: 15,
        revenue: 25200000, // 15 * 1680000 centimes
        conversionRate: 7.5, // 15/200 * 100
        averagePrice: 1680000,
        salesByDay: [
          { date: '2025-08-10', sales: 5, revenue: 8400000 },
          { date: '2025-08-11', sales: 10, revenue: 16800000 }
        ]
      }
    }),

    // Stats pour le festival gratuit
    prisma.eventStats.create({
      data: {
        eventId: events[2].id,
        ticketsSold: 20,
        revenue: 0, // Gratuit
        conversionRate: 4.0, // 20/500 * 100
        averagePrice: 0,
        salesByDay: [
          { date: '2025-08-12', sales: 8, revenue: 0 },
          { date: '2025-08-13', sales: 12, revenue: 0 }
        ]
      }
    }),

    // Stats pour le concert rock
    prisma.eventStats.create({
      data: {
        eventId: events[3].id,
        ticketsSold: 35,
        revenue: 94500000, // 35 * 2700000 centimes
        conversionRate: 4.38, // 35/800 * 100
        averagePrice: 2700000,
        salesByDay: [
          { date: '2025-08-08', sales: 15, revenue: 40500000 },
          { date: '2025-08-09', sales: 12, revenue: 32400000 },
          { date: '2025-08-10', sales: 8, revenue: 21600000 }
        ]
      }
    }),

    // Stats pour la conférence tech
    prisma.eventStats.create({
      data: {
        eventId: events[5].id,
        ticketsSold: 12,
        revenue: 86400000, // 12 * 7200000 centimes
        conversionRate: 4.0, // 12/300 * 100
        averagePrice: 7200000,
        salesByDay: [
          { date: '2025-08-13', sales: 7, revenue: 50400000 },
          { date: '2025-08-14', sales: 5, revenue: 36000000 }
        ]
      }
    })
  ])

  console.log('📈 Statistiques d\'événements créées')

  // ========================================
  // CRÉATION DES LOGS D'ACTIVITÉ
  // ========================================

  // Logs d'activité variés pour alimenter le dashboard
  const activityLogs = await Promise.all([
    // Activités utilisateur
    prisma.activityLog.create({
      data: {
        type: 'USER_ACTION',
        entity: 'ticket',
        entityId: tickets[0].id,
        action: 'purchase',
        newData: { 
          eventTitle: 'Concert de Jazz Exceptionnel',
          quantity: 1, 
          amount: 2100000,
          eventId: events[0].id
        },
        userId: user1.id,
        ipAddress: '192.168.1.10'
      }
    }),

    prisma.activityLog.create({
      data: {
        type: 'USER_ACTION',
        entity: 'ticket',
        entityId: tickets[15].id,
        action: 'free_reservation',
        newData: { 
          eventTitle: 'Festival de Gastronomie Locale',
          quantity: 1,
          eventId: events[2].id
        },
        userId: user2.id,
        ipAddress: '192.168.1.11'
      }
    }),

    // Activités admin
    prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'event',
        entityId: events[0].id,
        action: 'create',
        newData: { 
          titre: events[0].titre, 
          prix: 2100000,
          nbPlaces: 300,
          isGratuit: false
        },
        userId: admin.id,
        ipAddress: '192.168.1.100'
      }
    }),

    prisma.activityLog.create({
      data: {
        type: 'ADMIN_ACTION',
        entity: 'user',
        entityId: user3.id,
        action: 'create',
        newData: { 
          email: user3.email,
          nom: user3.nom,
          prenom: user3.prenom,
          role: 'USER'
        },
        userId: admin.id,
        ipAddress: '192.168.1.100'
      }
    }),

    // Activités de validation
    prisma.activityLog.create({
      data: {
        type: 'VALIDATION_ACTION',
        entity: 'ticket',
        entityId: tickets[20].id,
        action: 'validate',
        newData: { 
          numeroTicket: tickets[20].numeroTicket,
          eventTitle: 'Concert de Jazz Exceptionnel'
        },
        userId: admin.id,
        ipAddress: '192.168.1.100'
      }
    }),

    // Activités de paiement
    prisma.activityLog.create({
      data: {
        type: 'PAYMENT_ACTION',
        entity: 'payment',
        entityId: 'payment_1',
        action: 'payment_succeeded',
        newData: { 
          amount: 2700000,
          eventTitle: 'Rock Festival - Nuit Électrique'
        },
        userId: user1.id,
        ipAddress: '192.168.1.10'
      }
    }),

    // Activités système
    prisma.activityLog.create({
      data: {
        type: 'SYSTEM_ACTION',
        entity: 'event',
        entityId: events[0].id,
        action: 'email_sent',
        newData: { 
          type: 'event_reminder',
          eventTitle: events[0].titre,
          recipients: 25
        },
        userId: null,
        ipAddress: null
      }
    })
  ])

  console.log('📋 Logs d\'activité créés')

  // ========================================
  // AFFICHAGE DU RÉSUMÉ
  // ========================================

  console.log('\n🎉 SEEDING TERMINÉ AVEC SUCCÈS!')
  console.log('=====================================')
  console.log(`👥 Utilisateurs créés: ${[admin, user1, user2, user3].length}`)
  console.log(`   - Admins: 1 (${admin.email})`)
  console.log(`   - Utilisateurs: 3`)
  console.log(`🎪 Événements créés: ${events.length}`)
  console.log(`   - Payants: ${events.filter(e => e.prix > 0).length}`)
  console.log(`   - Gratuits: ${events.filter(e => e.prix === 0).length}`)
  console.log(`🎫 Billets créés: ${tickets.length}`)
  console.log(`   - Valides: ${tickets.filter(t => t.statut === 'VALID').length}`)
  console.log(`   - Utilisés: ${tickets.filter(t => t.statut === 'USED').length}`)
  console.log(`📊 Statistiques d\'événements: 5`)
  console.log(`📋 Logs d\'activité: ${activityLogs.length}`)
  console.log('=====================================')
  console.log('🚀 Votre application est prête à être testée!')
  console.log('\n🔑 Comptes de test:')
  console.log(`   Admin: ${admin.email} / admin123`)
  console.log(`   User 1: ${user1.email} / user123`)
  console.log(`   User 2: ${user2.email} / user123`)
  console.log(`   User 3: ${user3.email} / user123`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })