function apiAuthHeaders() {
    const t = localStorage.getItem("agppa_token");
    if (!t) return {};
    return { Authorization: "Bearer " + t };
}

async function apiJson(url, options = {}) {
    const init = { ...options };
    init.headers = { ...apiAuthHeaders(), ...init.headers };
    if (init.body && typeof init.body === "string") {
        init.headers = { "Content-Type": "application/json", ...init.headers };
    }
    const res = await fetch(url, init);
    if (res.status === 204) return null;
    const text = await res.text();
    let data = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }
    if (!res.ok) {
        const msg =
            (data && typeof data === "object" && (data.title || data.detail || data.message)) ||
            (typeof data === "string" ? data : null) ||
            res.statusText;
        throw new Error(String(msg));
    }
    return data;
}
