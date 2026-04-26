namespace Agppa.Api.Models;

public class Team
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = "";
    public string? CoachName { get; set; }
    public ICollection<Athlete> Athletes { get; set; } = new List<Athlete>();
}
