// Untested methods: setDynamicWeather, setSequenceShuffle

const { RCONClient } = require("../../src");
require("dotenv").config({ quiet: true });

describe("MapManager", () => {
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

  describe("fetchMapRotation", () => {
    it("should fetch an array of MapRotationEntry objects.", async () => {
      const response = await client.maps.fetchMapRotation();

      expect(Array.isArray(response)).toBe(true);
      if (response.length > 0) {
        expect(response[0]).toHaveProperty("id");
      }
    });
  });

  describe("addMapToRotation", () => {
    it("should add a map at the given index.", async () => {
      const mapsBefore = await client.maps.fetchMapRotation();

      // Safely grab a map that is different from the current index 0
      const mapToAdd = mapsBefore[0]?.id === "carentan_warfare" ? "driel_warfare" : "carentan_warfare";

      await client.maps.addMapToRotation(mapToAdd, 0);

      const mapsAfter = await client.maps.fetchMapRotation();

      expect(mapsAfter[0].id).toBe(mapToAdd);
      expect(mapsAfter.length).toBe(mapsBefore.length + 1);
    });
  });

  describe("removeMapFromRotation", () => {
    it("should remove a map at a given index.", async () => {
      const mapsBefore = await client.maps.fetchMapRotation();

      // Ensure there is a map to remove
      if (mapsBefore.length === 0) {
        await client.maps.addMapToRotation("carentan_warfare", 0);
      }

      const mapsBeforeRemoval = await client.maps.fetchMapRotation();
      await client.maps.removeMapFromRotation(0);
      const mapsAfter = await client.maps.fetchMapRotation();

      expect(mapsAfter.length).toBe(mapsBeforeRemoval.length - 1);
    });
  });

  describe("fetchMapSequence", () => {
    it("should fetch an array of MapSequenceEntry objects.", async () => {
      const response = await client.maps.fetchMapSequence();

      expect(Array.isArray(response)).toBe(true);
      if (response.length > 0) {
        expect(response[0]).toHaveProperty("id");
      }
    });
  });

  describe("addMapToSequence", () => {
    it("should add a map at the given index.", async () => {
      const mapsBefore = await client.maps.fetchMapSequence();

      // The server sometimes prefixes paths in sequences, so we just check the base name
      const mapToAdd = mapsBefore[0]?.name === "carentan_warfare" ? "driel_warfare" : "carentan_warfare";

      await client.maps.addMapToSequence(mapToAdd, 0);

      const mapsAfter = await client.maps.fetchMapSequence();

      expect(mapsAfter[0].id.includes(mapToAdd)).toBe(true);
      expect(mapsAfter.length).toBe(mapsBefore.length + 1);
    });
  });

  describe("moveMapInSequence", () => {
    it("should move a map in the sequence.", async () => {
      let currentSequence = await client.maps.fetchMapSequence();

      // Ensure there are at least 2 maps to swap
      while (currentSequence.length < 2) {
        await client.maps.addMapToSequence("carentan_warfare", 0);
        currentSequence = await client.maps.fetchMapSequence();
      }

      const mapSequenceBefore = await client.maps.fetchMapSequence();

      await client.maps.moveMapInSequence(1, 0);

      const mapSequenceAfter = await client.maps.fetchMapSequence();

      expect(mapSequenceAfter[0].id).toBe(mapSequenceBefore[1].id);
    });
  });

  describe("removeMapFromSequence", () => {
    it("should remove a map at a given index.", async () => {
      let mapsBefore = await client.maps.fetchMapSequence();

      if (mapsBefore.length === 0) {
        await client.maps.addMapToSequence("carentan_warfare", 0);
        mapsBefore = await client.maps.fetchMapSequence();
      }

      await client.maps.removeMapFromSequence(0);

      const mapsAfter = await client.maps.fetchMapSequence();

      expect(mapsAfter.length).toBe(mapsBefore.length - 1);
    });
  });
});