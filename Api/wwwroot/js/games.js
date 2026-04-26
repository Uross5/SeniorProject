const apiBase = "";

let teams = [];
let selectedGameId = null;

function applyGamesUi() {
    const p = document.getElementById("gameFormPanel");
    if (p) p.style.display = canManageGames() ? "block" : "none";
}

function canEditGameRow(g) {
    if (isSuperAdmin()) return true;
    if (!isTeamAdmin()) return false;
    const tid = Number(getUser().teamId);
    return g.homeTeamId === tid || g.awayTeamId === tid;
}

function isoLocalValue(d) {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

async function loadTeams() {
    teams = await apiJson(`${apiBase}/api/teams`);
    const h = document.getElementById("homeTeamId");
    const a = document.getElementById("awayTeamId");
    const opts = teams.map((t) => `<option value="${t.teamId}">${escapeHtml(t.teamName)}</option>`).join("");
    h.innerHTML = opts;
    a.innerHTML = opts;
    if (teams.length > 1) a.selectedIndex = 1;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function loadGamesList() {
    const el = document.getElementById("gamesList");
    const err = document.getElementById("gamesListError");
    err.textContent = "";
    try {
        const rows = await apiJson(`${apiBase}/api/games`);
        if (!rows.length) {
            el.innerHTML = "<p class='muted'>No games yet.</p>";
            return;
        }
        el.innerHTML = `
<table>
  <thead><tr><th>ID</th><th>Date</th><th>Matchup</th><th>Score</th><th></th></tr></thead>
  <tbody>
    ${rows
        .map((g) => {
            const dt = new Date(g.playedAt).toLocaleString();
            const can = canEditGameRow(g);
            const actions = can
                ? `<button type="button" class="secondary" data-open="${g.gameId}">Stats</button>
                   <button type="button" class="secondary" data-edit-game="${g.gameId}">Edit</button>
                   <button type="button" class="danger" data-del-game="${g.gameId}">Delete</button>`
                : `<button type="button" class="secondary" data-open="${g.gameId}">View</button>`;
            return `<tr>
      <td>${g.gameId}</td>
      <td>${escapeHtml(dt)}</td>
      <td>${escapeHtml(g.homeTeamName)} vs ${escapeHtml(g.awayTeamName)}</td>
      <td>${g.homeScore} – ${g.awayScore}</td>
      <td>${actions}</td>
    </tr>`;
        })
        .join("")}
  </tbody>
</table>`;
        el.querySelectorAll("[data-open]").forEach((b) =>
            b.addEventListener("click", () => openGameDetail(Number(b.getAttribute("data-open"))))
        );
        el.querySelectorAll("[data-edit-game]").forEach((b) =>
            b.addEventListener("click", () => startEditGame(Number(b.getAttribute("data-edit-game"))))
        );
        el.querySelectorAll("[data-del-game]").forEach((b) =>
            b.addEventListener("click", () => deleteGame(Number(b.getAttribute("data-del-game"))))
        );
    } catch (e) {
        err.textContent = "Error: " + e.message;
        el.innerHTML = "";
    }
}

async function openGameDetail(gameId) {
    selectedGameId = gameId;
    const panel = document.getElementById("gameDetailPanel");
    const err = document.getElementById("detailError");
    err.textContent = "";
    panel.style.display = "block";
    document.getElementById("detailGameId").textContent = String(gameId);
    try {
        const g = await apiJson(`${apiBase}/api/games/${gameId}`);
        document.getElementById("detailMeta").textContent = `${g.homeTeamName} ${g.homeScore} – ${g.awayScore} ${g.awayTeamName}`;
        const athletes = await apiJson(`${apiBase}/api/athletes`);
        const roster = athletes.filter((a) => a.teamId === g.homeTeamId || a.teamId === g.awayTeamId);
        const statByAthlete = {};
        (g.stats || []).forEach((s) => {
            statByAthlete[s.athleteId] = s;
        });
        const rowsEl = document.getElementById("statsRows");
        const myTid = getUser() && getUser().teamId != null ? Number(getUser().teamId) : null;
        rowsEl.innerHTML = roster
            .map((a) => {
                const s = statByAthlete[a.athleteId] || {
                    points: 0,
                    rebounds: 0,
                    assists: 0,
                };
                const canEditRow = isSuperAdmin() || (isTeamAdmin() && myTid === a.teamId);
                const ro = canEditRow ? "" : "readonly";
                return `<div class="stat-row" style="margin-bottom:0.75rem;padding:0.5rem;border:1px solid #e2e6ef;border-radius:6px;">
  <strong>${escapeHtml(a.firstName)} ${escapeHtml(a.lastName)}</strong> (${escapeHtml(a.teamName)})
  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:0.35rem;">
    <label>PTS <input type="number" min="0" data-aid="${a.athleteId}" data-f="pts" value="${s.points}" ${ro} style="width:4rem"/></label>
    <label>REB <input type="number" min="0" data-aid="${a.athleteId}" data-f="reb" value="${s.rebounds}" ${ro} style="width:4rem"/></label>
    <label>AST <input type="number" min="0" data-aid="${a.athleteId}" data-f="ast" value="${s.assists}" ${ro} style="width:4rem"/></label>
  </div></div>`;
            })
            .join("");
        const act = document.getElementById("statsActions");
        act.style.display = canManageGames() ? "block" : "none";
    } catch (e) {
        err.textContent = "Error: " + e.message;
    }
}

async function startEditGame(id) {
    const g = await apiJson(`${apiBase}/api/games/${id}`);
    document.getElementById("gameId").value = g.gameId;
    document.getElementById("homeTeamId").value = String(g.homeTeamId);
    document.getElementById("awayTeamId").value = String(g.awayTeamId);
    document.getElementById("playedAt").value = isoLocalValue(g.playedAt);
    document.getElementById("gameFormTitle").textContent = "Edit game";
    document.getElementById("gameFormError").textContent = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetGameForm() {
    document.getElementById("gameId").value = "";
    document.getElementById("gameFormTitle").textContent = "New game";
    document.getElementById("gameFormError").textContent = "";
    if (teams.length) {
        document.getElementById("homeTeamId").selectedIndex = 0;
        document.getElementById("awayTeamId").selectedIndex = Math.min(1, teams.length - 1);
    }
    document.getElementById("playedAt").value = isoLocalValue(new Date());
}

async function deleteGame(id) {
    if (!confirm("Delete game #" + id + "?")) return;
    try {
        await apiJson(`${apiBase}/api/games/${id}`, { method: "DELETE" });
        if (selectedGameId === id) {
            document.getElementById("gameDetailPanel").style.display = "none";
            selectedGameId = null;
        }
        await loadGamesList();
        resetGameForm();
    } catch (e) {
        document.getElementById("gamesListError").textContent = "Error: " + e.message;
    }
}

document.getElementById("gameForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("gameFormError");
    err.textContent = "";
    if (!canManageGames()) {
        err.textContent = "Not allowed.";
        return;
    }
    const homeTeamId = Number(document.getElementById("homeTeamId").value);
    const awayTeamId = Number(document.getElementById("awayTeamId").value);
    if (homeTeamId === awayTeamId) {
        err.textContent = "Home and away must be different.";
        return;
    }
    const body = {
        homeTeamId,
        awayTeamId,
        playedAt: new Date(document.getElementById("playedAt").value).toISOString(),
    };
    const gid = document.getElementById("gameId").value;
    try {
        if (gid) {
            await apiJson(`${apiBase}/api/games/${gid}`, {
                method: "PUT",
                body: JSON.stringify(body),
            });
        } else {
            await apiJson(`${apiBase}/api/games`, {
                method: "POST",
                body: JSON.stringify(body),
            });
        }
        await loadGamesList();
        resetGameForm();
    } catch (e2) {
        err.textContent = "Error: " + e2.message;
    }
});

document.getElementById("btnGameReset").addEventListener("click", resetGameForm);

document.getElementById("statsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("detailError");
    err.textContent = "";
    if (!selectedGameId || !canManageGames()) return;
    const inputs = document.querySelectorAll("#statsRows input[data-aid]");
    const byAth = {};
    inputs.forEach((inp) => {
        if (inp.readOnly) return;
        const aid = Number(inp.getAttribute("data-aid"));
        const f = inp.getAttribute("data-f");
        if (!byAth[aid]) byAth[aid] = { athleteId: aid, points: 0, rebounds: 0, assists: 0 };
        const v = Number(inp.value) || 0;
        if (f === "pts") byAth[aid].points = v;
        if (f === "reb") byAth[aid].rebounds = v;
        if (f === "ast") byAth[aid].assists = v;
    });
    const payload = Object.values(byAth);
    try {
        await apiJson(`${apiBase}/api/games/${selectedGameId}/stats`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        await loadGamesList();
        await openGameDetail(selectedGameId);
    } catch (e) {
        err.textContent = "Error: " + e.message;
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    applyGamesUi();
    await loadTeams();
    resetGameForm();
    await loadGamesList();
});
