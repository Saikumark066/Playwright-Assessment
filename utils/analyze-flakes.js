import fs from 'node:fs';

const reportPath = process.argv[2] || 'test-results/results.json';
if (!fs.existsSync(reportPath)) {
  process.stderr.write(`Report not found: ${reportPath}\n`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const flaky = [];

function visit(node, title = '') {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item) => visit(item, title));
    return;
  }

  if (Array.isArray(node.tests)) {
    for (const test of node.tests) {
      const testTitle = [title, test.title].filter(Boolean).join(' > ');
      const results = test.results || [];
      const statuses = results.map((result) => result.status);
      if (results.length > 1 && statuses.includes('passed') && statuses.some((status) => status !== 'passed')) {
        flaky.push({ title: testTitle, attempts: statuses });
      }
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (key !== 'tests') visit(value, key === 'title' ? value : title);
  }
}

visit(report);

if (flaky.length === 0) {
  process.stdout.write('No retry/repeat-based flaky candidates detected in the report.\n');
} else {
  process.stdout.write(`Detected ${flaky.length} flaky candidate(s):\n`);
  for (const item of flaky) process.stdout.write(`- ${item.title}: ${item.attempts.join(' -> ')}\n`);
}
