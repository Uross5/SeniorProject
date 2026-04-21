const apiBase = "";

async function loadUsers() {
    const el = document.getElementById("usersList");
    const err = document.getElementById("listError");
    err.textContent = "";
    try {
        const rows = await apiJson(`${apiBase}/api/users`);
        if (!rows.length) {
            el.innerHTML = "<p class='muted'>No users yet.</p>";
            return;
        }
        el.innerHTML = `
<table>
  <thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Team</th><th></th></tr></thead>
  <tbody>
    ${rows
        .map(
            (u) => `<tr>
      <td>${u.userId}</td>
      <td>${escapeHtml(String(u.username))}</td>
      <td>${escapeHtml(String(u.role))}</td>
      <td>${u.teamId != null ? u.teamId : "—"}</td>
      <td>${
          u.role === "SuperAdmin"
              ? "—"
              : `<button type="button" class="danger" data-del="${u.userId}">Delete</button>`
      }</td>
    </tr>`
        )
        .join("")}
  </tbody>
</table>`;
        el.querySelectorAll("[data-del]").forEach((b) =>
            b.addEventListener("click", () => removeUser(Number(b.getAttribute("data-del"))))
        );
    } catch (e) {
        err.textContent = "Error: " + e.message;
        el.innerHTML = "";
    }
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function removeUser(id) {
    if (!confirm("Delete user #" + id + "?")) return;
    try {
        await apiJson(`${apiBase}/api/users/${id}`, { method: "DELETE" });
        await loadUsers();
    } catch (e) {
        document.getElementById("listError").textContent = "Error: " + e.message;
    }
}

async function loadTeamOptions() {
    const sel = document.getElementById("newTeamIdSelect");
    const teams = await apiJson(`${apiBase}/api/teams`);
    sel.innerHTML =
        '<option value="">— select a team —</option>' +
        teams.map((t) => `<option value="${t.teamId}">${escapeHtml(t.teamName)}</option>`).join("");
}

function syncTeamFieldVisibility() {
    const show = document.getElementById("newRole").value === "TeamAdmin";
    const wrap = document.getElementById("teamSelectWrap");
    if (wrap) wrap.style.display = show ? "block" : "none";
}

document.getElementById("newRole").addEventListener("change", syncTeamFieldVisibility);

document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("userFormError");
    err.textContent = "";
    const role = document.getElementById("newRole").value;
    const teamRaw = document.getElementById("newTeamIdSelect").value;
    const teamId = teamRaw ? Number(teamRaw) : null;
    const body = {
        username: document.getElementById("newUsername").value.trim(),
        password: document.getElementById("newPassword").value,
        role,
        teamId: role === "TeamAdmin" ? teamId : null,
        email: document.getElementById("newEmail").value.trim() || null,
    };
    if (role === "TeamAdmin" && (body.teamId == null || Number.isNaN(body.teamId))) {
        err.textContent = "Select a team for the team admin.";
        return;
    }
    try {
        await apiJson(`${apiBase}/api/users`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        document.getElementById("userForm").reset();
        await loadTeamOptions();
        syncTeamFieldVisibility();
        await loadUsers();
    } catch (e2) {
        err.textContent = String(e2.message);
    }
});

async function init() {
    const gate = document.getElementById("usersGate");
    const gateErr = document.getElementById("gateError");
    if (!getAccessToken() || !isSuperAdmin()) {
        gateErr.textContent = "Super admin only. Sign in as admin.";
        document.getElementById("usersPanel").style.display = "none";
        document.getElementById("usersListPanel").style.display = "none";
        return;
    }
    gate.style.display = "none";
    document.getElementById("usersPanel").style.display = "block";
    document.getElementById("usersListPanel").style.display = "block";
    try {
        await loadTeamOptions();
    } catch {
        document.getElementById("userFormError").textContent = "Could not load teams.";
    }
    syncTeamFieldVisibility();
    loadUsers();
}

document.addEventListener("DOMContentLoaded", init);
