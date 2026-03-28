const xor = (buffer, xorKey) => {
  const resultBuffer = Buffer.alloc(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    resultBuffer[i] = buffer[i] ^ xorKey[i % xorKey.length];
  }

  return resultBuffer;
}

/**
 * Represents a message sent from the server
 */
class ResponseMessage {
  id;
  contentLength;

  raw;

  statusCode;
  statusMessage;
  version;
  name;
  contentBody;

  /**
   * @param {Buffer} raw
   * @param {Object<{ resolve: function, message: RequestMessage, encrypted: boolean }>} cachedRequest
   */
  constructor(raw, cachedRequest) {
    this.raw = raw;

    const header = raw.subarray(0, 12);
    const contentBuffer = cachedRequest.encrypted ? xor(raw.subarray(12), cachedRequest.requestMessage.RCONConnection.xorKey) : raw.subarray(12);

    this.id = header.readUInt32LE(4);
    this.contentLength = header.readUInt32LE(8);

    const bufferString = contentBuffer.toString("utf-8");
    const content = JSON.parse(bufferString);

    const { statusCode, statusMessage, version, name, contentBody } = content;

    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.version = version;
    this.name = name;
    this.contentBody = contentBody;
  }
}

module.exports = ResponseMessage;