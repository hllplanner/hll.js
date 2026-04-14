// Not all methods can be tested as they require players in the server.
// setMap and setSectorLayout could be tested but may disrupt other testing.
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

  describe("fetch", () => {
    it("should fetch a Session object.", async () => {
      const response = await client.session.fetch();

      expect(response).toHaveProperty("serverName");
    });
  });

  describe("fetchMapRotation", () => {
    it("should fetch an array of MapRotationEntry.", async () => {
      const response = await client.session.fetchMapRotation();

      expect(Array.isArray(response)).toBe(true);
      expect(response[0]).toHaveProperty("id");
    });
  });

  describe("addMapRotation", () => {
    it("should add a map at a given index.", async () => {
      const mapsBefore = await client.session.fetchMapRotation();

      const mapToAdd = mapsBefore[0] === "carentan_warfare" ? "driel_warfare" : "carentan_warfare";
      await client.session.addMapToRotation(mapToAdd, 0);

      const mapsAfter = await client.session.fetchMapRotation();

      expect(mapsAfter[0].id).toBe(mapToAdd);
    });
  });

  describe("removeMapFromRotation", () => {
    it("removes a map at a given index.", async () => {
      const mapsBefore = await client.session.fetchMapRotation();

      await client.session.removeMapFromRotation(0);

      const mapsAfter = await client.session.fetchMapRotation();

      expect(mapsBefore[0] !== mapsAfter[0]).toBe(true);
    });
  });
});