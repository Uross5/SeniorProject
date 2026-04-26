namespace Agppa.Api.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public string Secret { get; set; } = "";
    public int ExpiresMinutes { get; set; } = 43200; // 30 days
}
