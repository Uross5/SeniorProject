using Agppa.Api.Auth;
using Agppa.Api.Data;
using Agppa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeamsController(AppDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Team>>> GetAll() =>
        await _db.Teams.AsNoTracking().OrderBy(t => t.TeamId).ToListAsync();

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<Team>> GetById(int id)
    {
        var row = await _db.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.TeamId == id);
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.SuperAdmin)]
    public async Task<ActionResult<Team>> Create([FromBody] Team body)
    {
        _db.Teams.Add(body);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = body.TeamId }, body);
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] Team body)
    {
        if (id != body.TeamId) return BadRequest();
        if (!CanMutateTeam(User, id)) return Forbid();

        _db.Teams.Update(body);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        if (!CanMutateTeam(User, id)) return Forbid();

        var row = await _db.Teams.FindAsync(id);
        if (row == null) return NotFound();
        _db.Teams.Remove(row);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static bool CanMutateTeam(System.Security.Claims.ClaimsPrincipal user, int teamId)
    {
        if (user.IsInRole(AppRoles.SuperAdmin)) return true;
        if (user.IsInRole(AppRoles.TeamAdmin))
        {
            var tid = user.GetTeamId();
            return tid == teamId;
        }
        return false;
    }
}
