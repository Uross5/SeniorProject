document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("regError");
    const ok = document.getElementById("regOk");
    err.textContent = "";
    ok.textContent = "";

    const username = document.getElementById("regUser").value.trim();
    const password = document.getElementById("regPass").value;
    const email = document.getElementById("regEmail").value.trim() || null;

    try {
        const data = await apiJson("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, password, email }),
        });
        setSession(data);
        ok.textContent = "Account created. Redirecting…";
        window.location.href = "/";
    } catch (ex) {
        err.textContent = String(ex.message);
    }
});