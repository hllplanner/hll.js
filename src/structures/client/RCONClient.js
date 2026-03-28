const RCONConnection = require("../network/RCONConnection");
const { EventEmitter } = require("node:events");

class RCONClient extends EventEmitter {
  rcon;

  host;
  port;
  password;

  constructor({ host, port, password }) {
    super();

    this.host = host;
    this.port = port;
    this.password = password;

    this.rcon = new RCONConnection({ client: this });
  }
}

module.exports = RCONClient;