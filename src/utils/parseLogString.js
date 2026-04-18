/**
 * Parses the log strings returned from ShowAdminLog into objects.
 *
 * @param {string} string
 * @returns {Object}
 */
const parseLogString = (string) => {

  // Escape any unescaped line ending characters
  const escapeRegex = /\n(?!\[.+? \(\d+\)\])/g;
  string = string.replace(escapeRegex, "\\n");

  // Parses the header into its segments.
  // Example log header: [31:53 min (1747596221)] KILL
  // 31:53      -> \1
  // min        -> \2
  // 1747596221 -> \3
  // KILL       -> \4
  const headerRegExp = /^\[(\d*|\d*\.\d*|\d*:\d*|\d*:\d*:\d*) (ms|sec|min|hours) \((\d*)\)\] (CONNECTED|DISCONNECTED|KILL|TEAM KILL|MATCH START|MATCH ENDED|TEAMSWITCH|MESSAGE|BAN|KICK|Player|CHAT\[Team\]|CHAT\[Unit\]|VOTESYS)/;

  if (!headerRegExp.test(string))
    throw new Error(`Invalid log header: ${string}`);

  let header, relativeTime, relativeTimeFormat, timestamp, logType;
  try {
    header = headerRegExp.exec(string);
    [relativeTime, relativeTimeFormat, timestamp, logType] = header.slice(1, 5);
  } catch {
    console.error(`Error parsing log: ${string}`);
    return {
      type: "parseError",
      string
    };
  }

  timestamp = Number(timestamp);

  switch (logType) {
    case "BAN": {
      const banRegex = /BAN: \[(.*?)\] has been banned\. \[((PERMANENTLY BANNED|BANNED FOR ([,0-9]*?) HOURS) BY (VOTE|THE ADMINISTRATOR)!(?:\\n\\n(.*?))?)\]/;

      let [playerName, fullReason, banType, duration, bannedBy, customReason] = banRegex.exec(string).slice(1);

      duration = duration ? Number(duration.replaceAll(/,/g, "")) : null;

      banType = banType === "PERMANENTLY BANNED" ? "permanent" : "temporary";

      return {
        type: "playerBanned",
        banType,
        timestamp,
        temporary: !!duration,
        duration,
        bannedBy,
        playerName,
        fullReason,
        customReason
      };

      break;
    }

    case "CHAT[Team]": {
      const teamChatRegex = /CHAT\[Team\]\[(.*?)\((Axis|Allies)\/(.*?)\)\]: (.*)/;
      const [playerName, playerFaction, playerId, msg] = teamChatRegex.exec(string).slice(1);

      return {
        type: "teamChat",
        timestamp,
        playerName,
        playerId,
        playerFaction,
        message: msg
      };

      break;
    }

    case "CHAT[Unit]": {
      const unitChatRegExp = /CHAT\[Unit\]\[(.*?)\((Axis|Allies)\/(.*?)\)\]: (.*)/;
      const [playerName, playerFaction, playerId, msg] = unitChatRegExp.exec(string).slice(1);

      return {
        type: "unitChat",
        timestamp,
        playerName,
        playerFaction,
        playerId,
        message: msg
      };

      break;
    }

    case "CONNECTED": {
      const playerConnectedRegExp = /CONNECTED (.*?) \((.*?)\)/;
      const [playerName, playerId] = playerConnectedRegExp.exec(string).slice(1);

      return {
        type: "playerConnected",
        timestamp,
        playerId,
        playerName
      };

      break;
    }

    case "DISCONNECTED": {
      const playerDisconnectedRegExp = /DISCONNECTED (.*?) \((.*?)\)/;
      const [playerName, playerId] = playerDisconnectedRegExp.exec(string).slice(1);

      return {
        type: "playerDisconnected",
        timestamp,
        playerId,
        playerName
      };

      break;
    }

    case "KICK": {
      const kickRegExp = /KICK: \[(.*?)\] has been kicked\. \[(.*?)\]/;
      const [playerName, reason] = kickRegExp.exec(string).slice(1);

      return {
        type: "playerKicked",
        timestamp,
        playerName,
        reason
      };

      break;
    }

    case "KILL": {
      const playerKillRegExp = /KILL: (.*?)\((Axis|Allies)\/(.*?)\) -> (.*?)\((Axis|Allies)\/(.*?)\) with (.*)/;
      const [killerName, killerFaction, killerId, victimName, victimFaction, victimId, weapon] = playerKillRegExp.exec(string).slice(1);

      return {
        type: "playerKilled",
        timestamp,
        killerName,
        killerFaction,
        killerId,
        victimName,
        victimFaction,
        victimId,
        weapon
      };

      break;
    }

    case "MATCH ENDED": {
      const matchEndedRegExp = /`(.*?)` ALLIED \((\d) - (\d)\) AXIS/;
      const [mapName, alliesScore, axisScore] = matchEndedRegExp.exec(string).slice(1);

      return {
        type: "matchEnded",
        timestamp,
        mapName,
        alliesScore: Number(alliesScore),
        axisScore: Number(axisScore)
      };

      break;
    }

    case "MATCH START": {
      const matchStartRegExp = /MATCH START (.*)/;
      const mapName = matchStartRegExp.exec(string)[1];

      return {
        type: "matchStart",
        timestamp,
        mapName
      };

      break;
    }

    case "MESSAGE": {
      const messageRegExp = /MESSAGE: player \[(.*?)\((.*?)\)\], content \[(.*)\]/;
      const [playerName, playerId, msg] = messageRegExp.exec(string).slice(1);

      return {
        type: "message",
        timestamp,
        playerName,
        playerId,
        message: msg
      };

      break;
    }

    // Admin camera
    case "Player": {
      const adminCameraRegExp = /Player \[(.*?) \((.*?)\)\] (Entered Admin Camera|Left Admin Camera)/;
      const [playerName, playerId, msg] = adminCameraRegExp.exec(string).slice(1);

      const action = msg === "Entered Admin Camera";

      return {
        type: action ? "playerEnteredAdminCamera" : "playerLeftAdminCamera",
        timestamp,
        playerId,
        playerName
      };

      break;
    }

    case "TEAMSWITCH": {
      const teamSwitchRegExp = /TEAMSWITCH (.*?) \((None|Allies|Axis) > (None|Allies|Axis)\)/;
      const [playerName, oldFaction, newFaction] = teamSwitchRegExp.exec(string).slice(1);

      return {
        type: "playerSwitchFaction",
        timestamp,
        playerName,
        oldFaction,
        newFaction
      };

      break;
    }

    case "TEAM KILL": {
      const teamKillRegExp = /TEAM KILL: (.*?)\((Axis|Allies)\/(.*?)\) -> (.*?)\((Axis|Allies)\/(.*?)\) with (.*)/;
      const [killerName, killerFaction, killerId, victimName, victimFaction, victimId, weapon] = teamKillRegExp.exec(string).slice(1);

      return {
        type: "playerTeamKilled",
        timestamp,
        killerName,
        killerFaction,
        killerId,
        victimName,
        victimFaction,
        victimId,
        weapon
      };

      break;
    }

    case "VOTESYS": {
      const voteStartedRegExp = /Player \[(.*?)\] Started a vote of type \((PVR_Kick_Abuse|PVR_Kick_Cheating)\) against \[(.*?)\]. VoteID: \[(\d*?)\]/;
      const voteCastRegExp = /VOTESYS: Player \[(.*?)\] voted \[(PV_Favour|PV_Ignored|PV_Against)\] for VoteID\[(\d*?)\]/;
      const voteExpiredRegExp = /VOTESYS: Vote \[(\d*?)\] expired before completion./;
      const prematurelyExpiredRegExp = /VOTESYS: Vote \[(\d*?)\] prematurely expired./;
      const voteCompletedRegExp = /VOTESYS: Vote \[(\d*?)\] completed. Result: (PVR_Passed|PVR_ExpiredOrCancelled)/;
      const votePassedRegExp = /VOTESYS: Vote Kick \{(.*?)\} successfully passed. \[For: (\d.*?)\/(\d.*?) - Against: (\d.*?)\]/;

      if (voteStartedRegExp.test(string)) {
        const res = voteStartedRegExp.exec(string);
        const [executorName, type, targetName, voteId] = res.slice(1, 5);

        return {
          type: "voteStarted",
          timestamp,
          voteId: Number(voteId),
          voteType: type,
          executorName,
          targetName
        };
      }

      if (voteCastRegExp.test(string)) {
        const res = voteCastRegExp.exec(string);
        const [playerName, action, voteId] = res.slice(1, 4);

        return {
          type: "voteCast",
          timestamp,
          voteId: Number(voteId),
          playerName,
          action
        };
      }

      if (voteExpiredRegExp.test(string)) {
        const voteId = voteExpiredRegExp.exec(string)[1];

        return {
          type: "voteExpiredBeforeCompletion",
          timestamp,
          voteId: Number(voteId)
        };
      }

      if (prematurelyExpiredRegExp.test(string)) {
        const voteId = prematurelyExpiredRegExp.exec(string)[1];

        return {
          type: "votePrematurelyExpired",
          timestamp,
          voteId: Number(voteId)
        };
      }

      if (voteCompletedRegExp.test(string)) {
        const res = voteCompletedRegExp.exec(string);
        const [voteId, result] = res.slice(1, 3);

        return {
          type: "voteCompleted",
          timestamp,
          voteId: Number(voteId),
          result
        };
      }

      if (votePassedRegExp.test(string)) {
        const res = votePassedRegExp.exec(string);
        const [playerName, forVotes, requiredVotes, againstVotes] = res.slice(1, 5);

        return {
          type: "votePassed",
          timestamp,
          playerName,
          forVotes: Number(forVotes),
          requiredVotes: Number(requiredVotes),
          againstVotes: Number(againstVotes)
        };
      }

      break;
    }
  }
};

module.exports = parseLogString;