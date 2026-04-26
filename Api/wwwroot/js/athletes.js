const apiBase = "";

let teamsCache = [];

function applyAthletesUi() {
    const panel = document.getElementById("athleteFormPanel");
    if (!panel) return;
    panel.style.display = canEditAthletes() ? "block" : "none";
    const wrap = document.getElementById("teamFieldWrap");
    const sel = document.getElementById("teamId");
    const fixed = document.getElementById("teamIdFixed");
    if (!wrap || !sel || !fixed) return;
    if (isTeamAdmin()) {
        wrap.style.display = "none";
        fixed.value = String(getUser().teamId ?? "");
    } else {
        wrap.style.display = "block";
        fixed.value = "";
    }
}

function currentTeamIdForSave() {
    if (isTeamAdmin()) return Number(document.getElementById("teamIdFixed").value);
    const v = document.getElementById("teamId").value;
    return v ? Number(v) : NaN;
}

async function loadTeamsForForm() {
    const sel = document.getElementById("teamId");
    if (!sel || isTeamAdmin()) return;
    teamsCache = await apiJson(`${apiBase}/api/teams`);
    sel.innerHTML = teamsCache
        .map((t) => `<option value="${t.teamId}">${escapeHtml(t.teamName)}</option>`)
        .join("");
}

async function loadAthletes() {
    const el = document.getElementById("athletesList");
    const err = document.getElementById("listError");
    err.textContent = "";
    try {
        const rows = await apiJson(`${apiBase}/api/athletes`);
        if (!rows.length) {
            el.innerHTML = "<p class='muted'>No athletes yet.</p>";
            return;
        }
        el.innerHTML = `
<table>
  <thead><tr><th>ID</th><th>Team</th><th>First name</th><th>Last name</th><th>DOB</th><th>Position</th><th></th></tr></thead>
  <tbody>
    ${rows
        .map((a) => {
            const showActions = canEditAthleteRow(a.teamId);
            const actions = showActions
                ? `<button type="button" class="secondary" data-edit="${a.athleteId}">Edit</button>
        <button type="button" class="danger" data-del="${a.athleteId}">Delete</button>`
                : "";
            return `<tr data-team-id="${a.teamId}">
      <td>${a.athleteId}</td>
      <td>${escapeHtml(a.teamName)}</td>
      <td>${escapeHtml(a.firstName)}</td>
      <td>${escapeHtml(a.lastName)}</td>
      <td>${a.dateOfBirth ? escapeHtml(String(a.dateOfBirth).slice(0, 10)) : ""}</td>
      <td>${escapeHtml(a.position ?? "")}</td>
      <td>${actions}</td>
    </tr>`;
        })
        .join("")}
  </tbody>
</table>`;
        el.querySelectorAll("[data-edit]").forEach((b) =>
            b.addEventListener("click", () => startEdit(Number(b.getAttribute("data-edit"))))
        );
        el.querySelectorAll("[data-del]").forEach((b) =>
            b.addEventListener("click", () => removeAthlete(Number(b.getAttribute("data-del"))))
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

async function startEdit(id) {
    const a = await apiJson(`${apiBase}/api/athletes/${id}`);
    document.getElementById("athleteId").value = a.athleteId;
    document.getElementById("firstName").value = a.firstName;
    document.getElementById("lastName").value = a.lastName;
    document.getElementById("dateOfBirth").value = a.dateOfBirth
        ? String(a.dateOfBirth).slice(0, 10)
        : "";
    document.getElementById("position").value = a.position ?? "";
    if (isSuperAdmin()) {
        await loadTeamsForForm();
        document.getElementById("teamId").value = String(a.teamId);
    }
    document.getElementById("formTitle").textContent = "Edit athlete";
    document.getElementById("formError").textContent = "";
}

function resetForm() {
    document.getElementById("athleteId").value = "";
    document.getElementById("firstName").value = "";
    document.getElementById("lastName").value = "";
    document.getElementById("dateOfBirth").value = "";
    document.getElementById("position").value = "";
    document.getElementById("formTitle").textContent = "New athlete";
    document.getElementById("formError").textContent = "";
    if (isSuperAdmin() && teamsCache.length) {
        document.getElementById("teamId").value = String(teamsCache[0].teamId);
    }
}

async function removeAthlete(id) {
    if (!confirm("Delete athlete #" + id + "?")) return;
    try {
        await apiJson(`${apiBase}/api/athletes/${id}`, { method: "DELETE" });
        await loadAthletes();
        resetForm();
    } catch (e) {
        document.getElementById("listError").textContent = "Error: " + e.message;
    }
}

document.getElementById("athleteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("formError");
    err.textContent = "";
    if (!canEditAthletes()) {
        err.textContent = "You are not allowed to change athletes.";
        return;
    }
    const id = document.getElementById("athleteId").value;
    const dob = document.getElementById("dateOfBirth").value;
    const tid = currentTeamIdForSave();
    if (!Number.isFinite(tid)) {
        err.textContent = "Pick a team.";
        return;
    }
    const body = {
        teamId: tid,
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        dateOfBirth: dob || null,
        position: document.getElementById("position").value.trim() || null,
    };
    if (!body.firstName || !body.lastName) {
        err.textContent = "First name and last name are required.";
        return;
    }
    try {
        if (id) {
            body.athleteId = Number(id);
            await apiJson(`${apiBase}/api/athletes/${id}`, {
                method: "PUT",
                body: JSON.stringify(body),
            });
        } else {
            await apiJson(`${apiBase}/api/athletes`, {
                method: "POST",
                body: JSON.stringify(body),
            });
        }
        await loadAthletes();
        resetForm();
    } catch (e2) {
        err.textContent = "Error: " + e2.message;
    }
});

document.getElementById("btnReset").addEventListener("click", resetForm);

document.addEventListener("DOMContentLoaded", async () => {
    applyAthletesUi();
    if (isSuperAdmin()) await loadTeamsForForm();
    await loadAthletes();
});
