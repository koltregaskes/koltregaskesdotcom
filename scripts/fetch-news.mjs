#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

const sharedRoot = process.env.SHARED_WEBSITE_TOOLS_ROOT || 'W:/Websites/shared/website-tools';
const collectorPath = process.env.NEWS_COLLECTOR_PATH || path.join(sharedRoot, 'pipelines', 'news', 'src', 'cli.mjs');
const configPath = process.env.NEWS_CONFIG_PATH || path.join(sharedRoot, 'pipelines', 'news', 'config', 'sources.json');
const outputDir = process.env.NEWS_OUT || path.join(repoRoot, 'news-digests');
const siteKey = process.env.NEWS_SITE || 'kols-korner';

function parseArgs(argv) {
  const args = {
    date: '',
    emitJson: true,
    help: false
  };

  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (value === '--help' || value === '-h') args.help = true;
    else if (value === '--date' && argv[i + 1]) args.date = argv[++i];
    else if (value.startsWith('--date=')) args.date = value.slice('--date='.length);
    else if (value === '--no-json') args.emitJson = false;
  }

  if (!args.date) {
    args.date = new Date().toISOString().slice(0, 10);
  }

  return args;
}

function printHelp() {
  console.log(`Shared news collector wrapper

Usage:
  node scripts/fetch-news.mjs [--date YYYY-MM-DD] [--no-json]

Environment overrides:
  SHARED_WEBSITE_TOOLS_ROOT
  NEWS_COLLECTOR_PATH
  NEWS_CONFIG_PATH
  NEWS_OUT
  NEWS_SITE
`);
}

function assertPathExists(targetPath, label) {
  if (!existsSync(targetPath)) {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  assertPathExists(collectorPath, 'Shared collector');
  assertPathExists(configPath, 'News source config');

  const childArgs = [
    collectorPath,
    'collect',
    '--config',
    configPath,
    '--site',
    siteKey,
    '--date',
    args.date,
    '--out',
    outputDir
  ];

  if (args.emitJson) {
    childArgs.push('--emit-json');
  }

  console.log(`Collecting shared news for ${siteKey} on ${args.date}`);
  console.log(`Collector: ${collectorPath}`);
  console.log(`Config: ${configPath}`);
  console.log(`Output: ${outputDir}`);

  const child = spawn(process.execPath, childArgs, {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
