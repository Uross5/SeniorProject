using Agppa.Api.Auth;
using Agppa.Api.Data;
using Agppa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly AppDbContext _db;

    public GamesController(AppDbContext db) => _db = db;

    public class GameListDto
    {
        public int GameId { get; set; }
        public int HomeTeamId { get; set; }
        public string HomeTeamName { get; set; } = "";
        public int AwayTeamId { get; set; }
        public string AwayTeamName { get; set; } = "";
        public int HomeScore { get; set; }
        public int AwayScore { get; set; }
        public DateTime PlayedAt { get; set; }
    }

    public class StatLineDto
    {
        public int AthleteGameStatId { get; set; }
        public int AthleteId { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public int AthleteTeamId { get; set; }
        public int Points { get; set; }
        public int Rebounds { get; set; }
        public int Assists { get; set; }
    }

    public class GameDetailDto : GameListDto
    {
        public List<StatLineDto> Stats { get; set; } = new();
    }

    public class SaveGameRequest
    {
        public int HomeTeamId { get; set; }
        public int AwayTeamId { get; set; }
        public DateTime PlayedAt { get; set; }
    }

    public class StatUpsertItem
    {
        public int AthleteId { get; set; }
        public int Points { get; set; }
        public int Rebounds { get; set; }
        public int Assists { get; set; }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<GameListDto>>> GetAll()
    {
        var rows = await _db.Games.AsNoTracking()
            .Include(g => g.HomeTeam)
            .Include(g => g.AwayTeam)
            .OrderByDescending(g => g.PlayedAt)
            .Select(g => new GameListDto
            {
                GameId = g.GameId,
                HomeTeamId = g.HomeTeamId,
                HomeTeamName = g.HomeTeam.TeamName,
                AwayTeamId = g.AwayTeamId,
                AwayTeamName = g.AwayTeam.TeamName,
                HomeScore = g.HomeScore,
                AwayScore = g.AwayScore,
                PlayedAt = g.PlayedAt,
            })
            .ToListAsync();
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<GameDetailDto>> GetById(int id)
    {
        var g = await _db.Games.AsNoTracking()
            .Include(x => x.HomeTeam)
            .Include(x => x.AwayTeam)
            .FirstOrDefaultAsync(x => x.GameId == id);
        if (g == null) return NotFound();
        var stats = await _db.AthleteGameStats.AsNoTracking()
            .Include(s => s.Athlete)
            .Where(s => s.GameId == id)
            .OrderBy(s => s.AthleteId)
            .Select(s => new StatLineDto
            {
                AthleteGameStatId = s.AthleteGameStatId,
                AthleteId = s.AthleteId,
                FirstName = s.Athlete.FirstName,
                LastName = s.Athlete.LastName,
                AthleteTeamId = s.Athlete.TeamId,
                Points = s.Points,
                Rebounds = s.Rebounds,
                Assists = s.Assists,
            })
            .ToListAsync();
        return Ok(new GameDetailDto
        {
            GameId = g.GameId,
            HomeTeamId = g.HomeTeamId,
            HomeTeamName = g.HomeTeam.TeamName,
            AwayTeamId = g.AwayTeamId,
            AwayTeamName = g.AwayTeam.TeamName,
            HomeScore = g.HomeScore,
            AwayScore = g.AwayScore,
            PlayedAt = g.PlayedAt,
            Stats = stats,
        });
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<ActionResult<GameListDto>> Create([FromBody] SaveGameRequest body)
    {
        var err = ValidateGameBody(body);
        if (err != null) return BadRequest(new { message = err });
        if (!await _db.Teams.AnyAsync(t => t.TeamId == body.HomeTeamId) ||
            !await _db.Teams.AnyAsync(t => t.TeamId == body.AwayTeamId))
            return BadRequest(new { message = "Unknown team id." });
        if (!TeamAccess.CanManageGame(User, body.HomeTeamId, body.AwayTeamId)) return Forbid();

        var g = new Game
        {
            HomeTeamId = body.HomeTeamId,
            AwayTeamId = body.AwayTeamId,
            HomeScore = 0,
            AwayScore = 0,
            PlayedAt = body.PlayedAt,
        };
        _db.Games.Add(g);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = g.GameId }, await ListRow(g.GameId));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveGameRequest body)
    {
        var err = ValidateGameBody(body);
        if (err != null) return BadRequest(new { message = err });
        var g = await _db.Games.FirstOrDefaultAsync(x => x.GameId == id);
        if (g == null) return NotFound();
        if (!TeamAccess.CanManageGame(User, g.HomeTeamId, g.AwayTeamId)) return Forbid();
        if (!TeamAccess.CanManageGame(User, body.HomeTeamId, body.AwayTeamId)) return Forbid();
        if (!await _db.Teams.AnyAsync(t => t.TeamId == body.HomeTeamId) ||
            !await _db.Teams.AnyAsync(t => t.TeamId == body.AwayTeamId))
            return BadRequest(new { message = "Unknown team id." });

        g.HomeTeamId = body.HomeTeamId;
        g.AwayTeamId = body.AwayTeamId;
        g.PlayedAt = body.PlayedAt;
        await _db.SaveChangesAsync();
        await RecalculateGameScoresAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<IActionResult> Delete(int id)
    {
        var g = await _db.Games.FirstOrDefaultAsync(x => x.GameId == id);
        if (g == null) return NotFound();
        if (!TeamAccess.CanManageGame(User, g.HomeTeamId, g.AwayTeamId)) return Forbid();
        _db.Games.Remove(g);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:int}/stats")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<IActionResult> UpsertStats(int id, [FromBody] List<StatUpsertItem> body)
    {
        if (body == null) return BadRequest(new { message = "Body required." });
        var g = await _db.Games.AsNoTracking().FirstOrDefaultAsync(x => x.GameId == id);
        if (g == null) return NotFound();
        if (!TeamAccess.CanManageGame(User, g.HomeTeamId, g.AwayTeamId)) return Forbid();

        var athleteIds = body.Select(b => b.AthleteId).Distinct().ToList();
        var athletes = await _db.Athletes.Where(a => athleteIds.Contains(a.AthleteId)).ToListAsync();
        if (athletes.Count != athleteIds.Count)
            return BadRequest(new { message = "One or more athletes not found." });

        foreach (var a in athletes)
        {
            if (a.TeamId != g.HomeTeamId && a.TeamId != g.AwayTeamId)
                return BadRequest(new { message = $"Athlete #{a.AthleteId} is not on either team in this game." });
            if (!TeamAccess.IsSuperAdmin(User) && a.TeamId != User.GetTeamId())
                return Forbid();
        }

        var existing = await _db.AthleteGameStats.Where(s => s.GameId == id).ToListAsync();
        foreach (var item in body)
        {
            var row = existing.FirstOrDefault(s => s.AthleteId == item.AthleteId);
            if (row == null)
            {
                row = new AthleteGameStat { GameId = id, AthleteId = item.AthleteId };
                _db.AthleteGameStats.Add(row);
                existing.Add(row);
            }
            row.Points = item.Points;
            row.Rebounds = item.Rebounds;
            row.Assists = item.Assists;
        }
        await _db.SaveChangesAsync();
        await RecalculateGameScoresAsync(id);
        return NoContent();
    }

    [HttpDelete("{gameId:int}/stats/{athleteId:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<IActionResult> DeleteStat(int gameId, int athleteId)
    {
        var g = await _db.Games.AsNoTracking().FirstOrDefaultAsync(x => x.GameId == gameId);
        if (g == null) return NotFound();
        if (!TeamAccess.CanManageGame(User, g.HomeTeamId, g.AwayTeamId)) return Forbid();

        var athlete = await _db.Athletes.AsNoTracking().FirstOrDefaultAsync(a => a.AthleteId == athleteId);
        if (athlete == null) return NotFound();
        if (!TeamAccess.IsSuperAdmin(User) && athlete.TeamId != User.GetTeamId())
            return Forbid();

        var row = await _db.AthleteGameStats.FirstOrDefaultAsync(s => s.GameId == gameId && s.AthleteId == athleteId);
        if (row == null) return NotFound();
        _db.AthleteGameStats.Remove(row);
        await _db.SaveChangesAsync();
        await RecalculateGameScoresAsync(gameId);
        return NoContent();
    }

    /// <summary>Sets game home/away score to the sum of player points on each roster for this game.</summary>
    private async Task RecalculateGameScoresAsync(int gameId)
    {
        var game = await _db.Games.FirstOrDefaultAsync(g => g.GameId == gameId);
        if (game == null) return;

        var stats = await _db.AthleteGameStats
            .Include(s => s.Athlete)
            .Where(s => s.GameId == gameId)
            .ToListAsync();

        game.HomeScore = stats.Where(s => s.Athlete.TeamId == game.HomeTeamId).Sum(s => s.Points);
        game.AwayScore = stats.Where(s => s.Athlete.TeamId == game.AwayTeamId).Sum(s => s.Points);
        await _db.SaveChangesAsync();
    }

    private static string? ValidateGameBody(SaveGameRequest body)
    {
        if (body.HomeTeamId == body.AwayTeamId) return "Home and away team must differ.";
        return null;
    }

    private async Task<GameListDto?> ListRow(int gameId) =>
        await _db.Games.AsNoTracking()
            .Include(g => g.HomeTeam)
            .Include(g => g.AwayTeam)
            .Where(g => g.GameId == gameId)
            .Select(g => new GameListDto
            {
                GameId = g.GameId,
                HomeTeamId = g.HomeTeamId,
                HomeTeamName = g.HomeTeam.TeamName,
                AwayTeamId = g.AwayTeamId,
                AwayTeamName = g.AwayTeam.TeamName,
                HomeScore = g.HomeScore,
                AwayScore = g.AwayScore,
                PlayedAt = g.PlayedAt,
            })
            .FirstOrDefaultAsync();
}
