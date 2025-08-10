-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'COMPLET', 'ANNULE', 'TERMINE');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('VALID', 'USED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('USER_ACTION', 'ADMIN_ACTION', 'SYSTEM_ACTION', 'PAYMENT_ACTION', 'VALIDATION_ACTION');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "statut" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lieu" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "prix" DECIMAL(10,2) NOT NULL,
    "nbPlaces" INTEGER NOT NULL,
    "placesRestantes" INTEGER NOT NULL,
    "image" TEXT,
    "organisateur" TEXT NOT NULL,
    "statut" "public"."EventStatus" NOT NULL DEFAULT 'ACTIVE',
    "categories" TEXT[],
    "searchVector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" TEXT NOT NULL,
    "numeroTicket" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "statut" "public"."TicketStatus" NOT NULL DEFAULT 'VALID',
    "prix" DECIMAL(10,2) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestNom" TEXT,
    "guestPrenom" TEXT,
    "guestTelephone" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_stats" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketsSold" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averagePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "peakSalesDay" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "salesByDay" JSONB,
    "hourlyStats" JSONB,

    CONSTRAINT "event_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" TEXT NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "public"."PaymentStatus" NOT NULL,
    "eventId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "stripeMetadata" JSONB,
    "refundedAmount" DECIMAL(10,2),
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."temp_reservations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "userEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temp_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_statut_idx" ON "public"."users"("statut");

-- CreateIndex
CREATE INDEX "events_statut_idx" ON "public"."events"("statut");

-- CreateIndex
CREATE INDEX "events_dateDebut_idx" ON "public"."events"("dateDebut");

-- CreateIndex
CREATE INDEX "events_lieu_idx" ON "public"."events"("lieu");

-- CreateIndex
CREATE INDEX "events_prix_idx" ON "public"."events"("prix");

-- CreateIndex
CREATE INDEX "events_categories_idx" ON "public"."events"("categories");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "public"."events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_numeroTicket_key" ON "public"."tickets"("numeroTicket");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "public"."tickets"("userId");

-- CreateIndex
CREATE INDEX "tickets_eventId_idx" ON "public"."tickets"("eventId");

-- CreateIndex
CREATE INDEX "tickets_statut_idx" ON "public"."tickets"("statut");

-- CreateIndex
CREATE INDEX "tickets_numeroTicket_idx" ON "public"."tickets"("numeroTicket");

-- CreateIndex
CREATE INDEX "tickets_createdAt_idx" ON "public"."tickets"("createdAt");

-- CreateIndex
CREATE INDEX "tickets_guestEmail_idx" ON "public"."tickets"("guestEmail");

-- CreateIndex
CREATE UNIQUE INDEX "event_stats_eventId_key" ON "public"."event_stats"("eventId");

-- CreateIndex
CREATE INDEX "activity_logs_type_idx" ON "public"."activity_logs"("type");

-- CreateIndex
CREATE INDEX "activity_logs_entity_entityId_idx" ON "public"."activity_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "public"."activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "public"."activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentId_key" ON "public"."payments"("stripePaymentId");

-- CreateIndex
CREATE INDEX "payments_stripePaymentId_idx" ON "public"."payments"("stripePaymentId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_customerEmail_idx" ON "public"."payments"("customerEmail");

-- CreateIndex
CREATE INDEX "payments_eventId_idx" ON "public"."payments"("eventId");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "public"."payments"("createdAt");

-- CreateIndex
CREATE INDEX "temp_reservations_sessionId_idx" ON "public"."temp_reservations"("sessionId");

-- CreateIndex
CREATE INDEX "temp_reservations_eventId_idx" ON "public"."temp_reservations"("eventId");

-- CreateIndex
CREATE INDEX "temp_reservations_expiresAt_idx" ON "public"."temp_reservations"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_stats" ADD CONSTRAINT "event_stats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
