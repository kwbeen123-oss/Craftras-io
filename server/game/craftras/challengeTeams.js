const TEAM_LIMIT = 8;
const INVITE_DURATION = 30_000;
const TEAM_NAME_LIMIT = 24;

function playerName(socket) {
    return String(socket?.player?.body?.name || "").trim();
}

function normalizePlayerName(value) {
    return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function sanitizeTeamName(value) {
    return String(value || "")
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .replace(/\s+/g, " ");
}

function hostLabel(teamName) {
    return /s$/i.test(teamName) ? `${teamName}' Host` : `${teamName}'s Host`;
}

function getState(gameManager) {
    gameManager.craftrasChallengeTeamState ??= {
        nextId: 1,
        nextEngineTeam: 1,
        teams: new Map(),
    };
    return gameManager.craftrasChallengeTeamState;
}

function restoreSocketTeam(socket) {
    if (!socket) return;
    const body = socket.player?.body;
    if (socket.craftrasChallengeTeamOriginalCaptured && socket.player) {
        socket.player.team = socket.craftrasChallengeOriginalPlayerTeam;
    }
    if (body && socket.craftrasChallengeTeamOriginalCaptured) {
        body.team = socket.craftrasChallengeOriginalBodyTeam;
    }
    delete socket.craftrasChallengeTeamOriginalCaptured;
    delete socket.craftrasChallengeOriginalPlayerTeam;
    delete socket.craftrasChallengeOriginalBodyTeam;
    delete socket.craftrasChallengeEngineTeam;
}

function applySocketTeam(socket, engineTeam) {
    if (!socket || !Number.isFinite(engineTeam)) return;
    if (!socket.craftrasChallengeTeamOriginalCaptured) {
        socket.craftrasChallengeTeamOriginalCaptured = true;
        socket.craftrasChallengeOriginalPlayerTeam = socket.player?.team;
        socket.craftrasChallengeOriginalBodyTeam = socket.player?.body?.team;
    }
    socket.craftrasChallengeEngineTeam = engineTeam;
    if (socket.player) socket.player.team = engineTeam;
    if (socket.player?.body) socket.player.body.team = engineTeam;
}

function clearRequest(socket) {
    const request = socket?.craftrasChallengeTeamInvite;
    if (!request) return null;
    if (request.timeout) clearTimeout(request.timeout);
    socket.craftrasChallengeTeamInvite = null;
    socket.talk?.("CTI", 0, "", 0, "invite");
    return request;
}

function cancelRequestsForTeam(gameManager, teamId) {
    for (const client of gameManager.clients || []) {
        if (client?.craftrasChallengeTeamInvite?.teamId !== teamId) continue;
        const request = clearRequest(client);
        request?.requester?.talk?.("m", 4_000, "The team request was cancelled.");
        request?.host?.talk?.("m", 4_000, "The team request was cancelled.");
    }
}

function disbandRaw(gameManager, team, message = "") {
    if (!team) return false;
    const state = getState(gameManager);
    cancelRequestsForTeam(gameManager, team.id);
    state.teams.delete(team.id);
    for (const member of [...team.members]) {
        team.members.delete(member);
        if (member?.craftrasChallengeTeamId === team.id) member.craftrasChallengeTeamId = null;
        restoreSocketTeam(member);
        if (message) member?.talk?.("m", 5_000, message);
    }
    return true;
}

function prune(gameManager) {
    const state = getState(gameManager);
    const connected = new Set(gameManager.clients || []);
    for (const [teamId, team] of [...state.teams]) {
        if (!connected.has(team.host)) {
            disbandRaw(gameManager, team, "The team was disbanded because the host left.");
            continue;
        }
        for (const member of [...team.members]) {
            if (connected.has(member)) continue;
            team.members.delete(member);
            if (member?.craftrasChallengeTeamId === teamId) member.craftrasChallengeTeamId = null;
            restoreSocketTeam(member);
        }
        if (!team.members.size) state.teams.delete(teamId);
    }
    return state;
}

function getTeam(gameManager, socket) {
    const state = prune(gameManager);
    const teamId = socket?.craftrasChallengeTeamId;
    const team = teamId ? state.teams.get(teamId) : null;
    if (!team?.members.has(socket)) {
        if (socket) socket.craftrasChallengeTeamId = null;
        return null;
    }
    return team;
}

function getMembers(gameManager, socket) {
    const team = getTeam(gameManager, socket);
    return team ? [...team.members] : [];
}

function getTeamInfo(gameManager, socket) {
    const team = getTeam(gameManager, socket);
    if (!team) return null;
    return {
        id: team.id,
        name: team.name,
        host: team.host,
        isHost: team.host === socket,
        members: [...team.members],
    };
}

function addMember(team, socket) {
    team.members.add(socket);
    socket.craftrasChallengeTeamId = team.id;
    applySocketTeam(socket, team.engineTeam);
}

function createTeam(gameManager, host, requestedName) {
    if (!host || getTeam(gameManager, host)) return { ok: false, reason: "already" };
    const name = sanitizeTeamName(requestedName || playerName(host));
    if (!name) return { ok: false, reason: "name" };
    if (name.length > TEAM_NAME_LIMIT) return { ok: false, reason: "long" };
    const normalizedName = normalizePlayerName(name);
    const state = prune(gameManager);
    if ([...state.teams.values()].some(team => team.normalizedName === normalizedName)) {
        return { ok: false, reason: "taken" };
    }
    const id = `challenge-team-${state.nextId++}`;
    const team = {
        id,
        name,
        normalizedName,
        host,
        engineTeam: -10_000 - state.nextEngineTeam++,
        members: new Set(),
    };
    state.teams.set(id, team);
    addMember(team, host);
    syncHostLabels(gameManager, true);
    return { ok: true, team };
}

function findTeam(gameManager, query) {
    const normalized = normalizePlayerName(query);
    if (!normalized) return { ok: false, reason: "missing" };
    const teams = [...prune(gameManager).teams.values()];
    const byName = teams.filter(team => team.normalizedName === normalized);
    if (byName.length === 1) return { ok: true, team: byName[0] };
    if (byName.length > 1) return { ok: false, reason: "multiple" };
    const byHost = teams.filter(team => normalizePlayerName(playerName(team.host)) === normalized);
    if (byHost.length === 1) return { ok: true, team: byHost[0] };
    if (byHost.length > 1) return { ok: false, reason: "multiple" };
    return { ok: false, reason: "missing" };
}

function createRequest(gameManager, recipient, request) {
    if (recipient.craftrasChallengeTeamInvite) return { ok: false, reason: "pending" };
    request.expiresAt = Date.now() + INVITE_DURATION;
    request.timeout = setTimeout(() => {
        if (recipient.craftrasChallengeTeamInvite !== request) return;
        recipient.craftrasChallengeTeamInvite = null;
        recipient.talk?.("CTI", 0, "", 0, request.kind);
        if (request.kind === "join") {
            recipient.talk?.("m", 4_000, `${playerName(request.requester)}'s join request expired.`);
            request.requester?.talk?.("m", 4_000, "Your team join request expired.");
        } else {
            recipient.talk?.("m", 4_000, "Team invitation expired.");
            request.host?.talk?.("m", 4_000, `${playerName(request.requester)} did not answer the team invitation.`);
        }
    }, INVITE_DURATION);
    recipient.craftrasChallengeTeamInvite = request;
    const actor = request.kind === "join" ? request.requester : request.host;
    recipient.talk?.("CTI", 1, playerName(actor), INVITE_DURATION, request.kind);
    return { ok: true, expiresAt: request.expiresAt };
}

function invite(gameManager, inviter, target) {
    if (!inviter || !target || inviter === target) return { ok: false, reason: "self" };
    const team = getTeam(gameManager, inviter);
    if (!team) return { ok: false, reason: "no-team" };
    if (team.host !== inviter) return { ok: false, reason: "host" };
    const targetTeam = getTeam(gameManager, target);
    if (targetTeam === team) return { ok: false, reason: "same" };
    if (targetTeam) return { ok: false, reason: "other" };
    if (team.members.size >= TEAM_LIMIT) return { ok: false, reason: "full" };
    const result = createRequest(gameManager, target, {
        kind: "invite",
        teamId: team.id,
        host: inviter,
        requester: target,
    });
    if (result.ok) inviter.talk?.("m", 5_000, `Team invitation sent to ${playerName(target)}.`);
    return result;
}

function requestJoin(gameManager, requester, team) {
    if (!requester || !team) return { ok: false, reason: "missing" };
    if (getTeam(gameManager, requester)) return { ok: false, reason: "already" };
    if (team.host === requester) return { ok: false, reason: "already" };
    if (team.members.size >= TEAM_LIMIT) return { ok: false, reason: "full" };
    const result = createRequest(gameManager, team.host, {
        kind: "join",
        teamId: team.id,
        host: team.host,
        requester,
    });
    if (result.ok) requester.talk?.("m", 5_000, `Join request sent to ${team.name}.`);
    return result;
}

function respond(gameManager, recipient, accepted) {
    const request = clearRequest(recipient);
    if (!request) return { ok: false, reason: "missing" };
    const state = prune(gameManager);
    const team = state.teams.get(request.teamId);
    const connected = new Set(gameManager.clients || []);
    if (!team || team.host !== request.host || !connected.has(request.host) || !connected.has(request.requester)) {
        recipient.talk?.("m", 4_000, "The team request expired.");
        return { ok: false, reason: "expired" };
    }
    if (!accepted) {
        if (request.kind === "join") {
            request.host.talk?.("m", 4_000, "Team join request declined.");
            request.requester.talk?.("m", 4_000, `${playerName(request.host)} declined your team join request.`);
        } else {
            request.requester.talk?.("m", 4_000, "Team invitation declined.");
            request.host.talk?.("m", 4_000, `${playerName(request.requester)} declined your team invitation.`);
        }
        return { ok: true, accepted: false };
    }
    const requesterTeam = getTeam(gameManager, request.requester);
    if (requesterTeam) return { ok: false, reason: requesterTeam === team ? "same" : "other" };
    if (team.members.size >= TEAM_LIMIT) {
        request.requester.talk?.("m", 4_000, "The team is full.");
        request.host.talk?.("m", 4_000, "The team became full before the request was accepted.");
        return { ok: false, reason: "full" };
    }
    addMember(team, request.requester);
    const joinedName = playerName(request.requester);
    for (const member of team.members) {
        member?.talk?.("m", 5_000, `${joinedName} joined the team. (${team.members.size}/${TEAM_LIMIT})`);
    }
    return { ok: true, accepted: true, team };
}

function leave(gameManager, socket) {
    const state = prune(gameManager);
    const team = getTeam(gameManager, socket);
    if (!team) return { ok: false, reason: "missing" };
    if (team.host === socket) {
        disbandRaw(gameManager, team, `${playerName(socket)} disbanded the team.`);
        syncHostLabels(gameManager, true);
        return { ok: true, disbanded: true };
    }
    team.members.delete(socket);
    socket.craftrasChallengeTeamId = null;
    restoreSocketTeam(socket);
    for (const member of team.members) member?.talk?.("m", 5_000, `${playerName(socket)} left the team.`);
    if (!team.members.size) state.teams.delete(team.id);
    return { ok: true, disbanded: false };
}

function kickMember(gameManager, host, target) {
    const team = getTeam(gameManager, host);
    if (!team) return { ok: false, reason: "no-team" };
    if (team.host !== host) return { ok: false, reason: "host" };
    if (!target || target === host) return { ok: false, reason: "self" };
    if (!team.members.has(target)) return { ok: false, reason: "other" };
    team.members.delete(target);
    target.craftrasChallengeTeamId = null;
    restoreSocketTeam(target);
    target.talk?.("m", 5_000, `You were kicked from ${team.name}.`);
    for (const member of team.members) {
        member?.talk?.("m", 5_000, `${playerName(target)} was kicked from the team.`);
    }
    return { ok: true, team, target };
}

function removeSocket(gameManager, socket) {
    clearRequest(socket);
    for (const client of gameManager.clients || []) {
        const request = client?.craftrasChallengeTeamInvite;
        if (!request || (request.host !== socket && request.requester !== socket)) continue;
        clearRequest(client);
        client.talk?.("m", 4_000, "The team request was cancelled.");
    }
    const team = getTeam(gameManager, socket);
    if (team?.host === socket) disbandRaw(gameManager, team, "The team was disbanded because the host left.");
    else if (team) leave(gameManager, socket);
    syncHostLabels(gameManager, true);
}

function syncSocketTeam(gameManager, socket) {
    const team = getTeam(gameManager, socket);
    if (!team) return false;
    applySocketTeam(socket, team.engineTeam);
    return true;
}

function syncHostLabels(gameManager, force = false) {
    const entries = [...prune(gameManager).teams.values()]
        .map(team => ({ id: team.host?.player?.body?.id, label: hostLabel(team.name) }))
        .filter(entry => Number.isFinite(entry.id))
        .sort((a, b) => a.id - b.id);
    const signature = entries.map(entry => `${entry.id}:${entry.label}`).join("|");
    const packet = ["CTH", entries.length];
    for (const entry of entries) packet.push(entry.id, entry.label);
    for (const client of gameManager.clients || []) {
        if (!force && client.craftrasChallengeHostLabelSignature === signature) continue;
        client.craftrasChallengeHostLabelSignature = signature;
        client.talk?.(...packet);
    }
}

module.exports = {
    TEAM_LIMIT,
    INVITE_DURATION,
    TEAM_NAME_LIMIT,
    playerName,
    normalizePlayerName,
    getMembers,
    getTeamInfo,
    createTeam,
    findTeam,
    invite,
    requestJoin,
    respond,
    leave,
    kickMember,
    removeSocket,
    syncSocketTeam,
    syncHostLabels,
};
