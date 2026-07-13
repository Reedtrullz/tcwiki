import './require-node22.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareStandaloneAssets } from './prepare-standalone-assets.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

prepareStandaloneAssets(root);

await import(pathToFileURL(join(root, '.next/standalone/server.js')).href);
