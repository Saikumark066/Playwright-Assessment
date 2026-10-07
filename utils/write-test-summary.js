import fs from 'node:fs';

const reportPath = 'test-results/results.json';
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!fs.existsSync(reportPath)) {
  const message = `Playwright report not found: ${reportPath}`;
  if (summaryPath) fs.appendFileSync(summaryPath, `\n${message}\n`);
  console.error(message);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const tests = [];

function collect(node) {
  if (Array.isArray(node)) {
    node.forEach(collect);
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node.tests)) {
    tests.push(...node.tests);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key !== 'tests') collect(value);
  }
}

collect(report);
const statuses = tests.map((test) => test.results?.at(-1)?.status).filter(Boolean);
const flakyCount = tests.filter((test) => {
  const attempts = test.results || [];
  return attempts.length > 1
    && attempts.at(-1)?.status === 'passed'
    && attempts.some((attempt) => attempt.status !== 'passed');
}).length;
const counts = Object.fromEntries(
  ['passed', 'failed', 'timedOut', 'skipped', 'interrupted'].map(
    (status) => [status, statuses.filter((item) => item === status).length],
  ),
);
const summary = [
  `### Playwright results (${process.env.TEST_ENV || 'demo'})`,
  '',
  `- Tests: ${statuses.length}`,
  `- Passed: ${counts.passed}`,
  `- Failed: ${counts.failed + counts.timedOut + counts.interrupted}`,
  `- Skipped: ${counts.skipped}`,
  `- Flaky after retry: ${flakyCount}`,
  '',
].join('\n');

if (summaryPath) {
  fs.appendFileSync(summaryPath, summary);
} else {
  process.stdout.write(summary);
}
