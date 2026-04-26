using System.Security.Claims;

namespace Agppa.Api.Auth;

public static class AuthExtensions
{
    public static int? GetTeamId(this ClaimsPrincipal user)
    {
        var v = user.FindFirst("team_id")?.Value;
        return int.TryParse(v, out var id) ? id : null;
    }

    public static int GetUserId(this ClaimsPrincipal user)
    {
        var v = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(v, out var id))
            throw new InvalidOperationException("Missing user id claim.");
        return id;
    }
}
