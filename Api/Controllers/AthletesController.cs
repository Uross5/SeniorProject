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

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Athlete>>> GetAll([FromQuery] int? teamId)
    {
        IQueryable<Athlete> query = _db.Athletes.AsNoTracking().OrderBy(a => a.AthleteId);
        if (teamId.HasValue && teamId.Value > 0)
        {
            query = query.Where(a => a.TeamId == teamId.Value);
        }
        return await query.ToListAsync();
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<Athlete>> GetById(int id)
    {
        var row = await _db.Athletes.AsNoTracking().FirstOrDefaultAsync(a => a.AthleteId == id);
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.SuperAdmin)]
    public async Task<ActionResult<Athlete>> Create([FromBody] Athlete body)
    {
        _db.Athletes.Add(body);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = body.AthleteId }, body);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.SuperAdmin)]
    public async Task<IActionResult> Update(int id, [FromBody] Athlete body)
    {
        if (id != body.AthleteId) return BadRequest();
        _db.Athletes.Update(body);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.SuperAdmin)]
    public async Task<IActionResult> Delete(int id)
    {
        var row = await _db.Athletes.FindAsync(id);
        if (row == null) return NotFound();
        _db.Athletes.Remove(row);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
