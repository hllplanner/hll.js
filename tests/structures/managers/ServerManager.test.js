// Not all methods can be tested as they require active players or disrupt the server.
// Untested methods: setMap, setSectorLayout, setWelcomeMessage

const { RCONClient } = require("../../../src");
require("dotenv").config({ quiet: true });

describe("SessionManager", () => {
  let client;

  beforeAll(async () => {
    client = new RCONClient({
      host: process.env.RCON_HOST,
      port: process.env.RCON_PORT,
      password: process.env.RCON_PASSWORD
    });

    await client.init();
  });

  afterAll(() => {
    client.disconnect();
  });

  describe("fetchConfig", () => {
    it("should fetch the server config.", async () => {
      const response = await client.server.fetchConfig();

      expect(response).toHaveProperty("serverName");
      expect(response).toHaveProperty("buildNumber");
    });
  });

  describe("fetchChangelist", () => {
    it("should fetch the server changelist.", async () => {
      const response = await client.server.fetchChangelist();

      expect(typeof response).toBe("string");
    });
  });

  // TODO: This command is broken server-side. Dont skip this test case once its fixed.
  describe.skip("setMaxQueuedPlayers", () => {
    it("should set the max queue count.", async () => {
      const sessionBefore = await client.session.fetch();
      const countBefore = sessionBefore.maxQueueCount;

      const desiredCountAfter = (countBefore % 6) + 1;
      await client.server.setMaxQueuedPlayers(desiredCountAfter);

      const sessionAfter = await client.session.fetch();
      const actualCountAfter = sessionAfter.maxQueueCount;

      expect(actualCountAfter).toBe(desiredCountAfter);

      // Cleanup
      await client.server.setMaxQueuedPlayers(countBefore);
    });
  });

  describe("setVipSlotCount", () => {
    it("should set the max vip slot count.", async () => {
      const sessionBefore = await client.session.fetch();
      const countBefore = sessionBefore.maxVipQueueCount;

      const desiredCountAfter = (countBefore % 6) + 1;
      await client.server.setVipSlotCount(desiredCountAfter);

      const sessionAfter = await client.session.fetch();
      const actualCountAfter = sessionAfter.maxVipQueueCount;

      expect(actualCountAfter).toBe(desiredCountAfter);

      // Cleanup
      await client.server.setVipSlotCount(countBefore);
    });
  });
});