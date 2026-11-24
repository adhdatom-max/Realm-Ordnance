# Realm Ordnance

[Explore the public archipelago](https://realm-ordnance.andy-mawer.chatgpt.site) · [Check the Onyx realm package](https://gpas.onyx.testnets.gno.land/?path=gno.land/r/g19j4y5lzwkcuguf8a95pjueuhn7ay58gm0y3wen/realmordnance)

Realm Ordnance turns the Gno ecosystem into a landscape you can explore and use. Each island represents a category of realms, such as DeFi, games, social projects, or tools. The island grows as more realms are charted there. Each realm has its own place on the land: successful calls raise its hill, while distinct callers and active blocks shape its footprint and settlement. A quiet realm may be a cottage; growing participation makes a village, and sustained use can make a castle.

This is also a way to find where to build. Search for a realm, compare activity across categories, inspect a building to see its path and recent use, and follow its link into the real Gno realm. Wander through quiet areas to discover projects that could use contributors, or look across an island to spot gaps where a new tool, game, or community might belong. The terrain is an invitation to investigate, not a claim that activity alone measures quality. Walk the islands in first person, take a boat from a jetty, steer between categories, or let the boat give you a slow tour of the archipelago.

The browser scans Mainnet or Onyx for recent realm activity. The Gno realm on Onyx provides a public, inspectable snapshot and read routes for the mapped districts and plots. Its snapshot is published in batches and replaced atomically; it requires an external publisher to keep it up to date.

## What is here

- `realm/ordnance.gno` is the Gno (Go dialect) realm that stores and renders published snapshots. `Begin`, `AddDistricts`, and `AddPlots` stage batched data; `Publish` swaps the complete map into view. A failed batch cannot expose a half-finished map.
- `realm/ordnance_test.gno` tests the snapshot swap and settlement thresholds against the GnoVM.
- `web/index.html` is the self-contained 3D browser view. Its live catalogue and activity scan read Mainnet or Onyx RPC directly. The 3D renderer and boat controls are JavaScript because Gno runs on chain, not inside the browser.

The browser can also import `data/plots` and `data/districts` CSV exports from the Gno realm. The on-chain publisher must send verified observations from the scanner; the realm validates structure and access, but cannot independently scan historical block receipts. In the browser, the live scan verifies transaction receipts before counting successful direct realm calls. Category labels are inferred from names and should not be treated as verified descriptions.

## Run locally

Open `web/index.html` in a recent browser with WebGL. Choose Mainnet or Onyx and allow the scan to finish. Walk with WASD or arrows, drag to look, click a building, press E at a jetty, or choose Auto Tour aboard the boat.

## Test the Gno realm

With the Gno toolchain installed, run `gno test -v .` inside `realm/`. This package was tested locally using GnoVM v1.8.0 with the Gno source tree set as `GNOROOT`.

## Deploy and publish a snapshot

The module path in `realm/gnomod.toml` uses Artemis's public Gno address. The package was uploaded to Onyx at `gno.land/r/g19j4y5lzwkcuguf8a95pjueuhn7ay58gm0y3wen/realmordnance` in transaction `i74mvucW0bg2J9ZI1FYqIXyV0ZH3r00GU+B0QQYvETA=` at block 1373705. [Its package approval status](https://gpas.onyx.testnets.gno.land/?path=gno.land/r/g19j4y5lzwkcuguf8a95pjueuhn7ay58gm0y3wen/realmordnance) is **in review queue** as last reported, so the realm is not yet callable. The package name and last path element are both `realmordnance`.

The deploying address owns the new realm. After it is enabled, call these functions in order from that address:

1. `Begin(label, date)` to start staging a replacement.
2. `AddDistricts(csv)` with up to 80 `name,x,z,radius` rows per call.
3. `AddPlots(csv)` with up to 80 `path,district,name,calls,callers,blocks,x,z,last` rows per call. Coordinates are offsets from their district centre. CSV fields cannot contain commas or newlines.
4. `Publish()` to make the validated snapshot visible all at once.

The two read routes are `data/districts` and `data/plots`. A category route such as `defi` renders its buildings and links to their actual Gno realm pages. The `data/plots` output includes `txs`, `callers` and `activeBlocks` columns understood by the browser importer.

A snapshot is externally supplied and dated; it is **not** magically kept current by the realm. The browser continues its own live RPC scan, and a publisher must deliberately update the on-chain snapshot. Limits are 40 districts, 2,000 plots and 80 rows per call.

## Hackathon status

This repository is source code, not a submission receipt. The DoraHacks rules require a working testnet deployment, public repository, README, demo video and description. The `realmordnance` package has been uploaded but awaits approval. It still needs activation, a published snapshot and verification that `Render` works before it can be described as a working on-chain realm.

The embedded Three.js renderer retains its upstream copyright notice. All project-specific source is provided for public review; a licence for reuse has not yet been chosen.
