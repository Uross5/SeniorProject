using Agppa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Athlete> Athletes => Set<Athlete>();
}
