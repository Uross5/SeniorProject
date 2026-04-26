const apiBase = "";

function esc(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function fmt(n) {
    return Number.isFinite(n) ? n.toFixed(1) : "—";
}

function norm(s) {
    return String(s ?? "").toLowerCase().trim();
}

function getSelectedValue(id) {
    const el = document.getElementById(id);
    return el ? String(el.value) : "";
}

function setOptions(selectEl, options) {
    selectEl.innerHTML = options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
}

function computeLeagueCards(data, filteredAthletes, filteredTeams, location) {
    const teams = filteredTeams ?? [];
    const athletes = filteredAthletes ?? [];
    const totalGames = teams.reduce((acc, t) => {
        if (location === "home") return acc + (t.whenHome?.games ?? 0);
        if (location === "away") return acc + (t.whenAway?.games ?? 0);
        return acc + (t.gamesPlayed ?? 0);
    }, 0);

    const avgPF =
        teams.length === 0
            ? 0
            : teams.reduce((acc, t) => {
                  if (location === "home") return acc + (t.whenHome?.avgPointsFor ?? 0);
                  if (location === "away") return acc + (t.whenAway?.avgPointsFor ?? 0);
                  return acc + (t.avgPointsFor ?? 0);
              }, 0) / teams.length;

    const avgPA =
        teams.length === 0
            ? 0
            : teams.reduce((acc, t) => {
                  if (location === "home") return acc + (t.whenHome?.avgPointsAgainst ?? 0);
                  if (location === "away") return acc + (t.whenAway?.avgPointsAgainst ?? 0);
                  return acc + (t.avgPointsAgainst ?? 0);
              }, 0) / teams.length;

    return [
        { label: "Teams", value: String(teams.length) },
        { label: "Players", value: String(athletes.length) },
        { label: "Team-games (sum)", value: String(totalGames) },
        { label: "Avg PF", value: fmt(avgPF) },
        { label: "Avg PA", value: fmt(avgPA) },
    ];
}

function renderCards(cards) {
    const el = document.getElementById("statsCards");
    if (!el) return;
    if (!cards || !cards.length) {
        el.innerHTML = "";
        return;
    }
    el.innerHTML = cards
        .map(
            (c) => `
<div class="stat-card">
  <div class="stat-card-label">${esc(c.label)}</div>
  <div class="stat-card-value">${esc(c.value)}</div>
</div>`
        )
        .join("");
}

function projectAthleteForLocation(a, location) {
    if (location === "home") {
        return {
            gp: a.home?.games ?? 0,
            ppg: a.home?.avgPoints ?? 0,
            rpg: a.home?.avgRebounds ?? 0,
            apg: a.home?.avgAssists ?? 0,
        };
    }
    if (location === "away") {
        return {
            gp: a.away?.games ?? 0,
            ppg: a.away?.avgPoints ?? 0,
            rpg: a.away?.avgRebounds ?? 0,
            apg: a.away?.avgAssists ?? 0,
        };
    }
    return {
        gp: a.gamesPlayed ?? 0,
        ppg: a.avgPoints ?? 0,
        rpg: a.avgRebounds ?? 0,
        apg: a.avgAssists ?? 0,
    };
}

function renderPlayersTable(athletes, location) {
    const pEl = document.getElementById("playerStats");
    if (!pEl) return;
    if (!athletes.length) {
        pEl.innerHTML = "<p class='muted'>No players match the current filters.</p>";
        return;
    }

    pEl.innerHTML = `
<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th>Player</th>
      <th>Team</th>
      <th>GP</th>
      <th>PPG</th>
      <th>RPG</th>
      <th>APG</th>
      <th class="col-split">Home GP</th>
      <th class="col-split">Home PPG</th>
      <th class="col-split">Away GP</th>
      <th class="col-split">Away PPG</th>
    </tr>
  </thead>
  <tbody>
    ${athletes
        .map((a) => {
            const proj = projectAthleteForLocation(a, location);
            return `<tr>
      <td>${esc(a.firstName)} ${esc(a.lastName)}</td>
      <td>${esc(a.teamName)}</td>
      <td>${proj.gp}</td>
      <td>${fmt(proj.ppg)}</td>
      <td>${fmt(proj.rpg)}</td>
      <td>${fmt(proj.apg)}</td>
      <td class="col-split">${a.home?.games ?? 0}</td>
      <td class="col-split">${fmt(a.home?.avgPoints ?? 0)}</td>
      <td class="col-split">${a.away?.games ?? 0}</td>
      <td class="col-split">${fmt(a.away?.avgPoints ?? 0)}</td>
    </tr>`;
        })
        .join("")}
  </tbody>
</table>
</div>`;
}

function projectTeamForLocation(t, location) {
    if (location === "home") {
        return {
            gp: t.whenHome?.games ?? 0,
            pf: t.whenHome?.avgPointsFor ?? 0,
            pa: t.whenHome?.avgPointsAgainst ?? 0,
        };
    }
    if (location === "away") {
        return {
            gp: t.whenAway?.games ?? 0,
            pf: t.whenAway?.avgPointsFor ?? 0,
            pa: t.whenAway?.avgPointsAgainst ?? 0,
        };
    }
    return {
        gp: t.gamesPlayed ?? 0,
        pf: t.avgPointsFor ?? 0,
        pa: t.avgPointsAgainst ?? 0,
    };
}

function renderTeamsTable(teams, location) {
    const tEl = document.getElementById("teamStats");
    if (!tEl) return;
    if (!teams.length) {
        tEl.innerHTML = "<p class='muted'>No teams match the current filters.</p>";
        return;
    }
    tEl.innerHTML = `
<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th>Team</th>
      <th>GP</th>
      <th>PPG (PF)</th>
      <th>Opp PPG (PA)</th>
      <th>Home G</th>
      <th>Home PF</th>
      <th>Home PA</th>
      <th>Road G</th>
      <th>Road PF</th>
      <th>Road PA</th>
    </tr>
  </thead>
  <tbody>
    ${teams
        .map((t) => {
            const proj = projectTeamForLocation(t, location);
            return `<tr>
      <td>${esc(t.teamName)}</td>
      <td>${proj.gp}</td>
      <td>${fmt(proj.pf)}</td>
      <td>${fmt(proj.pa)}</td>
      <td>${t.whenHome?.games ?? 0}</td>
      <td>${fmt(t.whenHome?.avgPointsFor ?? 0)}</td>
      <td>${fmt(t.whenHome?.avgPointsAgainst ?? 0)}</td>
      <td>${t.whenAway?.games ?? 0}</td>
      <td>${fmt(t.whenAway?.avgPointsFor ?? 0)}</td>
      <td>${fmt(t.whenAway?.avgPointsAgainst ?? 0)}</td>
    </tr>`;
        })
        .join("")}
  </tbody>
</table>
</div>`;
}

function applyFilters(data) {
    const teamId = getSelectedValue("filterTeam");
    const location = getSelectedValue("filterLocation") || "all";
    const q = norm(getSelectedValue("filterPlayer"));

    let athletes = (data.athletes || []).slice();
    let teams = (data.teams || []).slice();

    if (teamId && teamId !== "all") {
        athletes = athletes.filter((a) => String(a.teamId) === String(teamId));
        teams = teams.filter((t) => String(t.teamId) === String(teamId));
    }

    if (q) {
        athletes = athletes.filter((a) => norm(`${a.firstName} ${a.lastName}`).includes(q));
    }

    const loc = location === "home" ? "home" : location === "away" ? "away" : "all";

    // Hide split columns when user is explicitly in home/away mode.
    const splitCols = document.querySelectorAll(".col-split");
    splitCols.forEach((c) => {
        c.style.display = loc === "all" ? "" : "none";
    });

    return { athletes, teams, location: loc };
}

async function loadStats() {
    const err = document.getElementById("statsError");
    err.textContent = "";
    try {
        const data = await apiJson(`${apiBase}/api/stats/summary`);
        const teams = (data.teams || []).slice().sort((a, b) => String(a.teamName).localeCompare(String(b.teamName)));
        const filterTeam = document.getElementById("filterTeam");
        if (filterTeam) {
            setOptions(
                filterTeam,
                [{ value: "all", label: "All teams" }].concat(
                    teams.map((t) => ({ value: String(t.teamId), label: t.teamName }))
                )
            );
        }

        const rerender = () => {
            const filtered = applyFilters(data);
            const cards = computeLeagueCards(data, filtered.athletes, filtered.teams, filtered.location);
            renderCards(cards);
            renderPlayersTable(filtered.athletes, filtered.location);
            renderTeamsTable(filtered.teams, filtered.location);
        };

        ["filterTeam", "filterLocation", "filterPlayer"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("input", rerender);
            if (el) el.addEventListener("change", rerender);
        });

        rerender();
    } catch (e) {
        err.textContent = "Error: " + e.message;
        const pEl = document.getElementById("playerStats");
        const tEl = document.getElementById("teamStats");
        const cEl = document.getElementById("statsCards");
        if (pEl) pEl.innerHTML = "";
        if (tEl) tEl.innerHTML = "";
        if (cEl) cEl.innerHTML = "";
    }
}

document.addEventListener("DOMContentLoaded", loadStats);
