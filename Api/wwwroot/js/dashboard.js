// This function asks the browser to get current athlete percentile data from the stats API.
// It converts the summary into the same shape the dashboard expects.
async function fetchPercentiles() {
    try {
        const response = await fetch('/api/stats/summary');
        if (!response.ok) {
            throw new Error('Failed to fetch percentile data');
        }

        const data = await response.json();
        const athletes = (data.athletes || []).map((athlete) => ({
            athlete_id: athlete.athleteId,
            first_name: athlete.firstName,
            last_name: athlete.lastName,
            position: athlete.position || 'Unknown',
            percentiles: [
                {
                    season_id: 0,
                    season_name: 'Current league',
                    points_scored: clamp(athlete.pointsPercentile),
                    assists: clamp(athlete.assistsPercentile),
                    rebounds: clamp(athlete.reboundsPercentile),
                },
            ],
        }));

        return athletes;
    } catch (error) {
        console.error('Error fetching percentiles:', error);
        return [];
    }
}

function clamp(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, num));
}

// This function makes a nice text label for a percentile number.
function formatPercentile(value) {
    // Make the number look like 67.3th instead of 67.25.
    return `${value.toFixed(1)}th`;
}

function getPercentileClass(value) {
    if (value <= 25) return 'percentile-red';
    if (value <= 49) return 'percentile-orange';
    if (value <= 74) return 'percentile-yellow';
    return 'percentile-green';
}

// This function creates one athlete card on the page.
function createAthleteCard(athlete) {
    // Get the last season from the athlete's percentiles.
    const latestSeason = athlete.percentiles[athlete.percentiles.length - 1];

    // Save the main stats into a list so we can use them together.
    const percentiles = [
        latestSeason.points_scored,
        latestSeason.assists,
        latestSeason.rebounds
    ];

    // Add the values and divide by how many there are to get the average.
    const overall = percentiles.reduce((sum, value) => sum + value, 0) / percentiles.length;

    // Make a new card element for the page.
    const card = document.createElement('div');
    card.className = 'athlete-card';

    // Put the athlete name, rank, and stats into the card.
    card.innerHTML = `
        <div class="athlete-card-top">
            <div>
                <h3 class="athlete-name">${athlete.first_name} ${athlete.last_name}</h3>
                <p class="athlete-subtitle">${athlete.position} • ${latestSeason.season_name}</p>
            </div>
            <div class="overall-badge">
                <span class="overall-label">Overall Percentile</span>
                <span class="overall-value ${getPercentileClass(overall)}">${formatPercentile(overall)}</span>
            </div>
        </div>
        <div class="stat-grid">
            <div class="stat-row">
                <span>Points</span>
                <span class="stat-value ${getPercentileClass(latestSeason.points_scored)}">${formatPercentile(latestSeason.points_scored)}</span>
            </div>
            <div class="stat-row">
                <span>Assists</span>
                <span class="stat-value ${getPercentileClass(latestSeason.assists)}">${formatPercentile(latestSeason.assists)}</span>
            </div>
            <div class="stat-row">
                <span>Rebounds</span>
                <span class="stat-value ${getPercentileClass(latestSeason.rebounds)}">${formatPercentile(latestSeason.rebounds)}</span>
            </div>
        </div>
    `;

    // When someone clicks this card, open the detailed view for this athlete.
    card.addEventListener('click', () => showAthleteDetail(athlete));
    return card;
}

// This function fills the detail modal with information for one athlete.
function showAthleteDetail(athlete) {
    const latestSeason = athlete.percentiles[athlete.percentiles.length - 1];
    const percentiles = [
        latestSeason.points_scored,
        latestSeason.assists,
        latestSeason.rebounds,
    ];
    const overall = percentiles.reduce((sum, value) => sum + value, 0) / percentiles.length;

    // Find the place on the page where we will show the detail information.
    const detailContent = document.getElementById('detailContent');

    detailContent.innerHTML = `
        <div class="detail-header">
            <div>
                <h2 id="detailTitle" class="detail-title">${athlete.first_name} ${athlete.last_name}</h2>
                <p class="detail-subtitle">${athlete.position} • ${latestSeason.season_name}</p>
                <p class="detail-meta">Basketball • Current season summary</p>
            </div>
            <div class="detail-overall">
                <span class="detail-overall-label">Overall</span>
                <span class="detail-overall-value">${formatPercentile(overall)}</span>
                <span class="detail-status">${overall >= 60 ? 'Above Average' : overall >= 40 ? 'Average' : 'Below Average'}</span>
            </div>
        </div>
        <div class="detail-grid">
            <section class="detail-section">
                <h3>Performance Percentiles</h3>
                ${['Points', 'Assists', 'Rebounds']
                    .map((label, index) => {
                        const statKey = ['points_scored', 'assists', 'rebounds'][index];
                        const value = latestSeason[statKey];
                        return `
                            <div class="detail-row">
                                <div>
                                    <div class="detail-row-label">${label}</div>
                                    <div class="detail-row-subtitle">${value.toFixed(1)}th percentile</div>
                                </div>
                                <div class="detail-row-bar">
                                    <div class="bar-track"><div class="bar-fill ${getPercentileClass(value)}" style="width: ${value}%"></div></div>
                                </div>
                            </div>
                        `;
                    })
                    .join('')}
            </section>
            <section class="detail-section detail-summary">
                <h3>Performance Summary</h3>
                <p>The athlete's latest season metrics are shown here with percentile ranks. Higher values indicate stronger relative performance.</p>
                <div class="summary-list">
                    <div><strong>Season:</strong> <span>${latestSeason.season_name}</span></div>
                    <div><strong>Position:</strong> <span>${athlete.position}</span></div>
                    <div><strong>Overall Rank:</strong> <span>${formatPercentile(overall)}</span></div>
                </div>
            </section>
        </div>
    `;

    // Show the modal by making it visible.
    const detailModal = document.getElementById('detailModal');
    detailModal.style.display = 'flex';
    detailModal.setAttribute('aria-hidden', 'false');
}

// This function loads the dashboard and adds all athlete cards.
async function loadDashboard() {
    // Find the place on the page where cards should go.
    const dashboardContent = document.getElementById('dashboardContent');

    try {
        // Get the athletes from the live stats API.
        const athletes = await fetchPercentiles();

        // If no athletes are returned, show a message.
        if (athletes.length === 0) {
            dashboardContent.innerHTML = '<p class="dashboard-error">No athlete data available.</p>';
            return;
        }

        // Remove any old text while we add cards.
        dashboardContent.innerHTML = '';

        // For each athlete, make a card and put it on the page.
        athletes.forEach(athlete => {
            const card = createAthleteCard(athlete);
            dashboardContent.appendChild(card);
        });

    } catch (error) {
        // If something went wrong, show an error message.
        dashboardContent.innerHTML = '<p class="dashboard-error">Error loading athlete data. Please try again later.</p>';
        console.error('Dashboard load error:', error);
    }
}

// This hides the detail box again.
function closeDetailModal() {
    const detailModal = document.getElementById('detailModal');
    detailModal.style.display = 'none';
    detailModal.setAttribute('aria-hidden', 'true');
}

// This runs after the page finishes loading.
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
    window.addEventListener('click', (event) => {
        const detailModal = document.getElementById('detailModal');
        if (event.target === detailModal) {
            closeDetailModal();
        }
    });
});