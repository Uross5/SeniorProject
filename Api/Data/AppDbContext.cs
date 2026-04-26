using Agppa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Agppa.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Athlete> Athletes => Set<Athlete>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<AthleteGameStat> AthleteGameStats => Set<AthleteGameStat>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasOne(u => u.Team)
                .WithMany()
                .HasForeignKey(u => u.TeamId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Athlete>(e =>
        {
            e.HasOne(a => a.Team)
                .WithMany(t => t.Athletes)
                .HasForeignKey(a => a.TeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Game>(e =>
        {
            e.HasOne(g => g.HomeTeam)
                .WithMany()
                .HasForeignKey(g => g.HomeTeamId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(g => g.AwayTeam)
                .WithMany()
                .HasForeignKey(g => g.AwayTeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AthleteGameStat>(e =>
        {
            e.HasIndex(s => new { s.GameId, s.AthleteId }).IsUnique();
            e.HasOne(s => s.Game)
                .WithMany(g => g.AthleteStats)
                .HasForeignKey(s => s.GameId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Athlete)
                .WithMany(a => a.GameStats)
                .HasForeignKey(s => s.AthleteId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
