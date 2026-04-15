// Not all methods can be tested as they require active players or disrupt the server.
// Untested methods: setMap, setSectorLayout

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
});