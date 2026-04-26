using Agppa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Data;

public static class DbSeeder
{
    public static async Task SeedSuperAdminAsync(AppDbContext db, IConfiguration cfg, ILogger logger)
    {
        if (await db.Users.AnyAsync(u => u.Role == AppRoles.SuperAdmin))
            return;

        var section = cfg.GetSection("SuperAdmin");
        var username = section["Username"] ?? "admin";
        var password = section["Password"] ?? "Admin123!";

        db.Users.Add(new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = AppRoles.SuperAdmin,
            TeamId = null,
        });
        await db.SaveChangesAsync();
        logger.LogInformation("Created super admin '{Username}'. Change the password in production.", username);
    }
}
