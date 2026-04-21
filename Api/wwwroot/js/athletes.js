const apiBase = "";

function applyAthletesUi() {
    const panel = document.getElementById("athleteFormPanel");
    if (!panel) return;
    panel.style.display = canEditAthletes() ? "block" : "none";
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
        const showActions = canEditAthletes();
        el.innerHTML = `
<table>
  <thead><tr><th>ID</th><th>First name</th><th>Last name</th><th>DOB</th><th>Position</th><th></th></tr></thead>
  <tbody>
    ${rows
        .map((a) => {
            const actions = showActions
                ? `<button type="button" class="secondary" data-edit="${a.athleteId}">Edit</button>
        <button type="button" class="danger" data-del="${a.athleteId}">Delete</button>`
                : "";
            return `<tr>
      <td>${a.athleteId}</td>
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
        if (showActions) {
            el.querySelectorAll("[data-edit]").forEach((b) =>
                b.addEventListener("click", () => startEdit(Number(b.getAttribute("data-edit"))))
            );
            el.querySelectorAll("[data-del]").forEach((b) =>
                b.addEventListener("click", () => removeAthlete(Number(b.getAttribute("data-del"))))
            );
        }
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
        err.textContent = "Only the super admin can change athletes.";
        return;
    }
    const id = document.getElementById("athleteId").value;
    const dob = document.getElementById("dateOfBirth").value;
    const body = {
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

document.addEventListener("DOMContentLoaded", () => {
    applyAthletesUi();
    loadAthletes();
});
