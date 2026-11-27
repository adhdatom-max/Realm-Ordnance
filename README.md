# Realm Ordnance

A walkable, live chart of Gno.land. Sail an archipelago whose islands are realm categories, walk up to buildings to inspect their realms, and use the open ground to spot places where builders could add something new.

The browser scans Gno RPC for realm calls in a chosen block window. Island area follows the number of charted realms in that category. Each realm shapes its own rise: height follows successful calls, width follows distinct callers, and footprint follows active blocks. Small settlements grow from cottages to villages and castles as activity grows. These are visual measures of use, not endorsements or a measure of code quality. Categories inferred from names may be wrong.

## Explore

Open `web/index.html` in a modern desktop browser. There is no build step. The view opens on empty sea with a plain loading status. A tiny genesis island at the centre rises first and shows block 1 of the selected network (height, time, chain ID and block hash) read from that network's RPC. The category islands then rise out of the water as the live scan returns their activity. Choose Mainnet or Onyx and a block window; the browser fetches and verifies activity from that chain's RPC. The searchable catalogue can contain more realms than the chart: the chart shows active realms and a few older sightings in sparse categories. A quiet Games island remains available for its jetty and tackle shop even if no Games realm was active in the window.

- Open the chart for an overhead view and search realm names and paths.
- Switch to first person, use WASD or arrows to walk, and drag to look. Click a building to inspect its realm and follow **Enter realm**. Click the marker on the genesis island to inspect block 1.
- At a jetty, press E or the action button to board or land. W/S controls boat speed and A/D steers. Auto Tour cruises at a slower pace around the islands; manual steering is faster. While you sail in first person, a small chart in the corner shows the boat, its heading and the islands; it hides when you go ashore.
- Find the tackle shop on Games island, take a rod, and cast from a jetty or boat with F or the button. At a bite, answer an **untimed** Go question with one retry to set the hook. Then hold F to reel and release when tension rises. The catch book, rod and lesson score stay in browser storage. Fishing is a local diversion, not an on-chain transaction.
- Live updates do not teleport someone mid-walk or mid-sail. Changed terrain is applied when you return to a jetty.

Three.js is bundled inside the HTML. The 3D view needs WebGL; live chain scans need internet access. RPC access from a browser also depends on the selected endpoint being reachable and permitting browser requests. If a scan fails, the status line says so and the scan retries; no sample terrain is drawn in its place. If block 1 cannot be read, the genesis island says its details are unavailable.

## Gno realm on Onyx

The Gno source is `realm/ordnance.gno`, package `realmordnance`, at:

`gno.land/r/g19j4y5lzwkcuguf8a95pjueuhn7ay58gm0y3wen/realmordnance`

The package is enabled on Onyx and a snapshot is published, live at [the Onyx realm page](https://onyx.testnets.gno.land/r/g19j4y5lzwkcuguf8a95pjueuhn7ay58gm0y3wen/realmordnance). The current snapshot is `Onyx blocks 1439768-1444767 (2026-11-27) — 18 realms across 4 islands`, staged with Begin at height 1,444,971, AddDistricts at 1,444,982, AddPlots at 1,445,011, and Publish at height 1,445,045 in transaction `qewqcUO9H++TgtGTyYaEYU/AlpP2gIRm0gLpOLnS2ZU=`. The package was originally submitted in transaction `i74mvucW0bg2J9ZI1FYqIXyV0ZH3r00GU+B0QQYvETA=` at height 1,373,705. Current package status is also visible through [Onyx package status](https://gpas.onyx.testnets.gno.land/?path=gno.land/r/g19j4y5lzwkcuguf8a95pjueuhn7ay58gm0y3wen/realmordnance).

The realm stores a **labelled snapshot** of districts and plots. It has a gnoweb overview, district pages, and machine-readable `data/districts` and `data/plots` CSV render routes. The owner stages a snapshot using these calls, in order:

1. `Begin(cur, label, date)` starts a replacement while the old published map stays visible.
2. `AddDistricts(cur, csv)` stages up to 80 `name,x,z,radius` rows per call.
3. `AddPlots(cur, csv)` stages up to 80 `path,district,name,calls,callers,blocks,x,z,last` rows per call. `x,z` here are offsets from the district centre.
4. `Publish(cur)` validates completion and swaps the staged map into view atomically.

The on-chain source validates field shapes and bounds, but **does not independently verify the supplied activity counts**. The browser's live scan is separate from this owner-published snapshot. A snapshot has to be prepared from verified scan results and published by the owner; merely deploying the package does not populate it. The realm's `Height` uses an integer square-root score relative to its snapshot maximum, while the browser applies a fixed logarithmic height scale to live activity. They convey the same ordering but are not numerically identical.

Click **Load Onyx realm** in the browser to read both CSV routes directly with `vm/qrender`. This switches the view to the published on-chain snapshot and pauses the live scan. **Load Onyx CSVs** remains available for files exported from those two routes. Selecting Onyx in the network menu instead scans current Onyx activity from RPC; it does not claim to read the stored snapshot.

## Source and checks

- `web/index.html` — single-file browser client, live scanner, chart, walk and boat modes.
- `realm/ordnance.gno` and `realm/gnomod.toml` — Onyx realm source and module path.
- `realm/ordnance_test.gno` — Gno tests for staging, atomic publication and bounds.

Run the realm tests with a compatible Gno toolchain by opening the `realm/` directory and running `gno test .`. Test the browser with a reachable RPC, including clicking **Load Onyx realm** to read the published snapshot.

Realm Ordnance is an independent project and is not operated or endorsed by Gno.land.
