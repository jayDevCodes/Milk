# Milk — Regional Offline Map and Routing Strategy

**Research snapshot:** 15 November 2026  
**New product constraint:** Every seller assigned to a dairy must be within 15 km of that dairy depot (straight-line/geodesic radius unless the dairy owner defines a different rule).

## 1. Decision summary

Use a local, prebuilt OpenStreetMap vector basemap in PMTiles format, rendered by MapLibre Native Android. Build a separate local road-routing graph from the same regional OSM source using Valhalla, running privately alongside the Node.js API.

Two different data products are required:

1. **Basemap PMTiles** — roads, settlement labels, buildings, land/water and map context. Android uses it for display; it can be bundled in each APK.
2. **Valhalla routing graph** — routable roads and restrictions used by the backend to calculate road routes, distances, durations, matrices and optimized stop order. It is not a visual map and does not replace PMTiles.

This removes the need to request external map tiles repeatedly and avoids Google Maps Platform tile/routing requests for the initial local dairy pilot.

The clients still need internet for authenticated live vehicle updates and GPS synchronization. An offline basemap does not make internet-delivered live tracking work when the phone has no network.

## 2. Selected technologies

| Job | Selected technology | Responsibility |
|---|---|---|
| Android map renderer | MapLibre Native Android 13.7.1 stable baseline | Draw local vector tiles, overlays and moving vehicle |
| Compose integration | AndroidView hosting native MapView | Use Compose UI without relying on an unstable map wrapper API |
| Regional tile archive | PMTiles | One compact, seekable archive for vector tile data |
| Regional map data | OpenStreetMap ODbL data | Roads, tracks, settlements, buildings and geographic context |
| Tile generator | Protomaps Basemap V4 / Planetiler | Build a local regional PMTiles archive from an OSM PBF extract |
| Local route engine | Valhalla | Server-side road route, time/distance matrix, map matching and optimized stop order |
| Backend integration | Private Valhalla service behind Node.js/Express | Keep one public Milk API; Android clients never call Valhalla directly |
| Spatial/business rule | PostgreSQL + PostGIS | Enforce seller geodesic 15,000 m depot radius and index coordinates |
| Map styling | Local MapLibre style JSON + local sprites/glyphs | No remote style/font dependency during offline map display |

MapLibre Android 13.7.1 is the stable release baseline identified in current official release material. It includes Android PMTiles APK-asset byte-range support, added in the October 2026 release notes. Pin the exact artifact only after the Step 2 device proof of concept. If the fleet includes older/low-end Android devices, test the Vulkan/OpenGL multi-backend artifact; otherwise test the default renderer first. Multi-backend is larger but can select a compatible renderer at runtime.

Do not start with MapLibre Compose for the production foundation: its own overview says the Compose API is not yet stable. Embed the stable native MapView via Compose AndroidView and wrap lifecycle/event handling in a shared map module.

## 3. The 15 km business rule and map coverage are not identical

Business rule:
- A seller's registered home coordinate must be within 15,000 metres geodesically of the dairy depot.
- Enforce this on the backend using PostGIS geography distance, not with a client-side circle alone.
- The exact seller home point is master data. An optional road-access point may be used for routing when the house is not directly reachable from a road.

Conceptual SQL:

    ST_DWithin(
      dairy.depot_location::geography,
      seller.home_location::geography,
      15000
    )

Map-data coverage:
- Start with the 15 km operational circle and build a surrounding coverage polygon with an initial 5 km outer margin (about a 20 km coverage radius).
- The margin is for road detours, nearby junctions and map framing; it does not change the 15 km seller eligibility rule.
- Inspect route connectivity at the edge. Increase the buffer where actual road routes need it; a fixed radius cannot guarantee every possible detour.
- Include the dairy depot, all seller points, route access points and the roads joining them.
- Build the routing graph from a buffered extract too, not a circle clipped exactly at 15 km, otherwise roads can terminate at the extract boundary.

Use one PMTiles package per dairy/service area. If the platform later supports multiple depots, each dairy can have a separately versioned map bundle or a combined union region.

## 4. What "HD map" should mean here

Use vector tiles, not thousands of high-resolution raster screenshots.

Benefits:
- Lines, symbols and text are rendered at the phone's screen density, so they remain crisp when zooming/rotating.
- Style can make local roads thicker, distinguish paved/unpaved roads and show settlement names.
- One vector archive can serve multiple themes (light/dark) without duplicating road geometry.
- Road labels, buildings and rural tracks can appear at larger zooms if present in the OSM source.

Starting zoom plan for a pilot:
- z0–z7: broad context/region.
- z8–z14: district, settlements and main/local roads.
- z15–z17: street-level roads, tracks, buildings and pickup context.
- Evaluate z18 only if real device testing shows a need and the local source data contains useful detail. Each extra zoom level can roughly double a PMTiles regional extract, so do not include it blindly.

The default Protomaps basemap is a general-purpose map, not every OSM tag. For Milk, build/test a focused layer set that retains rural roads and tracks (including residential, unclassified, service, track, path where relevant), names, place labels, water, landuse and individual buildings at high zoom. Confirm layer/schema names and local feature coverage in the generated archive before writing final style expressions.

Vector maps do not create missing road data. If a rural road or building is absent from OpenStreetMap source data, increasing zoom or resolution will not make it appear. Validate every dairy collection road in the real area; add/correct source data through an appropriate OSM editing/survey workflow or use audited private route geometry where needed.

For this vehicle-pickup app, a clear vector road map is a better default than offline satellite imagery. Satellite/orthophoto packages are much larger and require a suitable imagery licence; offer them only as a separate licensed layer if there is a demonstrated need.

## 5. Building the PMTiles regional map package

Recommended pipeline:
1. Get an OSM PBF extract covering the whole buffered service area from a suitable regional extract provider (for example Geofabrik) or create a clip from a suitable source.
2. Create a GeoJSON polygon for the dairy coverage area (15 km radius plus outer buffer).
3. Use Protomaps Basemap V4 / Planetiler to generate a local vector map clipped to that polygon.
4. Include required OSM layers and language labels; configure/test the zoom range.
5. Validate the PMTiles metadata, tile bounds, tile coverage, tile count and file size.
6. Create a local MapLibre style JSON, sprite files and glyph/font data. Bundle all style dependencies needed for offline text/icons; do not leave remote font/sprite URLs.
7. Load the archive locally in Android and test offline after disabling network access.
8. Record source snapshot date, polygon/version, generator version, style version, zoom limits and SHA-256/BLAKE3 checksum.

PMTiles creation/extraction tools can produce a focused regional archive. Protomaps documents the Planetiler build pipeline, local clipping and PMTiles extract operation. Each additional zoom level can roughly double archive size; measure actual size for this specific locality rather than guessing.

### Bundling in the Android app

MapLibre Native supports PMTiles directly from APK assets using a source such as:

    pmtiles://asset://maps/dairy-region.pmtiles

The October 2026 Android release notes added byte-range reads for PMTiles in APK assets. Verify the exact syntax and renderer on the selected SDK artifact in a small proof of concept before adding it to all three apps.

Bundling approach:
- android/apps/driver/src/main/assets/maps/dairy-region.pmtiles
- android/apps/seller/src/main/assets/maps/dairy-region.pmtiles
- android/apps/owner/src/main/assets/maps/dairy-region.pmtiles
- Add the same versioned MapLibre style, sprite and glyph assets needed offline.
- All three APKs carry their own copy because Android apps have separate application sandboxes. For separate users/devices, that is expected.
- If the archive is too large for convenient APK distribution, publish one .pmtiles map pack as a separate GitHub Release asset and download it once on first setup into the app-private files directory. Verify checksum before activation. Do not fetch individual tiles.
- A map pack version can be updated independently of app code when distributed separately; if fully embedded, ship a new APK when map data changes.
- For Google Play distribution later, evaluate Play Asset Delivery for a large separately versioned map pack. It is not a general mechanism for sideloaded GitHub APKs.

Keep map packages out of ordinary source-control commits if they are large generated binaries. Store the generated pack as a versioned release artifact; commit generation configuration, style files and reproducible scripts.

## 6. Licensing and data source restrictions

- OpenStreetMap data is available under the Open Database License (ODbL); show visible attribution such as "© OpenStreetMap contributors" and provide a copyright/licence notice.
- Do not bulk-download or prefetch tiles from tile.openstreetmap.org to create offline packs. The OSM tile policy explicitly prohibits pre-seeding, scraping and offline area downloads from its public tile servers.
- Download/use the underlying OSM data extract (PBF) or use a provider whose licence explicitly permits offline regional packages.
- Google Maps Platform map content cannot simply be bulk-copied into an APK or used as a private offline tile database; its terms restrict prefetching, storage and offline tile use.
- Keep OSM attribution visible in all three apps and in any map-package documentation. Review ODbL obligations for the generated database/tileset distribution before a public/commercial release.

## 7. Local routing with Valhalla

Use the same regional OSM snapshot as the PMTiles generation wherever practical.

Build process:
1. Download the buffered regional OSM PBF.
2. Generate a Valhalla configuration and build the routing tiles/graph with Valhalla's build tools.
3. Run Valhalla as an internal/private service (for example a Docker service only reachable from the Node backend).
4. Node's RoutingProvider adapter calls the private route engine.
5. Public Android API remains the Milk Node API; phones do not know the Valhalla host/port.

Useful Valhalla capabilities:
- /route for road geometry, legs and time/distance.
- Matrix service for travel-time/distance matrices.
- /optimized_route for a fixed-start/fixed-end stop-order optimization. The first and last locations are kept in place while intermediate locations are reordered, which fits dairy depot → sellers → dairy depot.
- Map-matching service can help snap GPS traces to the local road graph.

Important operational details:
- For one seller, skip optimization; for two or more sellers, pass depot as both the first and last point.
- Validate the returned original_index/stop mapping before saving the optimized sequence.
- Confirm that every seller is reachable; handle unreachable rural coordinates as an explicit route-review error.
- Compare Valhalla route results against actual drives in the collection area before trusting ETA.
- Route order optimization minimizes the selected engine cost (time or distance), not every dairy business constraint automatically. Add explicit constraints later if you need pickup time windows, vehicle capacity or workload balancing.
- Keep manual route via-points and driver corrections separate from seller stop records.
- Valhalla is a local road-routing engine, not a guaranteed live-traffic data service. Initial ETAs are model-based estimates from OSM road topology/costing; label them as estimates.
- The backend still receives API requests over the internet from phones for route creation, location sync and live tracking. However, those calls go to Milk's backend/Valhalla, not a third-party map API.

## 8. Runtime behaviour

Driver app:
- Opens the bundled local PMTiles basemap immediately.
- Loads the driver's saved route geometry and numbered stop overlays from Room/backend.
- During an active trip, draws the device GPS marker on the local map.
- Queues GPS samples locally when network is lost and sends them when the backend reconnects.
- Route calculation/edit/publish needs access to Milk backend's Valhalla adapter; a previously published route remains viewable offline.

Seller app:
- Shows its own registered home point and the assigned vehicle marker on the local basemap.
- The map itself renders offline.
- Live vehicle position, ETA refresh and new trip state require connectivity to Milk backend. Without network, show last update time/stale state; never imply old data is live.
- Heading-up map uses device Rotation Vector sensor and local camera bearing. This does not require a map provider request.

Owner app:
- Renders the whole dairy's vehicle/route map locally.
- Fleet live positions and current trip progress still arrive through REST/WSS.
- Can inspect cached route geometry offline; fresh fleet state requires connectivity.

## 9. Data updates, integrity and release management

Create a map bundle manifest with:
- map_bundle_id
- dairy_id or region identifier
- source_name and OSM snapshot timestamp
- coverage polygon/version and intended radius/buffer
- tile schema and style version
- min/max zoom
- PMTiles file size
- checksum (SHA-256 or BLAKE3)
- MapLibre minimum compatible version
- generation timestamp

Update maps deliberately (for example after a monthly/quarterly road-data review or when a collection road changes). Do not rebuild/repackage maps every day without a reason. Use a preview map and validate roads before promoting a new bundle. Keep the currently active map version available until the new version is verified, so failed updates can roll back.

Keep the OSM source snapshot associated with route-engine graph version. Map rendering and route calculation should use compatible road data. Store a routing_data_version with each published route/trip for historical reproducibility.

## 10. Performance and field acceptance tests

Test on representative low-cost Android devices used by drivers/sellers:
- Cold start map render with airplane mode enabled.
- Pan/zoom/rotate map across the whole service polygon without network.
- High-zoom road visibility and label legibility on 720p and 1080p screens.
- APK download/install size with and without bundled map pack.
- PMTiles loading speed and memory use.
- GPU renderer crashes/device compatibility (Vulkan/OpenGL).
- Drive each common collection road and compare mapped road geometry to the actual road.
- Test seller coordinate reachability and road-access points.
- Compare Valhalla distance/duration estimates against measured trips.
- Verify routes near the extract edge do not fail due to clipped graph connectivity.
- Test app updates preserve map cache and do not leave a corrupt partial archive.

Do not claim map coverage or archive size until a real local OSM extract and 15–20 km buffered polygon have been built and measured.

## 11. Official references

- MapLibre Native Android releases: https://github.com/maplibre/maplibre-native/releases
- MapLibre Native Android PMTiles example: https://maplibre.org/maplibre-native/android/examples/data/PMTiles/
- MapLibre Native Android rendering backends: https://maplibre.org/maplibre-native/android/examples/data/rendering-engine/
- MapLibre Compose status (API not stable): https://maplibre.org/maplibre-compose/
- MapLibre October 2026 newsletter (PMTiles in APK assets): https://maplibre.org/news/2026-10-01-maplibre-newsletter-september-2026/
- Protomaps local basemap generation: https://docs.protomaps.com/basemaps/build
- Protomaps basemap downloads/partial extracts: https://docs.protomaps.com/basemaps/downloads
- Protomaps basemap layers: https://docs.protomaps.com/basemaps/layers
- Protomaps PMTiles generation: https://docs.protomaps.com/pmtiles/create
- OpenStreetMap tile policy: https://operations.osmfoundation.org/policies/tiles/
- OpenStreetMap vector tile policy: https://operations.osmfoundation.org/policies/vector/
- OSM copyright and licence: https://www.openstreetmap.org/copyright
- Valhalla routing API overview: https://valhalla.github.io/valhalla/api/
- Valhalla route API: https://valhalla.github.io/valhalla/api/route/
- Valhalla optimized route API: https://valhalla.github.io/valhalla/api/optimized_route/
- Valhalla build instructions: https://valhalla.github.io/valhalla/building/
- Valhalla Node.js bindings: https://valhalla.github.io/valhalla/bindings/nodejs/
- PostGIS ST_DWithin: https://postgis.net/docs/ST_DWithin.html
- Android app size guidance: https://developer.android.com/topic/performance/reduce-apk-size
- Play Asset Delivery overview: https://developer.android.com/guide/playcore/asset-delivery

This design removes repeated third-party map rendering/routing API dependency for the local dairy region, but live tracking still requires the Milk backend network connection.
