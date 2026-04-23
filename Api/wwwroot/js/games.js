// This turns the raw date string into a pretty date.
// Example: "2026-04-22" becomes "Apr 22, 2026".
function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// This gets the games list from the browser storage.
// If nothing is saved yet, it returns an empty list.
function getSavedGames() {
    const saved = localStorage.getItem('gamesEntries');
    return saved ? JSON.parse(saved) : [];
}

// This saves the game entries into browser storage so they stay after refresh.
function saveGames(games) {
    localStorage.setItem('gamesEntries', JSON.stringify(games));
}

// This draws the roster input rows for the selected team.
function renderRoster(athletes) {
    const rosterSection = document.getElementById('rosterSection');
    if (!rosterSection) return;

    if (!athletes || athletes.length === 0) {
        rosterSection.innerHTML = '<p class="muted">No athletes found for this team yet. Pick a different team or add athletes first.</p>';
        return;
    }

    rosterSection.innerHTML = `
        <div class="roster-header">
            <span>Athlete</span>
            <span>Points</span>
            <span>Rebounds</span>
            <span>Assists</span>
            <span>Turnovers</span>
        </div>
        ${athletes.map((athlete) => `
            <div class="roster-row" data-athlete-id="${athlete.athleteId}">
                <div class="roster-row-name">${athlete.firstName} ${athlete.lastName}</div>
                <input class="roster-input" type="number" min="0" value="0" data-stat="points" aria-label="Points for ${athlete.firstName} ${athlete.lastName}" />
                <input class="roster-input" type="number" min="0" value="0" data-stat="rebounds" aria-label="Rebounds for ${athlete.firstName} ${athlete.lastName}" />
                <input class="roster-input" type="number" min="0" value="0" data-stat="assists" aria-label="Assists for ${athlete.firstName} ${athlete.lastName}" />
                <input class="roster-input" type="number" min="0" value="0" data-stat="turnovers" aria-label="Turnovers for ${athlete.firstName} ${athlete.lastName}" />
            </div>
        `).join('')}
    `;
}

// This loads the athletes for a selected team.
async function fetchAthletesForTeam(teamId) {
    try {
        const response = await fetch(`/api/athletes?teamId=${teamId}`);
        if (!response.ok) throw new Error('Could not load athletes');
        return await response.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// This draws the saved games on the page.
function renderGames(games) {
    const list = document.getElementById('gamesList');
    if (!list) return;

    if (games.length === 0) {
        list.innerHTML = '<p class="muted">No games added yet.</p>';
        return;
    }

    list.innerHTML = games
        .map((game, index) => `
            <div class="game-card">
                <div class="game-card-header">
                    <div>
                        <strong>${formatDate(game.gameDate)}</strong>
                        <div class="game-opponent">Opponent: ${game.opponentTeamName}</div>
                    </div>
                    <button type="button" class="danger small" data-delete="${index}">Delete</button>
                </div>
                <div class="game-athlete-list">
                    ${game.athleteStats.map((player) => `
                        <div class="game-athlete-item">
                            <strong>${player.name}</strong>
                            <span>P ${player.points} • R ${player.rebounds} • A ${player.assists} • T ${player.turnovers}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `)
        .join('');

    list.querySelectorAll('[data-delete]').forEach(button => {
        button.addEventListener('click', () => {
            const index = Number(button.getAttribute('data-delete'));
            const newGames = games.slice();
            newGames.splice(index, 1);
            saveGames(newGames);
            renderGames(newGames);
        });
    });
}

// This loads the teams from the backend API.
// It fills the dropdowns so the user can select teams.
async function loadTeams() {
    const yourTeamSelect = document.getElementById('yourTeam');
    const opponentTeamSelect = document.getElementById('opponentTeam');
    const error = document.getElementById('gamesFormError');
    if (!yourTeamSelect || !opponentTeamSelect) return;

    try {
        const response = await fetch('/api/teams');
        if (!response.ok) throw new Error('Could not load teams');
        const teams = await response.json();
        const options = `<option value="">Select team</option>` +
            teams.map((team) => `<option value="${team.teamId}">${team.teamName}</option>`).join('');
        yourTeamSelect.innerHTML = options;
        opponentTeamSelect.innerHTML = `<option value="">Select opponent</option>` +
            teams.map((team) => `<option value="${team.teamId}">${team.teamName}</option>`).join('');
        error.textContent = '';
    } catch (err) {
        yourTeamSelect.innerHTML = '<option value="">Unable to load teams</option>';
        opponentTeamSelect.innerHTML = '<option value="">Unable to load teams</option>';
        error.textContent = 'Unable to load teams. Please try again later.';
        console.error(err);
    }
}

// This makes sure the number fields are not empty and are numbers.
function validateNumber(value) {
    return value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;
}

function applyGamesUi() {
    const panel = document.getElementById('gamesFormPanel');
    if (!panel) return;
    panel.style.display = canCreateGame() ?  'block' : 'none';
    console.log("Applying games UI. Can create game:", canCreateGame());
}



// This sets up the form once the page has loaded.
function initGamesForm() {
    const form = document.getElementById('gamesForm');
    const error = document.getElementById('gamesFormError');
    const games = getSavedGames();

    renderGames(games);

    if (!form) return;

    const yourTeamSelect = document.getElementById('yourTeam');
    if (yourTeamSelect) {
        yourTeamSelect.addEventListener('change', async () => {
            const teamId = Number(yourTeamSelect.value);
            if (!teamId) {
                renderRoster([]);
                return;
            }
            const athletes = await fetchAthletesForTeam(teamId);
            renderRoster(athletes);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const gameDate = document.getElementById('gameDate').value;
        const yourTeamId = document.getElementById('yourTeam').value;
        const yourTeamName = document.getElementById('yourTeam').selectedOptions[0]?.text || '';
        const opponentTeamId = document.getElementById('opponentTeam').value;
        const opponentTeamName = document.getElementById('opponentTeam').selectedOptions[0]?.text || '';
        const rosterSection = document.getElementById('rosterSection');
        const rosterRows = rosterSection ? Array.from(rosterSection.querySelectorAll('.roster-row')) : [];
        const athleteStats = [];
        let invalidStat = false;

        if (!gameDate || !yourTeamId || !opponentTeamId) {
            error.textContent = 'Please choose a date, your team, and opponent team.';
            return;
        }

        if (rosterRows.length === 0) {
            error.textContent = 'Please select your team so athletes can be listed.';
            return;
        }

        for (const row of rosterRows) {
            const athleteId = Number(row.getAttribute('data-athlete-id'));
            const athleteName = row.querySelector('.roster-row-name')?.textContent?.trim() || '';
            const pointsInput = row.querySelector('input[data-stat="points"]');
            const reboundsInput = row.querySelector('input[data-stat="rebounds"]');
            const assistsInput = row.querySelector('input[data-stat="assists"]');
            const turnoversInput = row.querySelector('input[data-stat="turnovers"]');

            const points = pointsInput?.value ?? '';
            const rebounds = reboundsInput?.value ?? '';
            const assists = assistsInput?.value ?? '';
            const turnovers = turnoversInput?.value ?? '';

            if (!validateNumber(points) || !validateNumber(rebounds) || !validateNumber(assists) || !validateNumber(turnovers)) {
                invalidStat = true;
                break;
            }

            athleteStats.push({
                athleteId,
                name: athleteName,
                points: Number(points),
                rebounds: Number(rebounds),
                assists: Number(assists),
                turnovers: Number(turnovers)
            });
        }

        if (invalidStat) {
            error.textContent = 'All athlete stats must be numbers 0 or higher.';
            return;
        }

        const newGame = {
            gameDate,
            yourTeamId: Number(yourTeamId),
            yourTeamName,
            opponentTeamId: Number(opponentTeamId),
            opponentTeamName,
            athleteStats
        };

        const updatedGames = [newGame, ...games];
        saveGames(updatedGames);
        renderGames(updatedGames);
        error.textContent = '';
        form.reset();
        renderRoster([]);
    });
}

// When the page finishes loading, run these setup functions.
document.addEventListener('DOMContentLoaded', () => {
    applyGamesUi();
    loadTeams();
    initGamesForm();
});

