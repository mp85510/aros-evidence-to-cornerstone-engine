import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) files.push(...await filesBelow(url));
    else files.push(url);
  }
  return files;
}

test("production build contains the AROS product contract", async () => {
  const files = await filesBelow(new URL("../dist/", import.meta.url));
  const text = (await Promise.all(
    files.filter((file) => /\.(js|html|json|css)$/.test(file.pathname)).map((file) => readFile(file, "utf8")),
  )).join("\n");
  assert.match(text, /Turn evidence into accountable decisions/);
  assert.match(text, /AI advises\. Architects authorize\./);
  assert.match(text, /Observation does not become authority/);
  assert.doesNotMatch(text, /codex-preview|Starter Project|Your site is taking shape/);
});

test("source contains no known encoding corruption", async () => {
  const source = (
    await Promise.all([
      readFile(new URL("../app/workbench.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../README.md", import.meta.url), "utf8"),
    ])
  ).join("\n");
  assert.doesNotMatch(source, /Â|Ã‚|Ã¢â‚¬â€|Ã¢â€ |Ã¯Â¼|Ãƒâ€”/);
});

test("evidence API fails closed and records immutable transition evidence", async () => {
  const route = await readFile(new URL("../app/api/evidence/route.ts", import.meta.url), "utf8");
  const contracts = await readFile(
    new URL("../lib/server-contracts.mjs", import.meta.url),
    "utf8",
  );
  assert.match(route, /persistence:\s*false/);
  assert.match(route, /authorityState:\s*"Observation only"/);
  assert.match(route, /authenticatedActor/);
  assert.match(contracts, /expectedVersion/);
  assert.match(route, /prior_state/);
  assert.match(route, /resulting_state/);
  assert.match(route, /storage_failure/);
  assert.match(route, /governance_events/);
});

test("recommendation API validates and persists model and fallback provenance", async () => {
  const route = await readFile(new URL("../app/api/recommendation/route.ts", import.meta.url), "utf8");
  const advisory = await readFile(new URL("../lib/advisory.mjs", import.meta.url), "utf8");
  assert.match(advisory, /"gpt-5\.6-sol"/);
  assert.match(advisory, /model:\s*MODEL/);
  assert.match(advisory, /type:\s*"json_schema"/);
  assert.match(advisory, /validateRecommendation/);
  assert.match(advisory, /fallbackState/);
  assert.match(route, /recommendations/);
  assert.match(route, /advisoryId/);
  assert.doesNotMatch(route, /console\.(log|error|warn)/);
  assert.doesNotMatch(advisory, /console\.(log|error|warn)/);
});

test("OpenAI credentials and endpoint stay out of client bundles", async () => {
  const files = await filesBelow(new URL("../dist/client/", import.meta.url));
  const text = (await Promise.all(
    files.filter((file) => /\.(js|html|json|css|map)$/.test(file.pathname)).map((file) => readFile(file, "utf8")),
  )).join("\n");
  assert.doesNotMatch(text, /OPENAI_API_KEY/);
  assert.doesNotMatch(text, /api\.openai\.com/);
  assert.doesNotMatch(text, /\/v1\/responses/);
});

test("deployment metadata and migrations declare durable immutable audit storage", async () => {
  const hosting = JSON.parse(await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"));
  assert.equal(hosting.d1, "DB");
  assert.equal(hosting.r2, null);
  assert.ok(hosting.project_id);
  await readFile(new URL("../drizzle/0000_faithful_human_cannonball.sql", import.meta.url), "utf8");
  await readFile(new URL("../drizzle/0001_nappy_guardian.sql", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0002_stiff_paper_doll.sql", import.meta.url), "utf8");
  assert.match(migration, /governance_events_no_update/);
  assert.match(migration, /recommendations_no_delete/);
});
