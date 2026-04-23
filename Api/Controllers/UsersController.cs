using System.ComponentModel.DataAnnotations;
using Agppa.Api.Auth;
using Agppa.Api.Data;
using Agppa.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.SuperAdmin)]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    public class UserListItem
    {
        public int UserId { get; set; }
        public string Username { get; set; } = "";
        public string Role { get; set; } = "";
        public int? TeamId { get; set; }
        public string? Email { get; set; }
    }

    public class CreateUserRequest
    {
        [Required, MaxLength(50)]
        public string Username { get; set; } = "";

        [Required, MinLength(6), MaxLength(100)]
        public string Password { get; set; } = "";

        /// <summary>TeamAdmin or User.</summary>
        [Required]
        [RegularExpression("^(TeamAdmin|User)$")]
        public string Role { get; set; } = "";

        /// <summary>Required for TeamAdmin.</summary>
        public int? TeamId { get; set; }

        [MaxLength(100)]
        public string? Email { get; set; }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItem>>> GetAll()
    {
        var rows = await _db.Users.AsNoTracking()
            .OrderBy(u => u.UserId)
            .Select(u => new UserListItem
            {
                UserId = u.UserId,
                Username = u.Username,
                Role = u.Role,
                TeamId = u.TeamId,
                Email = u.Email,
            })
            .ToListAsync();
        return Ok(rows);
    }

    [HttpPost]
    public async Task<ActionResult<UserListItem>> Create([FromBody] CreateUserRequest body)
    {
        if (body.Role == AppRoles.TeamAdmin)
        {
            if (body.TeamId is not int tid)
                return BadRequest(new { message = "Team admin requires a valid teamId." });
            if (!await _db.Teams.AnyAsync(t => t.TeamId == tid))
                return BadRequest(new { message = "Team does not exist." });
        }
        else if (body.TeamId.HasValue)
            return BadRequest(new { message = "Viewer accounts cannot have teamId." });

        if (await _db.Users.AnyAsync(u => u.Username == body.Username))
            return Conflict(new { message = "Username is already taken." });

        var user = new User
        {
            Username = body.Username.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(body.Password),
            Role = body.Role,
            Email = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email.Trim(),
            TeamId = body.Role == AppRoles.TeamAdmin ? body.TeamId : null,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new UserListItem
        {
            UserId = user.UserId,
            Username = user.Username,
            Role = user.Role,
            TeamId = user.TeamId,
            Email = user.Email,
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var currentId = User.GetUserId();
        if (id == currentId)
            return BadRequest(new { message = "You cannot delete your own account." });

        var row = await _db.Users.FindAsync(id);
        if (row == null) return NotFound();
        if (row.Role == AppRoles.SuperAdmin)
            return BadRequest(new { message = "Super admin accounts cannot be deleted here." });

        _db.Users.Remove(row);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
