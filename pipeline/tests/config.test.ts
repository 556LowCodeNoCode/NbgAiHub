import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Volume, createFsFromVolume } from "memfs";
import { loadConfig, ConfigSchemaError } from "../src/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES = path.join(__dirname, "fixtures");
const REPO_CONFIG = path.resolve(__dirname, "..", "..", "config", "rss-sources.json");

type FsLike = typeof import("node:fs/promises");

function memFs(tree: Record<string, string>): FsLike {
  const vol = Volume.fromJSON(tree);
  const fs = createFsFromVolume(vol).promises as unknown as FsLike;
  return fs;
}

describe("config.loadConfig", () => {
  it("loads sources from config/rss-sources.json (real seed)", async () => {
    const sources = await loadConfig(REPO_CONFIG);
    expect(sources).toHaveLength(5);
    for (const s of sources) {
      expect(typeof s.name).toBe("string");
      expect(typeof s.url).toBe("string");
      expect(typeof s.enabled).toBe("boolean");
    }
  });

  it("loads the valid fixture file with both enabled and disabled entries", async () => {
    const sources = await loadConfig(path.join(FIXTURES, "rss-sources.valid.json"));
    expect(sources).toHaveLength(2);
    expect(sources[0]?.enabled).toBe(true);
    expect(sources[1]?.enabled).toBe(false);
  });

  it("supports adding entries by editing only the JSON (memfs simulation)", async () => {
    const fs = memFs({
      "/cfg/rss-sources.json": JSON.stringify([
        { name: "A", url: "https://a.example.com", enabled: true },
        { name: "B", url: "https://b.example.com", enabled: true },
        { name: "C", url: "https://c.example.com", enabled: false },
        { name: "D", url: "https://d.example.com", enabled: true },
        { name: "E", url: "https://e.example.com", enabled: true },
        { name: "F", url: "https://f.example.com", enabled: true },
      ]),
    });
    const sources = await loadConfig("/cfg/rss-sources.json", fs);
    expect(sources).toHaveLength(6);
  });

  it("throws ConfigSchemaError on missing file", async () => {
    await expect(loadConfig("/does/not/exist.json")).rejects.toBeInstanceOf(
      ConfigSchemaError,
    );
  });

  it("throws ConfigSchemaError on invalid JSON", async () => {
    const fs = memFs({ "/cfg/x.json": "not json {" });
    await expect(loadConfig("/cfg/x.json", fs)).rejects.toBeInstanceOf(
      ConfigSchemaError,
    );
  });

  it("throws ConfigSchemaError when root is not an array", async () => {
    const fs = memFs({ "/cfg/x.json": JSON.stringify({}) });
    await expect(loadConfig("/cfg/x.json", fs)).rejects.toBeInstanceOf(
      ConfigSchemaError,
    );
  });

  it("throws on a fixture entry missing required fields", async () => {
    await expect(
      loadConfig(path.join(FIXTURES, "rss-sources.invalid.json")),
    ).rejects.toBeInstanceOf(ConfigSchemaError);
  });

  it("throws when url is not http(s)", async () => {
    const fs = memFs({
      "/cfg/x.json": JSON.stringify([
        { name: "X", url: "ftp://example.com", enabled: true },
      ]),
    });
    await expect(loadConfig("/cfg/x.json", fs)).rejects.toBeInstanceOf(
      ConfigSchemaError,
    );
  });

  it("throws when enabled is not boolean", async () => {
    const fs = memFs({
      "/cfg/x.json": JSON.stringify([
        { name: "X", url: "https://example.com", enabled: "yes" },
      ]),
    });
    await expect(loadConfig("/cfg/x.json", fs)).rejects.toBeInstanceOf(
      ConfigSchemaError,
    );
  });
});
