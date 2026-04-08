import 'dotenv/config';
import * as fs from 'fs';

let ok = true;

function check(name: string, pass: boolean, hint: string) {
  if (pass) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name} — ${hint}`);
    ok = false;
  }
}

console.log('\n  Validating setup...\n');

check('.env exists', fs.existsSync('.env'), 'Copy .env.example → .env and fill in your cookies');
check('ITERABLE_SESSION set', !!process.env.ITERABLE_SESSION, 'Set ITERABLE_SESSION in .env');
check('XSRF_TOKEN set', !!process.env.XSRF_TOKEN, 'Set XSRF_TOKEN in .env');
check('prompts.json exists', fs.existsSync('prompts.json'), 'Copy prompts.example.json → prompts.json and fill in real campaign data');

if (fs.existsSync('prompts.json')) {
  try {
    const prompts = JSON.parse(fs.readFileSync('prompts.json', 'utf-8'));
    check('prompts.json is valid JSON array', Array.isArray(prompts), 'File must contain a JSON array');
    check('prompts.json has entries', prompts.length > 0, 'Add at least one prompt');
    if (prompts.length > 0) {
      const first = prompts[0];
      check('prompt has id field', !!first.id, 'Each prompt needs an "id" field');
      check('prompt has category field', !!first.category, 'Each prompt needs a "category" field');
      check('prompt has prompt field', !!first.prompt, 'Each prompt needs a "prompt" field');
    }
  } catch {
    check('prompts.json parses correctly', false, 'Invalid JSON in prompts.json');
  }
}

console.log(ok ? '\n  All checks passed! Run: npm test\n' : '\n  Fix the issues above before running tests.\n');
process.exit(ok ? 0 : 1);
