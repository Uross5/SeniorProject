const AGPPA_TOKEN_KEY = "agppa_token";
const AGPPA_USER_KEY = "agppa_user";

function setSession(payload) {
    localStorage.setItem(AGPPA_TOKEN_KEY, payload.token);
    localStorage.setItem(
        AGPPA_USER_KEY,
        JSON.stringify({
            username: payload.username,
            role: payload.role,
            teamId: payload.teamId ?? null,
        })
    );
}

function clearSession() {
    localStorage.removeItem(AGPPA_TOKEN_KEY);
    localStorage.removeItem(AGPPA_USER_KEY);
}

function getAccessToken() {
    return localStorage.getItem(AGPPA_TOKEN_KEY);
}

function getUser() {
    const raw = localStorage.getItem(AGPPA_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function isSuperAdmin() {
    const u = getUser();
    return u && u.role === "SuperAdmin";
}

function isTeamAdmin() {
    const u = getUser();
    return u && u.role === "TeamAdmin";
}

function canEditAthletes() {
    return isSuperAdmin();
}

function canCreateGame() {
    return isSuperAdmin();
}

function canCreateTeam() {
    return isSuperAdmin();
}

function canEditTeamRow(teamId) {
    if (isSuperAdmin()) return true;
    if (isTeamAdmin()) {
        const u = getUser();
        return u.teamId != null && Number(u.teamId) === Number(teamId);
    }
    return false;
}

function isViewerOnly() {
    const u = getUser();
    return !u || u.role === "User";
}

function escapeHtmlNav(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderNavAuth() {
    const el = document.getElementById("navAuth");
    if (!el) return;
    const t = getAccessToken();
    const u = getUser();
    if (!t || !u) {
        el.innerHTML = '<a href="/login.html">Sign in</a>';
        return;
    }
    let extra = "";
    if (u.role === "SuperAdmin") {
        extra = '<a href="/users.html">Users</a>';
    }
    el.innerHTML =
        `${extra}<span class="nav-user">${escapeHtmlNav(u.username)} (${escapeHtmlNav(u.role)})</span> ` +
        '<a href="#" id="navLogout">Sign out</a>';
    const lo = document.getElementById("navLogout");
    if (lo) {
        lo.addEventListener("click", (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = "/";
        });
    }
}

document.addEventListener("DOMContentLoaded", renderNavAuth);
