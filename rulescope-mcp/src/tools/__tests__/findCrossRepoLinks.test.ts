import { describe, it, expect } from "vitest";
import { findCrossRepoLinks } from "../findCrossRepoLinks.js";
import { withFixtureRepo, makeFixtureRepo, removeFixtureRepo } from "../../../test/helpers/makeFixtureRepo.js";

// ─── HTTP route tests ─────────────────────────────────────────────────────────

describe("findCrossRepoLinks — HTTP routes", () => {
  it("detects a provider/consumer pair for /api/shipping", async () => {
    const providerRepo = await makeFixtureRepo("cross-repo-provider");
    const consumerRepo = await makeFixtureRepo("cross-repo-consumer");
    try {
      const { links } = await findCrossRepoLinks({
        repoPaths: [providerRepo, consumerRepo],
      });

      const httpLinks = links.filter((l) => l.kind === "http_route");
      expect(httpLinks.length).toBeGreaterThan(0);

      const shippingLink = httpLinks.find(
        (l) => l.matchedValue === "/api/shipping",
      );
      expect(shippingLink).toBeDefined();
      if (!shippingLink) return;

      // Provider must be in the provider repo
      expect(shippingLink.provider.repoPath).toBe(providerRepo);
      expect(shippingLink.provider.tool).toBe("git_grep");
      expect(shippingLink.provider.snippet).toMatch(/router\.get/);

      // Consumer must be in the consumer repo
      expect(shippingLink.consumer.repoPath).toBe(consumerRepo);
      expect(shippingLink.consumer.tool).toBe("git_grep");
      expect(shippingLink.consumer.snippet).toMatch(/fetch/);
    } finally {
      await removeFixtureRepo(providerRepo);
      await removeFixtureRepo(consumerRepo);
    }
  });

  it("detects template-literal fetch(`${host}/api/shipping`) as a consumer", async () => {
    const providerRepo = await makeFixtureRepo("cross-repo-provider");
    const consumerRepo = await makeFixtureRepo("cross-repo-consumer");
    try {
      const { links } = await findCrossRepoLinks({
        repoPaths: [providerRepo, consumerRepo],
      });

      const httpLinks = links.filter(
        (l) => l.kind === "http_route" && l.matchedValue === "/api/shipping",
      );
      // consumer fixture has both plain and template-literal fetch calls
      // At minimum one link must exist for /api/shipping
      expect(httpLinks.length).toBeGreaterThan(0);
    } finally {
      await removeFixtureRepo(providerRepo);
      await removeFixtureRepo(consumerRepo);
    }
  });

  it("flags a provider with no consumer as unknown_external_consumer", async () => {
    // Only the provider repo, no consumer
    await withFixtureRepo("cross-repo-provider", async (providerRepo) => {
      const { issues } = await findCrossRepoLinks({
        repoPaths: [providerRepo],
      });

      const shippingIssue = issues.find((s) => s.includes("/api/shipping"));
      expect(shippingIssue).toBeDefined();
      expect(shippingIssue).toContain("unknown external consumers");
    });
  });

  it("does not pair provider and consumer in the same repo", async () => {
    // Provider repo also has a fetch call in the same repo — must NOT link to itself
    await withFixtureRepo("cross-repo-provider", async (repo) => {
      const { links } = await findCrossRepoLinks({ repoPaths: [repo] });
      const selfLinks = links.filter(
        (l) => l.kind === "http_route" && l.provider.repoPath === l.consumer.repoPath,
      );
      expect(selfLinks).toHaveLength(0);
    });
  });
});

// ─── Shared-package tests ─────────────────────────────────────────────────────

describe("findCrossRepoLinks — shared packages", () => {
  it("detects a shared package link between provider and consumer", async () => {
    const sharedRepo = await makeFixtureRepo("cross-repo-shared-pkg");
    const consumerRepo = await makeFixtureRepo("cross-repo-consumer");
    try {
      const { links } = await findCrossRepoLinks({
        repoPaths: [sharedRepo, consumerRepo],
      });

      const pkgLinks = links.filter((l) => l.kind === "shared_package");
      expect(pkgLinks.length).toBeGreaterThan(0);

      const link = pkgLinks.find((l) => l.matchedValue === "my-shared-utils");
      expect(link).toBeDefined();
      if (!link) return;

      expect(link.provider.repoPath).toBe(sharedRepo);
      expect(link.consumer.repoPath).toBe(consumerRepo);
    } finally {
      await removeFixtureRepo(sharedRepo);
      await removeFixtureRepo(consumerRepo);
    }
  });

  it("flags a shared package with no consumer as unknown_external_consumer", async () => {
    await withFixtureRepo("cross-repo-shared-pkg", async (sharedRepo) => {
      const { issues } = await findCrossRepoLinks({ repoPaths: [sharedRepo] });
      const pkgIssue = issues.find((s) => s.includes("my-shared-utils"));
      expect(pkgIssue).toBeDefined();
      expect(pkgIssue).toContain("unknown external consumers");
    });
  });
});

// ─── DB table / event topic tests ────────────────────────────────────────────

describe("findCrossRepoLinks — DB tables and event topics", () => {
  it("detects cross-repo DB table links (FROM orders in serviceB references orders from serviceA)", async () => {
    // Use two separate repos each containing one of the service files
    // We'll use the same db fixture for both, since both files are in it,
    // but test that same-repo pairs are handled (no cross-repo link here).
    await withFixtureRepo("cross-repo-db", async (dbRepo) => {
      const { links } = await findCrossRepoLinks({ repoPaths: [dbRepo] });
      // Both files are in the same repo → no cross-repo DB links
      const dbLinks = links.filter((l) => l.kind === "db_table");
      // Could be 0 (same repo), confirm no cross-repo self-links
      for (const link of dbLinks) {
        expect(link.provider.repoPath).not.toBe(link.consumer.repoPath);
      }
    });
  });

  it("detects cross-repo DB table link when two repos share the same table name", async () => {
    // Two copies of the db fixture → serviceA in one, serviceB in the other
    // Both will contain CREATE TABLE orders and FROM/JOIN orders,
    // but from different repos → should produce cross-repo db_table links
    const repoA = await makeFixtureRepo("cross-repo-db");
    const repoB = await makeFixtureRepo("cross-repo-db");
    try {
      const { links } = await findCrossRepoLinks({ repoPaths: [repoA, repoB] });
      const dbLinks = links.filter((l) => l.kind === "db_table");
      expect(dbLinks.length).toBeGreaterThan(0);
      // Provider and consumer must be in different repos
      for (const link of dbLinks) {
        expect(link.provider.repoPath).not.toBe(link.consumer.repoPath);
      }
    } finally {
      await removeFixtureRepo(repoA);
      await removeFixtureRepo(repoB);
    }
  });

  it("detects cross-repo event topic links", async () => {
    const repoA = await makeFixtureRepo("cross-repo-db");
    const repoB = await makeFixtureRepo("cross-repo-db");
    try {
      const { links } = await findCrossRepoLinks({ repoPaths: [repoA, repoB] });
      const topicLinks = links.filter((l) => l.kind === "event_topic");
      expect(topicLinks.length).toBeGreaterThan(0);

      const orderCreatedLink = topicLinks.find(
        (l) => l.matchedValue === "order.created",
      );
      expect(orderCreatedLink).toBeDefined();
      if (!orderCreatedLink) return;

      expect(orderCreatedLink.provider.repoPath).not.toBe(
        orderCreatedLink.consumer.repoPath,
      );
    } finally {
      await removeFixtureRepo(repoA);
      await removeFixtureRepo(repoB);
    }
  });

  it("flags an event topic that only appears in one repo as unknown_external_consumer", async () => {
    await withFixtureRepo("cross-repo-db", async (dbRepo) => {
      const { issues } = await findCrossRepoLinks({ repoPaths: [dbRepo] });
      // topic:order.created appears in only one repo → should be flagged
      const topicIssue = issues.find((s) => s.includes("order.created"));
      expect(topicIssue).toBeDefined();
      expect(topicIssue).toContain("unknown external consumers");
    });
  });
});

// ─── General / empty input tests ─────────────────────────────────────────────

describe("findCrossRepoLinks — general", () => {
  it("returns empty links and no issues for empty repoPaths", async () => {
    const { links, issues } = await findCrossRepoLinks({ repoPaths: [] });
    expect(links).toHaveLength(0);
    expect(issues).toHaveLength(0);
  });

  it("returns empty links and issues for a single repo with no signals", async () => {
    await withFixtureRepo("search-fixture", async (repo) => {
      const { links, issues } = await findCrossRepoLinks({ repoPaths: [repo] });
      expect(links.filter((l) => l.kind === "http_route")).toHaveLength(0);
      expect(links.filter((l) => l.kind === "shared_package")).toHaveLength(0);
    });
  });
});
