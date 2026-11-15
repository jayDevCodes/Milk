# ADR 0002: Regional offline maps and private routing

- Status: Accepted
- Date: 2026-11-15

## Context

The initial service area is limited and mobile connectivity can be unreliable. Clients need detailed roads offline; live updates and route calculation still require the Milk backend.

## Decision

- Render local vector basemaps with MapLibre Native Android.
- Generate regional OpenStreetMap vector tiles as PMTiles with local style/sprite/glyph assets.
- Build a separate buffered regional Valhalla graph from OSM PBF.
- Keep Valhalla private behind Node.js; clients call only the Milk API.
- Display OSM attribution and comply with ODbL/provider terms.
- Keep generated map/graph binaries out of normal source commits; publish approved assets as versioned releases.

The 15 km seller geodesic eligibility rule is a business boundary, not the map coverage boundary. Map coverage needs an outer road-connectivity buffer.

## Consequences

Offline rendering avoids repeated map tile requests; live tracking and server routing still require network. Map and graph versions must be compatible and validated against actual rural roads.
