-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('BOT', 'WAITING', 'LIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('VISITOR', 'KWAKU', 'STAFF');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "staffSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "status" "ChatStatus" NOT NULL DEFAULT 'BOT',
    "visitorSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatConversation_visitorKey_key" ON "ChatConversation"("visitorKey");

-- CreateIndex
CREATE INDEX "ChatConversation_status_updatedAt_idx" ON "ChatConversation"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
