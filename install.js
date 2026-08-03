(() => {
  const token = localStorage.getItem("rsrSession") || sessionStorage.getItem("rsrSession");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("rsrUser") || sessionStorage.getItem("rsrUser") || "null");
  } catch {}

  function applyAccountState() {
    document.querySelectorAll("[data-guest-only]").forEach(el => {
      el.classList.toggle("hidden", Boolean(token));
    });
    document.querySelectorAll("[data-auth-only]").forEach(el => {
      el.classList.toggle("hidden", !token);
    });

    const accountLinks = document.querySelectorAll("#accountLink,[data-account-link]");
    accountLinks.forEach(link => {
      link.href = token ? "dashboard.html" : "auth.html";
      link.textContent = token ? "My Account" : "Login / Register";
    });

    document.querySelectorAll("[data-create-account]").forEach(link => {
      if (token) {
        link.href = "dashboard.html";
        link.textContent = user?.fullName ? `${user.fullName}'s Dashboard` : "Open My Dashboard";
        link.classList.add("authenticated-cta");
      } else {
        link.href = "auth.html";
        link.textContent = "Create Account";
      }
    });

    document.body.classList.toggle("customer-authenticated", Boolean(token));
  }

  async function verifySession() {
    if (!token) return applyAccountState();
    try {
      const response = await fetch("/api/customer/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (response.status === 401) {
        localStorage.removeItem("rsrSession");
        localStorage.removeItem("rsrUser");
        sessionStorage.removeItem("rsrSession");
        sessionStorage.removeItem("rsrUser");
        location.reload();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        user = data.user || data;
        const storage = localStorage.getItem("rsrSession") ? localStorage : sessionStorage;
        storage.setItem("rsrUser", JSON.stringify(user));
      }
    } catch {
      // Keep the current account display while the server is waking up.
    }
    applyAccountState();
  }

  document.addEventListener("DOMContentLoaded", verifySession);
})();