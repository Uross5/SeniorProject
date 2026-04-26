namespace Agppa.Api.Models;

public class Game
{
    public int GameId { get; set; }
    public int HomeTeamId { get; set; }
    public Team HomeTeam { get; set; } = null!;
    public int AwayTeamId { get; set; }
    public Team AwayTeam { get; set; } = null!;
    public int HomeScore { get; set; }
    public int AwayScore { get; set; }
    public DateTime PlayedAt { get; set; }
    public ICollection<AthleteGameStat> AthleteStats { get; set; } = new List<AthleteGameStat>();
}
