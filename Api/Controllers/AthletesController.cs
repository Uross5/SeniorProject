using Agppa.Api.Auth;
using Agppa.Api.Data;
using Agppa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AthletesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AthletesController(AppDbContext db) => _db = db;

    public class AthleteRowDto
    {
        public int AthleteId { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public DateOnly? DateOfBirth { get; set; }
        public string? Position { get; set; }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<AthleteRowDto>>> GetAll()
    {
        var rows = await _db.Athletes.AsNoTracking()
            .Include(a => a.Team)
            .OrderBy(a => a.AthleteId)
            .Select(a => new AthleteRowDto
            {
                AthleteId = a.AthleteId,
                TeamId = a.TeamId,
                TeamName = a.Team.TeamName,
                FirstName = a.FirstName,
                LastName = a.LastName,
                DateOfBirth = a.DateOfBirth,
                Position = a.Position,
            })
            .ToListAsync();
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<AthleteRowDto>> GetById(int id)
    {
        var row = await _db.Athletes.AsNoTracking()
            .Include(a => a.Team)
            .Where(a => a.AthleteId == id)
            .Select(a => new AthleteRowDto
            {
                AthleteId = a.AthleteId,
                TeamId = a.TeamId,
                TeamName = a.Team.TeamName,
                FirstName = a.FirstName,
                LastName = a.LastName,
                DateOfBirth = a.DateOfBirth,
                Position = a.Position,
            })
            .FirstOrDefaultAsync();
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<ActionResult<AthleteRowDto>> Create([FromBody] Athlete body)
    {
        if (!await _db.Teams.AnyAsync(t => t.TeamId == body.TeamId))
            return BadRequest(new { message = "Team does not exist." });
        if (!TeamAccess.IsSuperAdmin(User) && body.TeamId != User.GetTeamId())
            return Forbid();
        body.AthleteId = 0;
        var entity = new Athlete
        {
            TeamId = body.TeamId,
            FirstName = body.FirstName.Trim(),
            LastName = body.LastName.Trim(),
            DateOfBirth = body.DateOfBirth,
            Position = string.IsNullOrWhiteSpace(body.Position) ? null : body.Position.Trim(),
        };
        if (string.IsNullOrWhiteSpace(entity.FirstName) || string.IsNullOrWhiteSpace(entity.LastName))
            return BadRequest(new { message = "First and last name are required." });
        _db.Athletes.Add(entity);
        await _db.SaveChangesAsync();
        var created = await RowDto(entity.AthleteId);
        return CreatedAtAction(nameof(GetById), new { id = entity.AthleteId }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<IActionResult> Update(int id, [FromBody] Athlete body)
    {
        if (id != body.AthleteId) return BadRequest();
        var row = await _db.Athletes.FirstOrDefaultAsync(a => a.AthleteId == id);
        if (row == null) return NotFound();
        if (!await _db.Teams.AnyAsync(t => t.TeamId == body.TeamId))
            return BadRequest(new { message = "Team does not exist." });
        if (TeamAccess.IsSuperAdmin(User))
        {
            // ok any team
        }
        else if (TeamAccess.IsTeamAdmin(User))
        {
            var tid = User.GetTeamId();
            if (tid != row.TeamId || body.TeamId != tid)
                return Forbid();
        }
        else return Forbid();

        row.TeamId = body.TeamId;
        row.FirstName = body.FirstName.Trim();
        row.LastName = body.LastName.Trim();
        row.DateOfBirth = body.DateOfBirth;
        row.Position = string.IsNullOrWhiteSpace(body.Position) ? null : body.Position.Trim();
        if (string.IsNullOrWhiteSpace(row.FirstName) || string.IsNullOrWhiteSpace(row.LastName))
            return BadRequest(new { message = "First and last name are required." });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.TeamAdmin}")]
    public async Task<IActionResult> Delete(int id)
    {
        var row = await _db.Athletes.FirstOrDefaultAsync(a => a.AthleteId == id);
        if (row == null) return NotFound();
        if (!TeamAccess.CanManageTeam(User, row.TeamId)) return Forbid();
        _db.Athletes.Remove(row);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<AthleteRowDto?> RowDto(int athleteId) =>
        await _db.Athletes.AsNoTracking()
            .Include(a => a.Team)
            .Where(a => a.AthleteId == athleteId)
            .Select(a => new AthleteRowDto
            {
                AthleteId = a.AthleteId,
                TeamId = a.TeamId,
                TeamName = a.Team.TeamName,
                FirstName = a.FirstName,
                LastName = a.LastName,
                DateOfBirth = a.DateOfBirth,
                Position = a.Position,
            })
            .FirstOrDefaultAsync();
}
