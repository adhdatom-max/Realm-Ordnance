import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadClient } from './load-client.mjs';

function jsonResponse(status, body, { failOnce } = {}) {
  let calls = 0;
  return async (url) => {
    calls += 1;
    if (failOnce && calls === 1) {
      return { ok: false, status: failOnce, json: async () => ({}) };
    }
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body
    };
  };
}

describe('rpcResult', () => {
  it('returns the JSON-RPC result from a healthy endpoint', async () => {
    const client = loadClient({
      networkId: 'onyx',
      fetchImpl: jsonResponse(200, { result: { ok: true } })
    });
    const result = await client.rpcResult('status', {});
    assert.deepEqual(result, { ok: true });
  });

  it('retries once on HTTP 500 or 429 and then succeeds', async () => {
    const client = loadClient({
      networkId: 'onyx',
      fetchImpl: jsonResponse(200, { result: { recovered: true } }, { failOnce: 500 })
    });
    const result = await client.rpcResult('status', {});
    assert.deepEqual(result, { recovered: true });
  });

  it('throws a clear error when the RPC stays down or returns no result', async () => {
    const down = loadClient({
      networkId: 'onyx',
      fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) })
    });
    await assert.rejects(() => down.rpcResult('status', {}), /Onyx RPC returned HTTP 503/);

    const missing = loadClient({
      networkId: 'onyx',
      fetchImpl: jsonResponse(200, {})
    });
    await assert.rejects(() => missing.rpcResult('status', {}), /The network returned no result/);

    const errored = loadClient({
      networkId: 'onyx',
      fetchImpl: jsonResponse(200, { error: { message: 'dial failed' } })
    });
    await assert.rejects(() => errored.rpcResult('abci_query', {}), /dial failed/);
  });
});

describe('abci', () => {
  function abciFetch(body) {
    return jsonResponse(200, { result: { response: body } });
  }

  it('decodes a successful ABCI payload', async () => {
    const data = Buffer.from('gno.land/r/demo/arena\n', 'utf8').toString('base64');
    const client = loadClient({
      networkId: 'onyx',
      fetchImpl: abciFetch({ ResponseBase: { Error: null, Data: data, Code: 0 } })
    });
    const raw = await client.abci('vm/qpaths?limit=10000', 'gno.land/r/');
    assert.equal(raw, 'gno.land/r/demo/arena\n');
  });

  it('explains a missing package and other ABCI failures', async () => {
    const missing = loadClient({
      networkId: 'onyx',
      fetchImpl: abciFetch({ ResponseBase: { Log: 'package not found', Data: '', Code: 1 } })
    });
    await assert.rejects(
      () => missing.abci('vm/qrender', 'gno.land/r/demo/missing:data/plots'),
      /Onyx has not enabled the Realm Ordnance package yet/
    );

    const failed = loadClient({
      networkId: 'onyx',
      fetchImpl: abciFetch({ ResponseBase: { Log: 'boom', Data: '', Code: 1 } })
    });
    await assert.rejects(() => failed.abci('vm/qrender', 'x'), /boom/);
  });

  it('lets catalogue() surface an incomplete path list from a bad RPC payload', async () => {
    const data = Buffer.from('not-a-realm\n', 'utf8').toString('base64');
    const client = loadClient({
      networkId: 'onyx',
      fetchImpl: abciFetch({ ResponseBase: { Error: null, Data: data, Code: 0 } })
    });
    await assert.rejects(() => client.catalogue(), /Incomplete realm catalogue/);
  });
});
