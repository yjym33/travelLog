-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "placeName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "photos" TEXT[],
    "diary" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT,
    "template" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_logs" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "travelLogId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "travel_logs_userId_idx" ON "travel_logs"("userId");

-- CreateIndex
CREATE INDEX "travel_logs_country_idx" ON "travel_logs"("country");

-- CreateIndex
CREATE INDEX "travel_logs_emotion_idx" ON "travel_logs"("emotion");

-- CreateIndex
CREATE INDEX "travel_logs_createdAt_idx" ON "travel_logs"("createdAt");

-- CreateIndex
CREATE INDEX "stories_userId_idx" ON "stories"("userId");

-- CreateIndex
CREATE INDEX "stories_isPublic_idx" ON "stories"("isPublic");

-- CreateIndex
CREATE INDEX "story_logs_storyId_idx" ON "story_logs"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "story_logs_storyId_travelLogId_key" ON "story_logs"("storyId", "travelLogId");

-- AddForeignKey
ALTER TABLE "travel_logs" ADD CONSTRAINT "travel_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_logs" ADD CONSTRAINT "story_logs_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_logs" ADD CONSTRAINT "story_logs_travelLogId_fkey" FOREIGN KEY ("travelLogId") REFERENCES "travel_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
