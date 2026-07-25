-- CreateTable
CREATE TABLE "InvestorSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdaSignature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdaSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestorSubscription_userId_key" ON "InvestorSubscription"("userId");

-- CreateIndex
CREATE INDEX "ListingInterest_userId_idx" ON "ListingInterest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingInterest_userId_slug_key" ON "ListingInterest"("userId", "slug");

-- CreateIndex
CREATE INDEX "NdaSignature_userId_idx" ON "NdaSignature"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NdaSignature_userId_slug_key" ON "NdaSignature"("userId", "slug");

-- CreateIndex
CREATE INDEX "SavedListing_userId_idx" ON "SavedListing"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedListing_userId_slug_key" ON "SavedListing"("userId", "slug");

-- AddForeignKey
ALTER TABLE "InvestorSubscription" ADD CONSTRAINT "InvestorSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInterest" ADD CONSTRAINT "ListingInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdaSignature" ADD CONSTRAINT "NdaSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

