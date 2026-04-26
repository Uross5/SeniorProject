using Agppa.Api.Data;
using Agppa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StatsController(AppDbContext db) => _db = db;

    public class PlayerSplitDto
    {
        public int Games { get; set; }
        public double AvgPoints { get; set; }
        public double AvgRebounds { get; set; }
        public double AvgAssists { get; set; }
    }

    public class AthleteSummaryDto
    {
        public int AthleteId { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public int TeamId { get; set; }
        public string TeamName { get; set; } = "";
        public int GamesPlayed { get; set; }
        public double AvgPoints { get; set; }
        public double AvgRebounds { get; set; }
        public double AvgAssists { get; set; }
        public PlayerSplitDto Home { get; set; } = new();
        public PlayerSplitDto Away { get; set; } = new();
    }

    public class TeamLocationSplitDto
    {
        public int Games { get; set; }
        public double AvgPointsFor { get; set; }
        public double AvgPointsAgainst { get; set; }
    }

    public class TeamSummaryDto
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = "";
        public int GamesPlayed { get; set; }
        public double AvgPointsFor { get; set; }
        public double AvgPointsAgainst { get; set; }
        public TeamLocationSplitDto WhenHome { get; set; } = new();
        public TeamLocationSplitDto WhenAway { get; set; } = new();
    }

    public class LeagueSummaryDto
    {
        public List<AthleteSummaryDto> Athletes { get; set; } = new();
        public List<TeamSummaryDto> Teams { get; set; } = new();
    }

    [HttpGet("summary")]
    [AllowAnonymous]
    public async Task<ActionResult<LeagueSummaryDto>> Summary()
    {
        var athletes = await _db.Athletes.AsNoTracking()
            .Include(a => a.Team)
            .ToListAsync();
        var statRows = await _db.AthleteGameStats.AsNoTracking()
            .Include(s => s.Game)
            .Include(s => s.Athlete)
            .ToListAsync();

        var athleteSummaries = athletes.Select(a =>
        {
            var mine = statRows.Where(s => s.AthleteId == a.AthleteId).ToList();
            var homeRows = mine.Where(s => s.Athlete.TeamId == s.Game.HomeTeamId).ToList();
            var awayRows = mine.Where(s => s.Athlete.TeamId == s.Game.AwayTeamId).ToList();
            return new AthleteSummaryDto
            {
                AthleteId = a.AthleteId,
                FirstName = a.FirstName,
                LastName = a.LastName,
                TeamId = a.TeamId,
                TeamName = a.Team.TeamName,
                GamesPlayed = mine.Count,
                AvgPoints = Avg(mine, x => x.Points),
                AvgRebounds = Avg(mine, x => x.Rebounds),
                AvgAssists = Avg(mine, x => x.Assists),
                Home = PlayerSplit(homeRows),
                Away = PlayerSplit(awayRows),
            };
        }).OrderByDescending(x => x.AvgPoints).ThenBy(x => x.LastName).ToList();

        var teams = await _db.Teams.AsNoTracking().OrderBy(t => t.TeamName).ToListAsync();
        var games = await _db.Games.AsNoTracking().ToListAsync();

        var teamSummaries = teams.Select(t =>
        {
            var asHome = games.Where(g => g.HomeTeamId == t.TeamId).ToList();
            var asAway = games.Where(g => g.AwayTeamId == t.TeamId).ToList();
            var all = asHome.Concat(asAway).ToList();
            return new TeamSummaryDto
            {
                TeamId = t.TeamId,
                TeamName = t.TeamName,
                GamesPlayed = all.Count,
                AvgPointsFor = AvgPointsForTeam(all, t.TeamId),
                AvgPointsAgainst = AvgPointsAgainstTeam(all, t.TeamId),
                WhenHome = TeamHomeSplit(asHome),
                WhenAway = TeamAwaySplit(asAway),
            };
        }).ToList();

        return Ok(new LeagueSummaryDto { Athletes = athleteSummaries, Teams = teamSummaries });
    }

    private static PlayerSplitDto PlayerSplit(List<AthleteGameStat> rows) => new()
    {
        Games = rows.Count,
        AvgPoints = Avg(rows, x => x.Points),
        AvgRebounds = Avg(rows, x => x.Rebounds),
        AvgAssists = Avg(rows, x => x.Assists),
    };

    private static double Avg(List<AthleteGameStat> rows, Func<AthleteGameStat, int> sel) =>
        rows.Count == 0 ? 0 : rows.Sum(sel) / (double)rows.Count;

    private static double AvgPointsForTeam(List<Game> games, int teamId) =>
        games.Count == 0 ? 0 : games.Sum(g => g.HomeTeamId == teamId ? g.HomeScore : g.AwayScore) / (double)games.Count;

    private static double AvgPointsAgainstTeam(List<Game> games, int teamId) =>
        games.Count == 0 ? 0 : games.Sum(g => g.HomeTeamId == teamId ? g.AwayScore : g.HomeScore) / (double)games.Count;

    private static TeamLocationSplitDto TeamHomeSplit(List<Game> games) =>
        games.Count == 0
            ? new TeamLocationSplitDto()
            : new TeamLocationSplitDto
            {
                Games = games.Count,
                AvgPointsFor = games.Average(g => (double)g.HomeScore),
                AvgPointsAgainst = games.Average(g => (double)g.AwayScore),
            };

    private static TeamLocationSplitDto TeamAwaySplit(List<Game> games) =>
        games.Count == 0
            ? new TeamLocationSplitDto()
            : new TeamLocationSplitDto
            {
                Games = games.Count,
                AvgPointsFor = games.Average(g => (double)g.AwayScore),
                AvgPointsAgainst = games.Average(g => (double)g.HomeScore),
            };
}
