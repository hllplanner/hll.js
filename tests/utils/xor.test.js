const xor = require("../../src/utils/xor");

describe("Crypto Utils: xor()", () => {
  it("should symmetrically encrypt and decrypt data", () => {
    const originalData = Buffer.from("Hell Let Loose Admin Protocol", "utf-8");
    const key = Buffer.from("super_secret_key", "utf-8");

    // Encrypt the data
    const encrypted = xor(originalData, key);

    // Ensure the encrypted buffer is fundamentally different from the original
    expect(encrypted.equals(originalData)).toBe(false);

    // Decrypt the data (XORing it again with the same key reverses the cipher)
    const decrypted = xor(encrypted, key);

    // Ensure the decrypted string perfectly matches the original input
    expect(decrypted.equals(originalData)).toBe(true);
    expect(decrypted.toString("utf-8")).toBe("Hell Let Loose Admin Protocol");
  });

  it("should correctly wrap the key if the data is longer than the key", () => {
    // 5 bytes of data, but only 2 bytes of key
    const data = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
    const key = Buffer.from([0xFF, 0xAA]);

    const result = xor(data, key);

    // The modulo operator should cause the key to wrap:
    // data[0] ^ key[0] -> 0x01 ^ 0xFF = 0xFE
    // data[1] ^ key[1] -> 0x02 ^ 0xAA = 0xA8
    // data[2] ^ key[0] -> 0x03 ^ 0xFF = 0xFC
    // data[3] ^ key[1] -> 0x04 ^ 0xAA = 0xAE
    // data[4] ^ key[0] -> 0x05 ^ 0xFF = 0xFA
    expect(result).toEqual(Buffer.from([0xFE, 0xA8, 0xFC, 0xAE, 0xFA]));
  });

  it("should correctly handle a key that is longer than the data", () => {
    const data = Buffer.from([0x01, 0x02]);
    const key = Buffer.from([0xFF, 0xAA, 0xBB, 0xCC]);

    const result = xor(data, key);

    // It should only use the first two bytes of the key
    // data[0] ^ key[0] -> 0x01 ^ 0xFF = 0xFE
    // data[1] ^ key[1] -> 0x02 ^ 0xAA = 0xA8
    expect(result).toEqual(Buffer.from([0xFE, 0xA8]));
  });

  it("should return an empty buffer when provided an empty input buffer", () => {
    const data = Buffer.alloc(0);
    const key = Buffer.from("secret");

    const result = xor(data, key);

    expect(result.length).toBe(0);
  });

  it("should return the exact same buffer when XORed with a null byte (0x00)", () => {
    const data = Buffer.from([0x10, 0x20, 0x30]);
    const key = Buffer.from([0x00]);

    const result = xor(data, key);

    expect(result).toEqual(data);
  });
});