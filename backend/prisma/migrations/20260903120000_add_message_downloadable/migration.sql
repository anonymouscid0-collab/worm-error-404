-- AlterTable
ALTER TABLE "messages" ADD COLUMN "isDownloadable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "downloadUrl" TEXT,
ADD COLUMN "downloadFileName" TEXT;
