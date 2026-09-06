-- AlterTable
ALTER TABLE "project_versions" ADD COLUMN "files" JSONB;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "projectVersionId" TEXT;
