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
  assert.doesNotMatch(source, /Â|â€”|â†|ï¼|Ã—/);
});

test("evidence API declares honest persistence fallback", async () => {
  const route = await readFile(new URL("../app/api/evidence/route.ts", import.meta.url), "utf8");
  assert.match(route, /persistence:\s*false/);
  assert.match(route, /authorityState:\s*"Observation only"/);
  assert.match(route, /governance_events/);
});

test("recommendation API labels non-model fallback", async () => {
  const route = await readFile(new URL("../app/api/recommendation/route.ts", import.meta.url), "utf8");
  assert.match(route, /model:\s*MODEL/);
  assert.match(route, /"gpt-5\.6-sol"/);
  assert.match(route, /engine:\s*"Rules v1",\s*mode:\s*"deterministic"/);
  assert.match(route, /type:\s*"json_schema"/);
});

test("deployment metadata declares durable evidence storage", async () => {
  const hosting = JSON.parse(await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"));
  assert.equal(hosting.d1, "DB");
  assert.equal(hosting.r2, null);
  assert.ok(hosting.project_id);
  await readFile(new URL("../drizzle/0000_faithful_human_cannonball.sql", import.meta.url), "utf8");
  await readFile(new URL("../drizzle/0001_nappy_guardian.sql", import.meta.url), "utf8");
});
