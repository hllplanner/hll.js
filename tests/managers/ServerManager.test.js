// Not all methods can be tested as they require active players, may disrupt the server, or have no method of verification.
// Untested methods: setMap, setSectorLayout, setWelcomeMessage, setMatchTimer, removeMatchTimer, setWarmupTimer, removeWarmupTimer

const { RCONClient } = require("../../src");
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

  describe("fetchAutoBalanceThreshold", () => {
    it("should fetch the auto balance threshold.", async () => {
      const threshold = await client.server.fetchAutoBalanceThreshold();

      expect(typeof threshold).toBe("number");
    });
  });

  describe("setAutoBalanceThreshold", () => {
    it("should set the auto balance threshold.", async () => {
      const thresholdBefore = await client.server.fetchAutoBalanceThreshold();

      const desiredNewThreshold = thresholdBefore + 1;
      await client.server.setAutoBalanceThreshold(desiredNewThreshold);

      const thresholdAfter = await client.server.fetchAutoBalanceThreshold();

      expect(thresholdAfter).toBe(desiredNewThreshold);

      // Cleanup
      await client.server.setAutoBalanceThreshold(thresholdBefore);
    });
  });

  describe("fetchVoteKickEnabled", () => {
    it("should fetch the vote kick status.", async () => {
      const enabled = await client.server.fetchVoteKickEnabled();

      expect(typeof enabled).toBe("boolean");
    });
  });

  describe("setVoteKickEnabled", () => {
    it("should update the vote kick enabled state.", async () => {
      const stateBefore = await client.server.fetchVoteKickEnabled();

      const desiredNewState = !stateBefore;
      await client.server.setVoteKickEnabled(desiredNewState);

      const stateAfter = await client.server.fetchVoteKickEnabled();

      expect(desiredNewState).toBe(stateAfter);

      // Cleanup
      await client.server.setVoteKickEnabled(stateBefore);
    });
  });

  describe("fetchVoteKickThresholds", () => {
    it("should fetch vote kick thresholds.", async () => {
      const thresholds = await client.server.fetchVoteKickThresholds();

      expect(Array.isArray(thresholds)).toBe(true);
    });
  });

  describe("setVoteKickThresholds", () => {
    it("should set new vote kick thresholds.", async () => {
      const votesForFive = Math.floor(Math.random() * 4) + 1;
      const votesForTen = Math.floor(Math.random() * 9) + 1;
      const votesForZero = Math.floor(Math.random() * 5) + 1;

      const newThresholds = [
        { playerCount: 0, voteThreshold: votesForZero },
        { playerCount: 5, voteThreshold: votesForFive },
        { playerCount: 10, voteThreshold: votesForTen }
      ];

      await client.server.setVoteKickThresholds(newThresholds);

      const thresholds = await client.server.fetchVoteKickThresholds();

      expect(Array.isArray(thresholds)).toBe(true);
      expect(thresholds).toHaveLength(3);
      expect(thresholds).toEqual(newThresholds);
    });

    it("should throw an error if the 0-player threshold is missing.", async () => {
      const invalidThresholds = [
        { playerCount: 5, voteThreshold: 3 },
        { playerCount: 10, voteThreshold: 5 }
      ];

      await expect(client.server.setVoteKickThresholds(invalidThresholds))
        .rejects
        .toThrow("Validation Error: Must have a threshold for 0 players.");
    });

    it("should throw an error if votes needed are greater than or equal to the player count.", async () => {
      const invalidThresholds = [
        { playerCount: 0, voteThreshold: 1 },
        { playerCount: 5, voteThreshold: 3 },
        { playerCount: 10, voteThreshold: 12 }
      ];

      await expect(client.server.setVoteKickThresholds(invalidThresholds))
        .rejects
        .toThrow("Validation Error: Votes needed (12) must be less than player count (10).");
    });
  });

  describe("resetVoteKickThresholds", () => {
    it("should reset all vote kick thresholds.", async () => {
      const thresholdsBefore = await client.server.fetchVoteKickThresholds();

      await client.server.resetVoteKickThresholds();
      const thresholdsAfter = await client.server.fetchVoteKickThresholds();

      expect(thresholdsAfter).toEqual([]);

      // Cleanup
      await client.server.setVoteKickThresholds(thresholdsBefore);
    });
  });

  describe("Banned Words Management", () => {
    const testWords = ["hlljs_test_word_1", "hlljs_test_word_2"];

    afterAll(async () => {
      // Ensure test words are removed
      try {
        await client.server.removeBannedWords(testWords);
      } catch (error) {
      }
    });

    describe("fetchBannedWordsList", () => {
      it("should return an array of banned words.", async () => {
        const bannedWords = await client.server.fetchBannedWordsList();

        expect(Array.isArray(bannedWords)).toBe(true);
      });
    });

    describe("addBannedWords", () => {
      it("should add new words to the banned words list.", async () => {
        await client.server.addBannedWords(testWords);

        const bannedWordsAfter = await client.server.fetchBannedWordsList();

        expect(bannedWordsAfter).toEqual(expect.arrayContaining(testWords));
      });

      it("should throw a validation error if a word is invalid.", async () => {
        const invalidWords = ["valid_word", 123];

        await expect(client.server.addBannedWords(invalidWords))
          .rejects
          .toThrow();
      });
    });

    describe("removeBannedWords", () => {
      it("should remove words from the banned words list.", async () => {
        // Ensure the words exist before attempting removal
        await client.server.addBannedWords(testWords);

        await client.server.removeBannedWords(testWords);

        const bannedWordsAfter = await client.server.fetchBannedWordsList();

        for (const word of testWords) {
          expect(bannedWordsAfter).not.toContain(word);
        }
      });
    });
  });
});