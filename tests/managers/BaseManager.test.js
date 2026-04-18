const BaseManager = require("../../src/managers/BaseManager");
const ResponseMessage = require("../../src/network/ResponseMessage");

describe("BaseManager", () => {
  let manager;

  beforeEach(() => {
    manager = new BaseManager();
  });

  // Helper to generate a realistic ResponseMessage instance from a plain object payload
  const createMockResponse = (payload) => {
    const payloadString = JSON.stringify(payload);
    const payloadBuffer = Buffer.from(payloadString, "utf-8");

    const headerBuffer = Buffer.alloc(12);
    // Write dummy ID
    headerBuffer.writeUInt32LE(1, 4);
    // Write actual content length
    headerBuffer.writeUInt32LE(payloadBuffer.length, 8);

    const rawBuffer = Buffer.concat([headerBuffer, payloadBuffer]);

    // Pass encrypted: false so the ResponseMessage constructor skips the XOR cipher
    return new ResponseMessage(rawBuffer, { encrypted: false });
  };

  describe("_validateResponse", () => {
    it("returns contentBody when statusCode is 200", () => {
      const response = createMockResponse({
        statusCode: 200,
        contentBody: { success: true }
      });

      expect(manager._validateResponse(response)).toEqual({ success: true });
    });

    it("throws a custom error if the statusCode is mapped in additionalErrors", () => {
      const response = createMockResponse({
        statusCode: 404,
        statusMessage: "Not Found"
      });
      const customErrors = { 404: "Player not found in the database." };

      expect(() => manager._validateResponse(response, customErrors)).toThrow(
        "Player not found in the database."
      );
    });

    it("throws a standard RCON error if the statusCode is not 200 and not mapped", () => {
      const response = createMockResponse({
        statusCode: 500,
        statusMessage: "Internal Server Error"
      });

      expect(() => manager._validateResponse(response)).toThrow(
        "RCON Error (500): Internal Server Error"
      );
    });
  });

  describe("_validateParameter", () => {
    it("passes with valid default conditions", () => {
      expect(() => manager._validateParameter("Valid String", "testParam")).not.toThrow();
    });

    it("throws if a required parameter is undefined or null", () => {
      expect(() => manager._validateParameter(undefined, "testParam")).toThrow(
        "Validation Error: 'testParam' is required but was undefined or null."
      );

      expect(() => manager._validateParameter(null, "testParam")).toThrow(
        "Validation Error: 'testParam' is required but was undefined or null."
      );
    });

    it("throws if the parameter is not a string when nonEmptyString is true", () => {
      expect(() => manager._validateParameter(123, "testParam")).toThrow(
        "Validation Error: 'testParam' must be a string. Received type: number."
      );
    });

    it("throws if the string is empty or just whitespace when nonEmptyString is true", () => {
      expect(() => manager._validateParameter("   ", "testParam")).toThrow(
        "Validation Error: 'testParam' cannot be an empty string."
      );
    });

    it("validates positive integers correctly", () => {
      const conditions = { defined: true, nonEmptyString: false, positiveInteger: true };

      expect(() => manager._validateParameter(5, "testParam", conditions)).not.toThrow();

      expect(() => manager._validateParameter(0, "testParam", conditions)).toThrow(
        "Validation Error: 'testParam' must be a positive integer."
      );

      expect(() => manager._validateParameter(-10, "testParam", conditions)).toThrow(
        "Validation Error: 'testParam' must be a positive integer."
      );

      expect(() => manager._validateParameter(5.5, "testParam", conditions)).toThrow(
        "Validation Error: 'testParam' must be a positive integer."
      );
    });

    it("validates standard integers correctly", () => {
      const conditions = { defined: true, nonEmptyString: false, integer: true };

      expect(() => manager._validateParameter(0, "testParam", conditions)).not.toThrow();
      expect(() => manager._validateParameter(-5, "testParam", conditions)).not.toThrow();

      expect(() => manager._validateParameter(3.14, "testParam", conditions)).toThrow(
        "Validation Error: 'testParam' must be an integer."
      );
    });

    it("validates booleans correctly", () => {
      const conditions = { defined: true, nonEmptyString: false, boolean: true };

      expect(() => manager._validateParameter(true, "testParam", conditions)).not.toThrow();
      expect(() => manager._validateParameter(false, "testParam", conditions)).not.toThrow();

      expect(() => manager._validateParameter("true", "testParam", conditions)).toThrow(
        "Validation Error: 'testParam' must be a boolean. Received type: string"
      );
    });
  });
});