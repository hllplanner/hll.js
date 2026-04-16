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

  describe("fetchIdleKickDuration", () => {
    it("should fetch the idle kick duration.", async () => {
      const idleKickDuration = await client.server.fetchIdleKickDuration();

      expect(typeof idleKickDuration).toBe("number");
    });
  });

  describe("setIdleKickDuration", () => {
    it("should set the idle kick duration.", async () => {
      const idleKickDurationBefore = await client.server.fetchIdleKickDuration();

      const desiredNewDuration = idleKickDurationBefore + 1;
      await client.server.setIdleKickDuration(desiredNewDuration);

      const idleKickDurationAfter = await client.server.fetchIdleKickDuration();

      expect(idleKickDurationAfter).toBe(desiredNewDuration);

      // Cleanup
      await client.server.setIdleKickDuration(idleKickDurationBefore);
    });
  });

  describe("fetchHighPingThreshold", () => {
    it("should fetch the high ping threshold.", async () => {
      const threshold = await client.server.fetchHighPingThreshold();

      expect(typeof threshold).toBe("number");
    });
  });

  describe("setHighPingThreshold", () => {
    it("should set the high ping threshold.", async () => {
      const thresholdBefore = await client.server.fetchHighPingThreshold();

      const desiredNewThreshold = thresholdBefore + 1;
      await client.server.setHighPingThreshold(desiredNewThreshold);

      const thresholdAfter = await client.server.fetchHighPingThreshold();

      expect(thresholdAfter).toBe(desiredNewThreshold);

      // Cleanup
      await client.server.setHighPingThreshold(thresholdBefore);
    });
  });

  describe("fetchTeamSwitchCooldown", () => {
    it("should fetch the team switch cooldown.", async () => {
      const cooldown = await client.server.fetchTeamSwitchCooldown();

      expect(typeof cooldown).toBe("number");
    });
  });

  describe("setTeamSwitchCooldown", () => {
    it("should set the team switch cooldown.", async () => {
      const cooldownBefore = await client.server.fetchTeamSwitchCooldown();

      const desiredNewCooldown = cooldownBefore + 1;
      await client.server.setTeamSwitchCooldown(desiredNewCooldown);

      const cooldownAfter = await client.server.fetchTeamSwitchCooldown();

      expect(cooldownAfter).toBe(desiredNewCooldown);

      // Cleanup
      await client.server.setTeamSwitchCooldown(cooldownBefore);
    });
  });

  describe("fetchAutoBalanceEnabled", () => {
    it("should fetch the auto balance status.", async () => {
      const enabled = await client.server.fetchAutoBalanceEnabled();

      expect(typeof enabled).toBe("boolean");
    });
  });

  describe("setAutoBalanceEnabled", () => {
    it("should update the auto balance enabled state.", async () => {
      const stateBefore = await client.server.fetchAutoBalanceEnabled();

      const desiredNewState = !stateBefore;
      await client.server.setAutoBalanceEnabled(desiredNewState);

      const stateAfter = await client.server.fetchAutoBalanceEnabled();

      expect(desiredNewState).toBe(stateAfter);

      // Cleanup
      await client.server.setAutoBalanceEnabled(stateBefore);
    });
  });
});