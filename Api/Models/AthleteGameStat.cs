namespace Agppa.Api.Models;

public class AthleteGameStat
{
    public int AthleteGameStatId { get; set; }
    public int GameId { get; set; }
    public Game Game { get; set; } = null!;
    public int AthleteId { get; set; }
    public Athlete Athlete { get; set; } = null!;
    public int Points { get; set; }
    public int Rebounds { get; set; }
    public int Assists { get; set; }
}
