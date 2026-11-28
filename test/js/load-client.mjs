// Loads catalogue, categoriser, snapshot, and RPC helpers from the shipped
// web/index.html so tests exercise the real client code without changing it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '../..');

function extract(html, start, end) {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a);
  if (a < 0 || b < 0) {
    throw new Error('Could not extract client code starting at ' + JSON.stringify(start));
  }
  return html.slice(a, b);
}

export function loadClient({ networkId = 'onyx', fetchImpl } = {}) {
  const html = readFileSync(path.join(repoRoot, 'web/index.html'), 'utf8');
  const categorySrc = extract(html, 'const categoryRules=', 'const decoder=');
  const snapshotSrc = extract(html, 'function snapshotCSV', 'function showSnapshot');
  const rpcSrc = extract(html, 'async function rpcResult', 'const onyxRealm=');
  const catalogueSrc = extract(html, 'async function catalogue(signal){', '\nfunction readCatalogueCache');
  const catalogueBody = catalogueSrc.replace(/^async function catalogue\(signal\)\{/, '').replace(/\}\s*$/, '');

  const context = {
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    atob,
    setTimeout,
    Promise,
    console,
    fetch: fetchImpl ?? globalThis.fetch,
    networks: {
      onyx: { name: 'Onyx', id: 'onyx-1', rpc: 'https://rpc.onyx.testnets.gno.land', web: 'https://onyx.testnets.gno.land' },
      mainnet: { name: 'Mainnet', id: 'gnoland-1', rpc: 'https://rpc.gno.land', web: 'https://gno.land' }
    },
    network: null
  };
  context.network = context.networks[networkId];
  if (!context.network) throw new Error('unknown network ' + networkId);

  vm.createContext(context);
  vm.runInContext(categorySrc + '\n' + snapshotSrc + '\n' + rpcSrc, context);

  vm.runInContext(
    `async function parseCatalogue(raw){
      const paths=[...new Set(raw.trim().split(/\\s+/))];
      if(paths.length>=10000||!paths.every(path=>packagePath.test(path)))throw new Error('Incomplete realm catalogue.');
      return paths;
    }
    async function catalogue(signal){ ${catalogueBody} }
    this.pathCategory = pathCategory;
    this.displayName = displayName;
    this.gameFamily = gameFamily;
    this.unversioned = unversioned;
    this.packagePath = packagePath;
    this.liveCategories = liveCategories;
    this.unknownDistrict = unknownDistrict;
    this.snapshotCSV = snapshotCSV;
    this.rpcResult = rpcResult;
    this.abci = abci;
    this.catalogue = catalogue;
    this.parseCatalogue = parseCatalogue;`,
    context
  );

  return {
    pathCategory: context.pathCategory,
    displayName: context.displayName,
    gameFamily: context.gameFamily,
    unversioned: context.unversioned,
    packagePath: context.packagePath,
    liveCategories: context.liveCategories,
    unknownDistrict: context.unknownDistrict,
    snapshotCSV: context.snapshotCSV,
    rpcResult: context.rpcResult,
    abci: context.abci,
    catalogue: context.catalogue,
    parseCatalogue: context.parseCatalogue,
    setNetwork(id) {
      context.network = context.networks[id];
    },
    setFetch(fn) {
      context.fetch = fn;
    }
  };
}
