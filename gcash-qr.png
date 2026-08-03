
(() => {
  const YT_PATTERNS = [
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/watch\?[^#]*v=([A-Za-z0-9_-]{6,})/i,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i
  ];

  function youtubeId(url) {
    for (const pattern of YT_PATTERNS) {
      const match = String(url || "").match(pattern);
      if (match) return match[1];
    }
    return "";
  }

  function safeUrl(url) {
    try {
      const parsed = new URL(url, location.origin);
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
    } catch {
      return "";
    }
  }

  function renderTutorial(settings) {
    const tutorial = settings?.tutorial || {};
    const url = safeUrl(tutorial.videoUrl);
    const title = tutorial.title || "How to Create a Roblox Game Pass";
    const enabled = tutorial.enabled !== false && Boolean(url);
    const id = youtubeId(url);

    document.querySelectorAll("[data-tutorial-section]").forEach(el => {
      el.classList.toggle("hidden", !enabled);
    });
    document.querySelectorAll("[data-tutorial-title]").forEach(el => {
      el.textContent = title;
    });
    document.querySelectorAll("[data-tutorial-link]").forEach(el => {
      el.href = url || "tutorial.html";
    });

    document.querySelectorAll("[data-tutorial-frame]").forEach(frame => {
      if (!enabled) {
        frame.removeAttribute("src");
        return;
      }
      if (id) {
        frame.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
        frame.classList.remove("hidden");
      } else {
        frame.removeAttribute("src");
        frame.classList.add("hidden");
      }
    });

    document.querySelectorAll("[data-non-youtube-tutorial]").forEach(card => {
      card.classList.toggle("hidden", !enabled || Boolean(id));
    });
  }

  window.RSRTutorial = { renderTutorial };

  fetch("/api/settings")
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(renderTutorial)
    .catch(() => {});
})();
