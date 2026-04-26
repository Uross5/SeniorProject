namespace Agppa.Api.Models;

public class User
{
    public int UserId { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = AppRoles.User;
    public string? Email { get; set; }
    /// <summary>Team this user administers; null for super admin and viewers.</summary>
    public int? TeamId { get; set; }
    public Team? Team { get; set; }
}
