import { describe, it, expect, vi } from "vitest";
import { fetchFeedXml, FeedFetchError } from "../src/fetch.js";

function okResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/xml" },
  });
}

describe("fetch.fetchFeedXml", () => {
  it("fetches feed and returns XML on 200 OK", async () => {
    const fakeFetch = vi.fn(async () => okResponse("<rss/>"));
    const out = await fetchFeedXml("https://example.com/x.xml", fakeFetch as unknown as typeof fetch);
    expect(out).toBe("<rss/>");
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it("throws FeedFetchError on HTTP 500", async () => {
    const fakeFetch = vi.fn(async () => new Response("oops", { status: 500 }));
    try {
      await fetchFeedXml("https://example.com/x.xml", fakeFetch as unknown as typeof fetch);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(FeedFetchError);
      const e = err as FeedFetchError;
      expect(e.status).toBe(500);
      expect(e.url).toBe("https://example.com/x.xml");
    }
  });

  it("throws FeedFetchError on HTTP 429", async () => {
    const fakeFetch = vi.fn(async () => new Response("rate limit", { status: 429 }));
    await expect(
      fetchFeedXml("https://reddit.example.com/.rss", fakeFetch as unknown as typeof fetch),
    ).rejects.toMatchObject({ name: "FeedFetchError", status: 429 });
  });

  it("throws FeedFetchError on network error (status null)", async () => {
    const fakeFetch = vi.fn(async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    });
    try {
      await fetchFeedXml("https://nowhere.invalid/x.xml", fakeFetch as unknown as typeof fetch);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(FeedFetchError);
      const e = err as FeedFetchError;
      expect(e.status).toBeNull();
    }
  });

  it("respects custom timeoutMs option", async () => {
    const fakeFetch = vi.fn(async (_url, _init) => okResponse("<x/>"));
    await fetchFeedXml(
      "https://example.com/x.xml",
      fakeFetch as unknown as typeof fetch,
      { timeoutMs: 100 },
    );
    // Just ensure the call is made; the signal is passed via init.
    expect(fakeFetch).toHaveBeenCalled();
  });
});
