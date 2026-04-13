const apiBase = "";

async function loadTeams() {
    const el = document.getElementById("teamsList");
    const err = document.getElementById("listError");
    err.textContent = "";
    try {
        const teams = await apiJson(`${apiBase}/api/teams`);
        if (!teams.length) {
            el.innerHTML = "<p class='muted'>No teams yet.</p>";
            return;
        }
        el.innerHTML = `
<table>
  <thead><tr><th>ID</th><th>Name</th><th>Coach</th><th></th></tr></thead>
  <tbody>
    ${teams
        .map(
            (t) => `<tr data-id="${t.teamId}">
      <td>${t.teamId}</td>
      <td>${escapeHtml(t.teamName)}</td>
      <td>${escapeHtml(t.coachName ?? "")}</td>
      <td>
        <button type="button" class="secondary" data-edit="${t.teamId}">Edit</button>
        <button type="button" class="danger" data-del="${t.teamId}">Delete</button>
      </td>
    </tr>`
        )
        .join("")}
  </tbody>
</table>`;
        el.querySelectorAll("[data-edit]").forEach((b) =>
            b.addEventListener("click", () => startEdit(Number(b.getAttribute("data-edit"))))
        );
        el.querySelectorAll("[data-del]").forEach((b) =>
            b.addEventListener("click", () => removeTeam(Number(b.getAttribute("data-del"))))
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
    const t = await apiJson(`${apiBase}/api/teams/${id}`);
    document.getElementById("teamId").value = t.teamId;
    document.getElementById("teamName").value = t.teamName;
    document.getElementById("coachName").value = t.coachName ?? "";
    document.getElementById("formTitle").textContent = "Edit team";
    document.getElementById("formError").textContent = "";
}

function resetForm() {
    document.getElementById("teamId").value = "";
    document.getElementById("teamName").value = "";
    document.getElementById("coachName").value = "";
    document.getElementById("formTitle").textContent = "New team";
    document.getElementById("formError").textContent = "";
}

async function removeTeam(id) {
    if (!confirm("Delete team #" + id + "?")) return;
    try {
        await apiJson(`${apiBase}/api/teams/${id}`, { method: "DELETE" });
        await loadTeams();
        resetForm();
    } catch (e) {
        document.getElementById("listError").textContent = "Error: " + e.message;
    }
}

document.getElementById("teamForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("formError");
    err.textContent = "";
    const id = document.getElementById("teamId").value;
    const body = {
        teamName: document.getElementById("teamName").value.trim(),
        coachName: document.getElementById("coachName").value.trim() || null,
    };
    if (!body.teamName) {
        err.textContent = "Team name is required.";
        return;
    }
    try {
        if (id) {
            body.teamId = Number(id);
            await apiJson(`${apiBase}/api/teams/${id}`, {
                method: "PUT",
                body: JSON.stringify(body),
            });
        } else {
            await apiJson(`${apiBase}/api/teams`, {
                method: "POST",
                body: JSON.stringify(body),
            });
        }
        await loadTeams();
        resetForm();
    } catch (e2) {
        err.textContent = "Error: " + e2.message;
    }
});

document.getElementById("btnReset").addEventListener("click", resetForm);

loadTeams();
