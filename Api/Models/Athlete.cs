namespace Agppa.Api.Models;

public class Athlete
{
    public int AthleteId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public int? TeamId { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Position { get; set; }
}
