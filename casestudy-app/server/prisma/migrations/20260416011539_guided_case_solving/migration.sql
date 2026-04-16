-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "final_grade" INTEGER,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "keyword_count" INTEGER NOT NULL DEFAULT 0,
    "node_count" INTEGER NOT NULL DEFAULT 0,
    "has_conclusion" BOOLEAN NOT NULL DEFAULT false,
    "summary_text" TEXT,
    "draft_nodes" TEXT,
    "draft_edges" TEXT,
    "override_history" TEXT,
    "guided_main_problem" TEXT,
    "guided_evidence" TEXT,
    "guided_root_causes" TEXT,
    "guided_possible_solutions" TEXT,
    "guided_recommendation" TEXT,
    "guided_justification" TEXT,
    "guided_final_submission" TEXT,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "teacher_feedback" TEXT,
    "submittedAt" DATETIME,
    "caseId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Submission_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("caseId", "createdAt", "draft_edges", "draft_nodes", "final_grade", "has_conclusion", "id", "keyword_count", "learnerId", "node_count", "override_history", "status", "summary_text", "updatedAt", "word_count") SELECT "caseId", "createdAt", "draft_edges", "draft_nodes", "final_grade", "has_conclusion", "id", "keyword_count", "learnerId", "node_count", "override_history", "status", "summary_text", "updatedAt", "word_count" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
