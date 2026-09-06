-- CreateTable
CREATE TABLE "project_versions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileCount" INTEGER NOT NULL,
    "zipUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_versions_userId_projectName_idx" ON "project_versions"("userId", "projectName");
