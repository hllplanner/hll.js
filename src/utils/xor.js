/**
 * Applies an XOR cipher to a buffer using the provided key.
 * @param {Buffer} buffer - The input buffer.
 * @param {Buffer} xorKey - The XOR key.
 * @returns {Buffer} The transformed buffer.
 */
const xor = (buffer, xorKey) => {
  const resultBuffer = Buffer.alloc(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    resultBuffer[i] = buffer[i] ^ xorKey[i % xorKey.length];
  }

  return resultBuffer;
};

module.exports = xor;