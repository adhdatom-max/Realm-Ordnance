import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadClient } from './load-client.mjs';

const onyx = loadClient({ networkId: 'onyx' });
const mainnet = loadClient({ networkId: 'mainnet' });

function same(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

describe('pathCategory', () => {
  it('sorts known realm families onto the eight islands', () => {
    const cases = [
      ['gno.land/r/gnoland/valopers', 'validators'],
      ['gno.land/r/demo/validators', 'validators'],
      ['gno.land/r/demo/arena', 'games'],
      ['gno.land/r/demo/tavern2048', 'games'],
      ['gno.land/r/demo/gnoswap', 'defi'],
      ['gno.land/r/demo/guestbook', 'social'],
      ['gno.land/r/demo/govdao', 'dao'],
      ['gno.land/r/demo/faucet', 'tools'],
      ['gno.land/r/demo/ordnance', 'tools'],
      ['gno.land/r/demo/grc721', 'nft'],
      ['gno.land/r/someone/mysteryapp', 'uncategorised']
    ];
    for (const [path, want] of cases) {
      assert.equal(onyx.pathCategory(path), want, path);
    }
  });

  it('moves game-like leaderboards and sdks to tools, and unknown game names off the games island', () => {
    assert.equal(onyx.pathCategory('gno.land/r/demo/arena_leaderboard'), 'tools');
    assert.equal(onyx.pathCategory('gno.land/r/demo/game_sdk'), 'tools');
    assert.equal(onyx.pathCategory('gno.land/r/demo/notactuallyagame'), 'uncategorised');
  });

  it('treats the well-known mainnet access realm as tools on mainnet', () => {
    const access = 'gno.land/r/g138mdf0gqzue3ra2r335upclngn8t8r0n72cn3h/access';
    assert.equal(mainnet.pathCategory(access), 'tools');
    assert.equal(onyx.pathCategory(access), 'tools');
  });

  it('lists the eight live category islands including validators', () => {
    same([...onyx.liveCategories], ['defi', 'games', 'social', 'dao', 'tools', 'nft', 'validators', 'uncategorised']);
  });
});

describe('displayName and packagePath', () => {
  it('shows the parent name for a versioned leaf', () => {
    assert.equal(onyx.displayName('gno.land/r/demo/arena/v2'), 'arena v2');
    assert.equal(onyx.displayName('gno.land/r/demo/arena'), 'arena');
  });

  it('accepts only well-formed realm paths', () => {
    assert.equal(onyx.packagePath.test('gno.land/r/demo/arena'), true);
    assert.equal(onyx.packagePath.test('gno.land/r/demo'), false);
    assert.equal(onyx.packagePath.test('gno.land/p/demo/pure'), false);
    assert.equal(onyx.packagePath.test('not-a-path'), false);
  });
});

describe('catalogue parsing', () => {
  it('splits unique realm paths and rejects an incomplete list', async () => {
    const raw = 'gno.land/r/demo/arena\ngno.land/r/demo/gnoswap\n gno.land/r/demo/arena\n';
    same(await onyx.parseCatalogue(raw), [
      'gno.land/r/demo/arena',
      'gno.land/r/demo/gnoswap'
    ]);
    await assert.rejects(() => onyx.parseCatalogue('gno.land/r/demo/arena\nnot-a-realm'), /Incomplete realm catalogue/);
    await assert.rejects(() => onyx.parseCatalogue(''), /Incomplete realm catalogue/);
  });
});

describe('snapshotCSV', () => {
  it('parses data/districts and data/plots CSV from the realm render routes', () => {
    const districts = onyx.snapshotCSV('name,x,z,radius,realms\ndefi,0,-1259,210,80\nvalidators,-1259,0,92,4\n');
    same(districts.ds, [
      { n: 'defi', x: 0, y: -1259, radius: 210 },
      { n: 'validators', x: -1259, y: 0, radius: 92 }
    ]);
    const plots = onyx.snapshotCSV('path,district,name,txs,x,z,last,callers,activeBlocks,height,settlement\ngno.land/r/demo/peak,defi,Peak,100,104,193,recent,22,20,100,Castle\n');
    assert.equal(plots.rows.length, 1);
    assert.equal(plots.rows[0].path, 'gno.land/r/demo/peak');
    assert.equal(plots.rows[0].cat, 'defi');
    assert.equal(plots.rows[0].txs, 100);
    assert.equal(plots.rows[0].x, 104);
    assert.equal(plots.rows[0].y, 193);
    assert.equal(plots.rows[0].callers, 22);
    assert.equal(plots.rows[0].activeBlocks, 20);
  });

  it('rejects a CSV that is not a districts or plots table', () => {
    assert.throws(() => onyx.snapshotCSV('foo,bar\n1,2\n'), /Expected an Ordnance data\/plots or data\/districts CSV/);
  });
});
