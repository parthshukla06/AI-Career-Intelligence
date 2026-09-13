import assert from "node:assert/strict";
import { chunkKnowledgeContent, retrieveKnowledge } from "./rag.service";

const chunks = chunkKnowledgeContent("backend-development.md", "# Backend Development\n\nBackend APIs use HTTP and databases.\n\nTesting and deployment improve reliability.");
assert.equal(chunks.length, 1);
assert.equal(chunks[0]?.title, "Backend Development");
assert.equal(chunks[0]?.category, "backend-development");
assert.equal(chunks[0]?.source, "internal-career-knowledge-base");

const run = async (): Promise<void> => {
  const results = await retrieveKnowledge("backend APIs and testing", 2);
  assert.ok(results.length > 0);
  assert.ok(results.length <= 2);
  assert.ok(results.every((result) => result.content && result.title && typeof result.score === "number"));
  console.log("rag.service tests passed");
};

run().catch((error: unknown) => {
  console.error("rag.service tests failed", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
