"use strict";

const { getDbPath } = require("./db");
const repo = require("./profile-repository");
const { validateProfile } = require("./profile-validation");

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
  return true;
}

async function handleApi(req, res, urlPath) {
  try {
    if (urlPath === "/api/leaderboard" && req.method === "GET") {
      return sendJson(res, 200, { leaderboard: repo.getLeaderboard(100) });
    }

    if (urlPath === "/api/storage/status" && req.method === "GET") {
      return sendJson(res, 200, {
        backend: "sqlite",
        database: getDbPath(),
        profileCount: repo.countProfiles()
      });
    }

    if (urlPath === "/api/profiles/register" && req.method === "POST") {
      const body = await readJsonBody(req);
      const { profile, session } = repo.register(body.username, body.passcode);
      return sendJson(res, 201, { profile, session });
    }

    if (urlPath === "/api/profiles/login" && req.method === "POST") {
      const body = await readJsonBody(req);
      const { profile, session } = repo.login(body.username, body.passcode);
      return sendJson(res, 200, { profile, session });
    }

    if (urlPath === "/api/profiles/logout" && req.method === "POST") {
      repo.logout(getBearerToken(req));
      return sendJson(res, 200, { ok: true });
    }

    if (urlPath === "/api/profiles/me" && req.method === "GET") {
      const session = repo.getSession(getBearerToken(req));
      if (!session) return sendJson(res, 401, { error: "Session expired. Please log in again." });
      return sendJson(res, 200, { profile: session.profile });
    }

    if (urlPath === "/api/profiles/me" && req.method === "PUT") {
      const token = getBearerToken(req);
      const body = await readJsonBody(req);
      const profile = repo.saveProfileForSession(token, validateProfile(body.profile || body));
      return sendJson(res, 200, { profile });
    }

    if (urlPath === "/api/profiles/change-passcode" && req.method === "POST") {
      const body = await readJsonBody(req);
      const profile = repo.changePasscode(getBearerToken(req), body.oldPasscode, body.newPasscode);
      return sendJson(res, 200, { profile });
    }

    if (urlPath === "/api/profiles/me" && req.method === "DELETE") {
      const body = await readJsonBody(req);
      repo.deleteProfile(getBearerToken(req), body.passcode);
      return sendJson(res, 200, { ok: true });
    }

    if (urlPath === "/api/profiles/migrate-local" && req.method === "POST") {
      const body = await readJsonBody(req);
      const imported = repo.importFromLocalMap(body.profiles || {});
      return sendJson(res, 200, { imported });
    }

    return false;
  } catch (err) {
    sendJson(res, 400, { error: err.message || "Request failed" });
    return true;
  }
}

module.exports = { handleApi, readJsonBody };
