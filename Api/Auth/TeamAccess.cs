using System.Security.Claims;
using Agppa.Api.Models;

namespace Agppa.Api.Auth;

public static class TeamAccess
{
    public static bool IsSuperAdmin(ClaimsPrincipal user) => user.IsInRole(AppRoles.SuperAdmin);

    public static bool IsTeamAdmin(ClaimsPrincipal user) => user.IsInRole(AppRoles.TeamAdmin);

    public static bool CanManageTeam(ClaimsPrincipal user, int teamId)
    {
        if (IsSuperAdmin(user)) return true;
        if (IsTeamAdmin(user))
        {
            var tid = user.GetTeamId();
            return tid == teamId;
        }
        return false;
    }

    public static bool CanManageGame(ClaimsPrincipal user, int homeTeamId, int awayTeamId)
    {
        if (IsSuperAdmin(user)) return true;
        if (IsTeamAdmin(user))
        {
            var tid = user.GetTeamId();
            return tid == homeTeamId || tid == awayTeamId;
        }
        return false;
    }
}
