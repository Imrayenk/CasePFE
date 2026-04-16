UPDATE "Submission"
SET "guided_final_submission" = "summary_text"
WHERE "guided_final_submission" IS NULL
  AND "summary_text" IS NOT NULL;

UPDATE "Submission"
SET "status" = 'graded'
WHERE "status" = 'submitted'
  AND "final_grade" IS NOT NULL;
