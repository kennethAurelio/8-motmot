const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

(function () {
  const start = new Date(2026, 2, 11);
  const now = new Date();
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    now.getMonth() -
    start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  months = Math.max(0, months);
  const anchor = new Date(
    start.getFullYear(),
    start.getMonth() + months,
    start.getDate(),
  );
  const days = Math.max(0, Math.round((day(now) - day(anchor)) / 864e5));
  const total = Math.max(0, Math.round((day(now) - day(start)) / 864e5));
  const vals = { cm: months, cd: days, ct: total };
  for (const id in vals) {
    const el = $(id);
    if (reduce) {
      el.textContent = vals[id];
      continue;
    }
    const t0 = performance.now(),
      end = vals[id];
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
})();

/* ---------- reveal on scroll + active nav ---------- */
document
  .querySelectorAll(
    "section h2, section .eyebrow, .vid, .note-hand, .rail-ui, #env, .hint",
  )
  .forEach((el) => el.classList.add("in"));
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
document.querySelectorAll(".in").forEach((el) => io.observe(el));

const links = [...document.querySelectorAll(".nav ul a")];
const so = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting)
        links.forEach((a) =>
          a.classList.toggle(
            "on",
            a.getAttribute("href") === "#" + e.target.id,
          ),
        );
    }),
  { rootMargin: "-45% 0px -50% 0px" },
);
document.querySelectorAll("main section[id]").forEach((s) => so.observe(s));

/* ---------- sticker hearts ---------- */
const colors = ["#f6d94e", "#efc4cb", "#3d6894"];
document.querySelectorAll(".stk").forEach((b) =>
  b.addEventListener("click", () => {
    if (reduce) return;
    const r = b.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("span");
      s.className = "pop";
      s.textContent = i % 3 === 0 ? "✦" : "♥";
      s.style.color = colors[i % 3];
      s.style.left = r.left + r.width / 2 + "px";
      s.style.top = r.top + r.height / 2 + "px";
      document.body.appendChild(s);
      const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.4,
        d = 60 + Math.random() * 60;
      s.animate(
        [
          { transform: "translate(-50%,-50%) scale(.4)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 30}px)) scale(1.2)`,
            opacity: 0,
          },
        ],
        { duration: 900, easing: "cubic-bezier(.2,.7,.2,1)" },
      ).onfinish = () => s.remove();
    }
  }),
);

/* ---------- video: loads only when you get near it ---------- */
(function () {
  const wrap = $("vid"),
    clip = $("clip"),
    btn = $("playbtn");
  const src = clip.querySelector("source");
  let loaded = false;

  src.addEventListener("error", () => wrap.classList.add("empty"));
  clip.addEventListener("error", () => wrap.classList.add("empty"));
  clip.addEventListener("loadedmetadata", () => {
    if (!clip.videoWidth) return;
    const tall = clip.videoHeight >= clip.videoWidth;
    wrap.classList.toggle("wide", !tall);
    wrap.style.aspectRatio = clip.videoWidth + " / " + clip.videoHeight;
  });
  clip.addEventListener("play", () => wrap.classList.add("playing"));
  clip.addEventListener("pause", () => wrap.classList.remove("playing"));

  const load = () => {
    if (!loaded) {
      loaded = true;
      clip.preload = "auto";
      clip.load();
    }
  };
  const play = () => {
    load();
    const p = clip.play();
    if (p) p.catch(() => {});
  };
  let userPaused = false;

  // start downloading a little before the section scrolls into view
  new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) load();
      }),
    { rootMargin: "600px 0px" },
  ).observe(wrap);
  // autoplay while visible
  new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (wrap.classList.contains("empty")) return;
        if (e.isIntersecting && !reduce && !userPaused) play();
        else if (!e.isIntersecting) clip.pause();
      }),
    { threshold: 0.5 },
  ).observe(wrap);

  const toggle = () => {
    if (clip.paused) {
      userPaused = false;
      play();
    } else {
      userPaused = true;
      clip.pause();
    }
  };
  btn.addEventListener("click", toggle);
  clip.addEventListener("click", toggle);
})();

/* ---------- gallery rail ---------- */
const rail = $("rail"),
  fill = $("barfill");
const figs = [...rail.querySelectorAll(".pol")];
const updateBar = () => {
  const max = rail.scrollWidth - rail.clientWidth;
  const frac = rail.clientWidth / rail.scrollWidth;
  fill.style.width = Math.max(12, frac * 100) + "%";
  fill.style.marginLeft =
    max > 0
      ? (rail.scrollLeft / max) * (100 - Math.max(12, frac * 100)) + "%"
      : "0";
};
rail.addEventListener("scroll", updateBar, { passive: true });
window.addEventListener("resize", updateBar);
updateBar();
const slide = (dir) =>
  rail.scrollBy({
    left: dir * rail.clientWidth * 0.8,
    behavior: reduce ? "auto" : "smooth",
  });
$("prev").addEventListener("click", () => slide(-1));
$("next").addEventListener("click", () => slide(1));
rail.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    slide(1);
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    slide(-1);
  }
});

// mouse drag to scroll
let down = false,
  sx = 0,
  sl = 0,
  moved = 0;
rail.addEventListener("pointerdown", (e) => {
  moved = 0;
  if (e.pointerType !== "mouse") return;
  down = true;
  sx = e.clientX;
  sl = rail.scrollLeft;
});
window.addEventListener("pointermove", (e) => {
  if (!down) return;
  const dx = e.clientX - sx;
  moved = Math.max(moved, Math.abs(dx));
  if (moved > 6) {
    rail.classList.add("drag");
    rail.scrollLeft = sl - dx;
  }
});
window.addEventListener("pointerup", () => {
  down = false;
  setTimeout(() => rail.classList.remove("drag"), 0);
});

/* ---------- photo viewer ---------- */
const lb = $("lb"),
  lbimg = $("lbimg"),
  lbcap = $("lbcap");
let cur = 0;
const show = (i) => {
  cur = (i + figs.length) % figs.length;
  const img = figs[cur].querySelector("img");
  lbimg.src = img.src;
  lbimg.alt = img.alt;
  lbcap.textContent = figs[cur].querySelector("figcaption").textContent;
  lb.hidden = false;
};
const closeLb = () => {
  lb.hidden = true;
};
figs.forEach((f, i) =>
  f.addEventListener("click", () => {
    if (moved <= 6) show(i);
  }),
);
$("lbx").addEventListener("click", closeLb);
$("lbp").addEventListener("click", (e) => {
  e.stopPropagation();
  show(cur - 1);
});
$("lbnx").addEventListener("click", (e) => {
  e.stopPropagation();
  show(cur + 1);
});
lb.addEventListener("click", (e) => {
  if (e.target === lb || e.target === lbimg) closeLb();
});
document.addEventListener("keydown", (e) => {
  if (lb.hidden) return;
  if (e.key === "Escape") closeLb();
  if (e.key === "ArrowRight") show(cur + 1);
  if (e.key === "ArrowLeft") show(cur - 1);
});

/* ---------- envelope ---------- */
const env = $("env"),
  stage = env.closest(".stage"),
  letter = $("letter-paper"),
  hint = $("hint");
let natural = 0;
function applySize() {
  const h = Math.max(
    190,
    Math.min(natural, Math.round(window.innerHeight * 0.78)),
  );
  stage.style.setProperty("--lh", h + "px");
}
env.addEventListener("click", () => {
  const opening = !env.classList.contains("open");
  if (opening) {
    natural = letter.scrollHeight;
    applySize();
  }
  env.classList.toggle("open", opening);
  stage.classList.toggle("open", opening);
  env.setAttribute("aria-expanded", opening);
  env.setAttribute(
    "aria-label",
    opening ? "Close the envelope" : "Open the envelope",
  );
  hint.textContent = opening
    ? "Tap the envelope again to close"
    : "Tap the envelope";
  if (opening)
    setTimeout(
      () =>
        letter.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "center",
        }),
      900,
    );
});
letter.addEventListener("click", (e) => {
  if (env.classList.contains("open")) e.stopPropagation();
});
window.addEventListener("resize", () => {
  if (env.classList.contains("open")) applySize();
});
