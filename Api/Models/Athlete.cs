using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace Agppa.Api.Models;

public class Athlete
{
    public int AthleteId { get; set; }
    public int TeamId { get; set; }

    [ValidateNever]
    public Team Team { get; set; } = null!;

    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateOnly? DateOfBirth { get; set; }
    public string? Position { get; set; }

    [ValidateNever]
    public ICollection<AthleteGameStat> GameStats { get; set; } = new List<AthleteGameStat>();
}
