using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Agppa.Api.Data;
using Agppa.Api.Models;
using Agppa.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _tokens;

    public AuthController(AppDbContext db, JwtTokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    public class LoginRequest
    {
        [Required, MaxLength(50)]
        public string Username { get; set; } = "";

        [Required, MinLength(1)]
        public string Password { get; set; } = "";
    }

    public class RegisterRequest
    {
        [Required, MaxLength(50)]
        public string Username { get; set; } = "";

        [Required, MinLength(6), MaxLength(100)]
        public string Password { get; set; } = "";

        [MaxLength(100)]
        public string? Email { get; set; }
    }

    public class AuthResponse
    {
        public string Token { get; set; } = "";
        public string Username { get; set; } = "";
        public string Role { get; set; } = "";
        public int? TeamId { get; set; }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest body)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == body.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(body.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password." });

        return Ok(ToAuth(user));
    }

    /// <summary>Self-registration for viewer (User) role only.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest body)
    {
        if (await _db.Users.AnyAsync(u => u.Username == body.Username))
            return Conflict(new { message = "Username is already taken." });

        var user = new User
        {
            Username = body.Username.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(body.Password),
            Role = AppRoles.User,
            Email = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email.Trim(),
            TeamId = null,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(ToAuth(user));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (sub == null || !int.TryParse(sub, out var id)) return Unauthorized();
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == id);
        return user == null ? Unauthorized() : Ok(ToAuth(user));
    }

    private AuthResponse ToAuth(User user) => new()
    {
        Token = _tokens.CreateToken(user),
        Username = user.Username,
        Role = user.Role,
        TeamId = user.TeamId,
    };
}
