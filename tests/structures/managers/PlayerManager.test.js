// Not all methods can be tested as they require players in the server.
// Untested methods: kick, message, disbandPlatoon

const { RCONClient } = require("../../../src");
require("dotenv").config({ quiet: true });

describe("PlayerManager", () => {
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

  describe("fetch", () => {
    it("should throw an error when fetching a nonexistent player.", async () => {
      // No one take this username plz :)
      const response = client.players.fetch("823459082309582390-4589023485902345890328453h24ci5b23ci4hn53i2j4c5v394b5nh23vu4nh9-uxq53hn45u9-3wvhncu945hn3u9vrhw0v");
      await expect(response).rejects.toThrow();
    });
  });

  describe("fetchAllPlayers", () => {
    it("should retrieve an array of players from the server.", async () => {
      const players = await client.players.fetchAllPlayers();

      expect(Array.isArray(players)).toBe(true);
    });
  });

  const testPlayerId = `hlljs-${Math.floor(Math.random() * 100)}`;

  describe("listVIPPlayers", () => {
    it("should retrieve a list of VIP players.", async () => {
      const vipPlayers = await client.players.listVIPPlayers();

      expect(Array.isArray(vipPlayers)).toBe(true);
    });
  });

  describe("addVIP", () => {
    it("should add a player to the server VIP list", async () => {
      await client.players.addVIP(testPlayerId, "hlljs-int-test");
      const newPlayerList = await client.players.listVIPPlayers();
      expect(newPlayerList.some(player => player.id === testPlayerId)).toBe(true);
    });
  });

  describe("removeVIP", () => {
    it("should remove a player from the server VIP list.", async () => {
      await client.players.removeVIP(testPlayerId);
      const newPlayerList = await client.players.listVIPPlayers();
      expect(newPlayerList.some(player => player.id === testPlayerId)).toBe(false);
    });
  });

  describe("listPermaBans", () => {
    it("should retrieve a list of permanent bans.", async () => {
      const permaBans = await client.players.listPermaBans();

      expect(Array.isArray(permaBans)).toBe(true);
    });
  });

  describe("addPermaBan", () => {
    it("should permanently ban a player.", async () => {
      await client.players.permaBan("hlljs-int-test", "reason", "adminName");
      const newBanList = await client.players.listPermaBans();
      expect(newBanList.some(ban => ban.userId === "hlljs-int-test")).toBe(true);
    });
  });

  describe("removePermaBan", () => {
    it("should remove a permanent ban.", async () => {
      await client.players.removePermaBan("hlljs-int-test");
      const newBanList = await client.players.listPermaBans();
      expect(newBanList.some(ban => ban.userId === "hlljs-int-test")).toBe(false);
    });
  });

  describe("listTempBans", () => {
    it("should retrieve a list of temporary bans.", async () => {
      const tempBans = await client.players.listTempBans();

      expect(Array.isArray(tempBans)).toBe(true);
    });
  });

  describe("addTempBan", () => {
    it("should temporarily ban a player.", async () => {
      await client.players.tempBan("hlljs-int-test", 2, "reason", "adminName");
      const newBanList = await client.players.listTempBans();
      expect(newBanList.some(ban => ban.userId === "hlljs-int-test")).toBe(true);
    });
  });

  describe("removeTempBan", () => {
    it("should remove a temporary ban.", async () => {
      await client.players.removeTempBan("hlljs-int-test");
      const newBanList = await client.players.listTempBans();
      expect(newBanList.some(ban => ban.userId === "hlljs-int-test")).toBe(false);
    });
  });
});