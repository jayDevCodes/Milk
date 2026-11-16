import { cp, mkdir } from "node:fs/promises";

const source = new URL("../src/database/migrations/", import.meta.url);
const destination = new URL("../dist/database/migrations/", import.meta.url);

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
