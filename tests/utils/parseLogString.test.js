const parseLogString = require("../../src/utils/parseLogString");

describe("parseLogString", () => {
  describe("Error handling", () => {
    it("throws an error for invalid log headers", () => {
      const invalidString = "[invalid header] KILL";
      expect(() => parseLogString(invalidString)).toThrow("Invalid log header: [invalid header] KILL");
    });
  });

  describe("BAN logs", () => {
    it("parses permanent bans with custom reasons", () => {
      const log = "[59.9 sec (1747620899)] BAN: [Finbar] has been banned. [PERMANENTLY BANNED BY THE ADMINISTRATOR!\\n\\nreason1 reason2]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerBanned",
        banType: "permanent",
        timestamp: 1747620899,
        temporary: false,
        duration: null,
        bannedBy: "THE ADMINISTRATOR",
        playerName: "Finbar",
        fullReason: "PERMANENTLY BANNED BY THE ADMINISTRATOR!\\n\\nreason1 reason2",
        customReason: "reason1 reason2"
      });
    });

    it("parses permanent bans without custom reasons", () => {
      const log = "[59.9 sec (1747620899)] BAN: [Finbar] has been banned. [PERMANENTLY BANNED BY THE ADMINISTRATOR!]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerBanned",
        banType: "permanent",
        timestamp: 1747620899,
        temporary: false,
        duration: null,
        bannedBy: "THE ADMINISTRATOR",
        playerName: "Finbar",
        fullReason: "PERMANENTLY BANNED BY THE ADMINISTRATOR!",
        customReason: undefined
      });
    });

    it("parses temporary bans", () => {
      const log = "[15.1 sec (1747629047)] BAN: [Finbar] has been banned. [BANNED FOR 1 HOURS BY THE ADMINISTRATOR!]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerBanned",
        banType: "temporary",
        timestamp: 1747629047,
        temporary: true,
        duration: 1,
        bannedBy: "THE ADMINISTRATOR",
        playerName: "Finbar",
        fullReason: "BANNED FOR 1 HOURS BY THE ADMINISTRATOR!",
        customReason: undefined
      });
    });

    it("parses temporary bans with commas in the duration", () => {
      const log = "[6.14 sec (1747629271)] BAN: [Finbar] has been banned. [BANNED FOR 1,231 HOURS BY THE ADMINISTRATOR!]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerBanned",
        banType: "temporary",
        timestamp: 1747629271,
        temporary: true,
        duration: 1231,
        bannedBy: "THE ADMINISTRATOR",
        playerName: "Finbar",
        fullReason: "BANNED FOR 1,231 HOURS BY THE ADMINISTRATOR!",
        customReason: undefined
      });
    });

    it("parses temporary bans with commas in the duration and a custom reason", () => {
      const log = "[6.15 sec (1747629786)] BAN: [Finbar] has been banned. [BANNED FOR 1,231 HOURS BY THE ADMINISTRATOR!\\n\\ntest reason]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerBanned",
        banType: "temporary",
        timestamp: 1747629786,
        temporary: true,
        duration: 1231,
        bannedBy: "THE ADMINISTRATOR",
        playerName: "Finbar",
        fullReason: "BANNED FOR 1,231 HOURS BY THE ADMINISTRATOR!\\n\\ntest reason",
        customReason: "test reason"
      });
    });

    it("handles the min time format correctly", () => {
      const log = "[00:00 min (1234)] BAN: [PLAYER_1] has been banned. [BANNED FOR 1 HOURS BY THE ADMINISTRATOR!\\n\\ntest reason]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerBanned",
        banType: "temporary",
        timestamp: 1234,
        temporary: true,
        duration: 1,
        bannedBy: "THE ADMINISTRATOR",
        playerName: "PLAYER_1",
        fullReason: "BANNED FOR 1 HOURS BY THE ADMINISTRATOR!\\n\\ntest reason",
        customReason: "test reason"
      });
    });

    it("parses bans initiated by VOTE", () => {
      const log = "[40.4 sec (1748288561)] BAN: [PLAYER_1] has been banned. [BANNED FOR 1 HOURS BY VOTE!\\n\\nTHE REASON IS Abuse!]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerBanned",
        banType: "temporary",
        timestamp: 1748288561,
        temporary: true,
        duration: 1,
        bannedBy: "VOTE",
        playerName: "PLAYER_1",
        fullReason: "BANNED FOR 1 HOURS BY VOTE!\\n\\nTHE REASON IS Abuse!",
        customReason: "THE REASON IS Abuse!"
      });
    });
  });

  describe("CHAT[Team] logs", () => {
    it("parses team chat messages", () => {
      const log = "[5:34:10 hours (1747595318)] CHAT[Team][Finbar [abc](Axis/76561198847157834)]: !wik";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "teamChat",
        timestamp: 1747595318,
        playerName: "Finbar [abc]",
        playerId: "76561198847157834",
        playerFaction: "Axis",
        message: "!wik"
      });
    });

    it("parses team chat messages", () => {
      const log = "[5:34:10 hours (1747595318)] CHAT[Team][Finbar(Allies/76561198847157834)]: incoming armor";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "teamChat",
        timestamp: 1747595318,
        playerName: "Finbar",
        playerId: "76561198847157834",
        playerFaction: "Allies",
        message: "incoming armor"
      });
    });
  });

  describe("CHAT[Unit] logs", () => {
    it("parses unit chat messages with a clan tag", () => {
      const log = "[12:34:56 hours (1747595318)] CHAT[Unit][Finbar(Axis/76561198847157834)]: pushing the point";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "unitChat",
        timestamp: 1747595318,
        playerName: "Finbar",
        playerFaction: "Axis",
        playerId: "76561198847157834",
        message: "pushing the point"
      });
    });
  });

  describe("CONNECTED logs", () => {
    it("parses player connected messages", () => {
      const log = "[15.1 sec (1747629047)] CONNECTED Finbar (76561198847157834)";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerConnected",
        timestamp: 1747629047,
        playerId: "76561198847157834",
        playerName: "Finbar"
      });
    });

    it("parses player connected messages with spaces in the name", () => {
      const log = "[12:34:56 hours (1747595318)] CONNECTED PLAYER 1 (PLAYER_1_ID)";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerConnected",
        timestamp: 1747595318,
        playerId: "PLAYER_1_ID",
        playerName: "PLAYER 1"
      });
    });
  });

  describe("DISCONNECTED logs", () => {
    it("parses player disconnected messages", () => {
      const log = "[15.1 sec (1747629047)] DISCONNECTED Finbar (76561198847157834)";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerDisconnected",
        timestamp: 1747629047,
        playerId: "76561198847157834",
        playerName: "Finbar"
      });
    });

    it("parses player disconnected messages with spaces in the name", () => {
      const log = "[12:34:56 hours (1747595318)] DISCONNECTED PLAYER 1 (PLAYER_1_ID)";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerDisconnected",
        timestamp: 1747595318,
        playerId: "PLAYER_1_ID",
        playerName: "PLAYER 1"
      });
    });
  });

  describe("KICK logs", () => {
    it("parses system kicks for timeouts", () => {
      const log = "[4:17:10 hours (1747602133)] KICK: [Finbar] has been kicked. [Authentication timed out (1/2)]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerKicked",
        timestamp: 1747602133,
        playerName: "Finbar",
        reason: "Authentication timed out (1/2)"
      });
    });

    it("parses admin kicks without custom reasons", () => {
      const log = "[1.14 sec (1747631191)] KICK: [Finbar] has been kicked. [KICKED BY THE ADMINISTRATOR!]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerKicked",
        timestamp: 1747631191,
        playerName: "Finbar",
        reason: "KICKED BY THE ADMINISTRATOR!"
      });
    });

    it("parses admin kicks with custom reasons and newlines", () => {
      const log = "[1.14 sec (1747631266)] KICK: [Finbar] has been kicked. [KICKED BY THE ADMINISTRATOR!\\n\\ntest reason \\n blah blah]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerKicked",
        timestamp: 1747631266,
        playerName: "Finbar",
        reason: "KICKED BY THE ADMINISTRATOR!\\n\\ntest reason \\n blah blah"
      });
    });
  });

  describe("KILL logs", () => {
    it("parses an Axis player killing an Allies player", () => {
      const log = "[4:41:42 hours (1747595322)] KILL: Finbar(Axis/76561198847157834) -> PLAYER_1(Allies/PLAYER_1_ID) with KARABINER 98K";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerKilled",
        timestamp: 1747595322,
        killerName: "Finbar",
        killerFaction: "Axis",
        killerId: "76561198847157834",
        victimName: "PLAYER_1",
        victimFaction: "Allies",
        victimId: "PLAYER_1_ID",
        weapon: "KARABINER 98K"
      });
    });

    it("parses an Allies player killing an Axis player with a clan tag in the name", () => {
      const log = "[15.1 sec (1747629047)] KILL: [Tag] PLAYER_1(Allies/PLAYER_1_ID) -> Finbar(Axis/76561198847157834) with M1 GARAND";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerKilled",
        timestamp: 1747629047,
        killerName: "[Tag] PLAYER_1",
        killerFaction: "Allies",
        killerId: "PLAYER_1_ID",
        victimName: "Finbar",
        victimFaction: "Axis",
        victimId: "76561198847157834",
        weapon: "M1 GARAND"
      });
    });
  });

  describe("MATCH ENDED logs", () => {
    it("parses the final map score", () => {
      const log = "[19:51 min (1747609398)] MATCH ENDED `UTAH BEACH Warfare` ALLIED (3 - 2) AXIS";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "matchEnded",
        timestamp: 1747609398,
        mapName: "UTAH BEACH Warfare",
        alliesScore: 3,
        axisScore: 2
      });
    });
  });

  describe("MATCH START logs", () => {
    it("parses the map name on match start", () => {
      const log = "[3:44:45 hours (1747603999)] MATCH START UTAH BEACH Warfare";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "matchStart",
        timestamp: 1747603999,
        mapName: "UTAH BEACH Warfare"
      });
    });
  });

  describe("MESSAGE logs", () => {
    it("parses broadcast messages sent by a player", () => {
      // Note: Escaped newlines are evaluated in the string literal, so \\n becomes \n
      const log = "[5:50:15 hours (1747593356)] MESSAGE: player [Finbar(76561198847157834)], content [SEEDING IN PROGRESS\\n Stick with us!]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "message",
        timestamp: 1747593356,
        playerName: "Finbar",
        playerId: "76561198847157834",
        message: "SEEDING IN PROGRESS\\n Stick with us!"
      });
    });
  });

  describe("Player (Admin Camera) logs", () => {
    it("parses a player entering admin camera", () => {
      const log = "[3:03:02 hours (1747600657)] Player [Finbar (76561198847157834)] Entered Admin Camera";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerEnteredAdminCamera",
        timestamp: 1747600657,
        playerId: "76561198847157834",
        playerName: "Finbar"
      });
    });

    it("parses a player leaving admin camera", () => {
      const log = "[3:05:02 hours (1747600777)] Player [Finbar (76561198847157834)] Left Admin Camera";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerLeftAdminCamera",
        timestamp: 1747600777,
        playerId: "76561198847157834",
        playerName: "Finbar"
      });
    });
  });

  describe("TEAMSWITCH logs", () => {
    it("parses a switch from None to Allies", () => {
      const log = "[5:23:34 hours (1747595326)] TEAMSWITCH Finbar (None > Allies)";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerSwitchFaction",
        timestamp: 1747595326,
        playerName: "Finbar",
        oldFaction: "None",
        newFaction: "Allies"
      });
    });

    it("parses a switch from Axis to Allies", () => {
      const log = "[5:23:34 hours (1747595326)] TEAMSWITCH Finbar (Axis > Allies)";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerSwitchFaction",
        timestamp: 1747595326,
        playerName: "Finbar",
        oldFaction: "Axis",
        newFaction: "Allies"
      });
    });
  });

  describe("TEAM KILL logs", () => {
    it("parses a team kill event", () => {
      const log = "[3:36:49 hours (1747604097)] TEAM KILL: Finbar(Axis/76561198847157834) -> PLAYER_1(Axis/PLAYER_1_ID) with M43 STIELHANDGRANATE";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "playerTeamKilled",
        timestamp: 1747604097,
        killerName: "Finbar",
        killerFaction: "Axis",
        killerId: "76561198847157834",
        victimName: "PLAYER_1",
        victimFaction: "Axis",
        victimId: "PLAYER_1_ID",
        weapon: "M43 STIELHANDGRANATE"
      });
    });
  });

  describe("VOTESYS logs", () => {
    it("parses a vote started event", () => {
      const log = "[11:41 min (1747767652)] VOTESYS: Player [Finbar] Started a vote of type (PVR_Kick_Abuse) against [PLAYER_1]. VoteID: [1]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "voteStarted",
        timestamp: 1747767652,
        voteId: 1,
        voteType: "PVR_Kick_Abuse",
        executorName: "Finbar",
        targetName: "PLAYER_1"
      });
    });

    it("parses a vote cast event", () => {
      const log = "[11:39 min (1747767654)] VOTESYS: Player [PLAYER_1] voted [PV_Favour] for VoteID[1]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "voteCast",
        timestamp: 1747767654,
        voteId: 1,
        playerName: "PLAYER_1",
        action: "PV_Favour"
      });
    });

    it("parses a vote passed event", () => {
      const log = "[11:34 min (1747767659)] VOTESYS: Vote Kick {Finbar} successfully passed. [For: 2/1 - Against: 0]";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "votePassed",
        timestamp: 1747767659,
        playerName: "Finbar",
        forVotes: 2,
        requiredVotes: 1,
        againstVotes: 0
      });
    });

    it("parses a vote expired before completion event", () => {
      const log = "[7:36 min (1747767896)] VOTESYS: Vote [2] expired before completion.";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "voteExpiredBeforeCompletion",
        timestamp: 1747767896,
        voteId: 2
      });
    });

    it("parses a prematurely expired vote event", () => {
      const log = "[2:14 min (1676418937)] VOTESYS: Vote [3] prematurely expired.";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "votePrematurelyExpired",
        timestamp: 1676418937,
        voteId: 3
      });
    });

    it("parses a completed vote event", () => {
      const log = "[7:31 min (1747767901)] VOTESYS: Vote [2] completed. Result: PVR_ExpiredOrCancelled";
      const result = parseLogString(log);

      expect(result).toEqual({
        type: "voteCompleted",
        timestamp: 1747767901,
        voteId: 2,
        result: "PVR_ExpiredOrCancelled"
      });
    });
  });
});