using Agppa.Api.Data;
using Agppa.Api.Models;
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
    public async Task<ActionResult<IEnumerable<Athlete>>> GetAll() =>
        await _db.Athletes.AsNoTracking().OrderBy(a => a.AthleteId).ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Athlete>> GetById(int id)
    {
        var row = await _db.Athletes.AsNoTracking().FirstOrDefaultAsync(a => a.AthleteId == id);
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public async Task<ActionResult<Athlete>> Create([FromBody] Athlete body)
    {
        _db.Athletes.Add(body);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = body.AthleteId }, body);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Athlete body)
    {
        if (id != body.AthleteId) return BadRequest();
        _db.Athletes.Update(body);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var row = await _db.Athletes.FindAsync(id);
        if (row == null) return NotFound();
        _db.Athletes.Remove(row);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
