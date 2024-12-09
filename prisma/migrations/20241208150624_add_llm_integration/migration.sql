/*
  Warnings:

  - You are about to drop the column `originalUrl` on the `Document` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `LLMInteraction` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "ocrText" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("createdAt", "filename", "id", "ocrText", "status", "updatedAt", "userId") SELECT "createdAt", "filename", "id", "ocrText", "status", "updatedAt", "userId" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_LLMInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LLMInteraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LLMInteraction" ("answer", "createdAt", "documentId", "id", "question") SELECT "answer", "createdAt", "documentId", "id", "question" FROM "LLMInteraction";
DROP TABLE "LLMInteraction";
ALTER TABLE "new_LLMInteraction" RENAME TO "LLMInteraction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
