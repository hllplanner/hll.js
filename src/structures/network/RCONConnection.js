const net = require("node:net");
const { EventEmitter } = require("node:events");
const ResponseMessage = require("./ResponseMessage");
const RequestMessage = require("./RequestMessage");

let totalRx = 0;

/**
 * Represents a single RCON server connection.
 * @extends EventEmitter
 */
class RCONConnection extends EventEmitter {
  socket = new net.Socket();

  xorKey = null;
  authToken = null;

  // Auto-increment for every sent message to assign a unique ID for each request.
  transmitMessageIndex = 0;

  // Continuous buffer to hold incoming TCP data until full messages are formed
  receiveBuffer = Buffer.alloc(0);

  // Key-value of active messages waiting for response
  requestCache = {};

  host;
  port;
  password;

  constructor({ client }) {
    super();

    this.client = client;

    // Define authentication parameters
    this.host = client.host;
    this.port = client.port;
    this.password = client.password;

    // Handle socket closure
    this.socket.on("close", (error) => {
      this.client.emit("socketClosed", error);

      if (error) {
        throw new Error("Socket closed due to transmission error.");
      } else {
        throw new Error("Socket closed.");
      }
    });

    // Socket is ready for communication
    this.socket.on("ready", async () => {
      this.client.emit("socketReady");

      // Send ServerConnect command to initialize V2 connection
      const serverConnectRequest = new RequestMessage(this, {
        name: "ServerConnect"
      });

      const serverConnectResponse = await this.send(serverConnectRequest, { encrypt: false });

      // Ensure the ServerConnect was successful
      const { statusCode, statusMessage } = serverConnectResponse;
      if (statusCode !== 200) {
        throw new Error(`Error running ServerConnect: ${statusMessage}`);
      }
    });

    // Bind data listener to private #handlePacket method
    this.socket.on("data", this.#handlePacket.bind(this));

    // Connect to socket
    this.socket.connect(this.port, this.host);
  }

  /**
   * Send a RequestMessage
   *
   * @param {RequestMessage} message
   * @param {Object} options
   * @returns {Promise<ResponseMessage>}
   */
  async send(message, options = { encrypt: true }) {
    const messageBuffer = options.encrypt ? message.toBuffer() : message.toUnencryptedBuffer();

    this.socket.write(messageBuffer);

    return new Promise((resolve) => {
      this.requestCache[this.transmitMessageIndex] = {
        resolve,
        requestMessage: message,
        encrypted: options.encrypt
      };
    });
  }

  /**
   * Appends incoming data to the receive buffer and triggers processing
   *
   * @param {Buffer} data
   * @returns {void}
   */
  #handlePacket(data) {
    totalRx += data.length;

    // Append the new data to the continuous receive buffer
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);

    // Attempt to process messages from the buffer
    this.#processBuffer();
  }

  /**
   * Processes the buffer, extracting messages as soon as their full content length is received
   */
  #processBuffer() {
    // Loop to handle cases where multiple messages arrive in a single packet
    // The header is 12 bytes long. We need at least 12 bytes to read the content length.
    while (this.receiveBuffer.length >= 12) {

      const id = this.receiveBuffer.readUInt32LE(4);
      const contentLength = this.receiveBuffer.readUInt32LE(8);
      const totalMessageLength = 12 + contentLength;

      // Check if the buffer contains the entire message
      // If not, break the loop and wait for the next packet
      if (this.receiveBuffer.length < totalMessageLength) {
        break;
      }

      // Extract the exact bytes for this single message
      const rawBuffer = this.receiveBuffer.subarray(0, totalMessageLength);

      // Advance the receive buffer to remove the processed message
      this.receiveBuffer = this.receiveBuffer.subarray(totalMessageLength);

      // Get cached request
      const cachedRequest = this.requestCache[id];

      // Generate ResponseMessage
      const responseMessage = new ResponseMessage(rawBuffer, cachedRequest);

      // Call internal message handler
      this.#handleMessageInternal(responseMessage);

      // Resolve cached request and cleanup
      if (cachedRequest) {
        cachedRequest.resolve(responseMessage);
        delete this.requestCache[id];
      }
    }
  }

  /**
   * Internal message parser, for receiving ServerConnect and other internal library functions
   *
   * @param {ResponseMessage} responseMessage
   */
  async #handleMessageInternal(responseMessage) {
    switch (responseMessage.name) {

      // Store XOR key and attempt to authenticate with the server
      case "ServerConnect": {
        const xorKeyB64 = responseMessage.contentBody;
        this.xorKey = Buffer.from(xorKeyB64, "base64");

        const loginRequest = new RequestMessage(this, {
          name: "Login",
          contentBody: this.password
        });

        await this.send(loginRequest);

        break;
      }

      // Store auth token after successful login
      case "Login": {
        const { statusCode, contentBody } = responseMessage;

        // Validate successful authentication
        if (statusCode !== 200) {
          throw new Error("Error authenticating: Invalid RCON password.");
        }

        this.authToken = contentBody;

        this.client.emit("ready");

        break;
      }
    }
  }
}

module.exports = RCONConnection;