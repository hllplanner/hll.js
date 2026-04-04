const { RCONClient } = require("../../../src");
require("dotenv").config();

describe("RCONClient", () => {
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
});