const data = window.PORTFOLIO_DATA;

const state = {
  activeProject: null,
  lightboxItems: [],
  activeLightboxIndex: 0
};

const projectsIndex = document.getElementById("projectsIndex");
const projectOverlay = document.getElementById("projectOverlay");
const projectSheetInner = document.getElementById("projectSheetInner");
const projectClose = document.getElementById("projectClose");
const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightboxContent");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const navToggle = document.querySelector(".nav-toggle");
const siteHeader = document.querySelector(".site-header");
const homeHeroImage = document.getElementById("homeHeroImage");
const pageLoader = document.querySelector(".page-loader");

function encodePath(path) {
  return path
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
}

function getMediaType(filename) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image";

  return "unknown";
}

function getProjectThumb(project) {
  if (project.thumb) {
    return encodePath(`${project.folder}/${project.thumb}`);
  }

  const firstMedia = project.media && project.media.length ? project.media[0] : null;

  if (!firstMedia) return "";

  return encodePath(`${project.folder}/${firstMedia}`);
}

function getMediaPath(project, filename) {
  return encodePath(`${project.folder}/${filename}`);
}

function createPDFThumb() {
  const div = document.createElement("div");
  div.className = "pdf-thumb";
  return div;
}

function renderProjectsIndex() {
  if (!projectsIndex || !data || !Array.isArray(data.projects)) return;

  projectsIndex.innerHTML = "";

  data.projects.forEach(project => {
    const card = document.createElement("article");
    card.className = "project-card reveal";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open project ${project.title}`);

    const thumbPath = getProjectThumb(project);
    const previewSource = project.thumb || (project.media && project.media[0]) || "";
    const previewType = previewSource ? getMediaType(previewSource) : "unknown";

    const media = document.createElement("div");
    media.className = "project-card-media parallax";

    if (previewType === "image" && thumbPath) {
      const img = document.createElement("img");
      img.src = thumbPath;
      img.alt = `${project.title} thumbnail`;
      media.appendChild(img);
    } else if (previewType === "pdf") {
      media.appendChild(createPDFThumb());
    } else if (thumbPath) {
      const fallbackImg = document.createElement("img");
      fallbackImg.src = thumbPath;
      fallbackImg.alt = `${project.title} thumbnail`;
      media.appendChild(fallbackImg);
    } else {
      media.appendChild(createPDFThumb());
    }

    const body = document.createElement("div");
    body.className = "project-card-body";

    body.innerHTML = `
      <div>
        <div class="project-meta">
          <span class="project-number">${project.number}</span>
        </div>
        <h3 class="project-title">${project.title}</h3>
        <p class="project-description">${project.overview}</p>
      </div>
      <div class="project-cta">View Case Study</div>
    `;

    card.appendChild(media);
    card.appendChild(body);

    card.addEventListener("click", () => openProject(project.id));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProject(project.id);
      }
    });

    projectsIndex.appendChild(card);
  });

  setupReveal();
}

function renderProjectOverlay(project) {
  if (!projectSheetInner) return;

  const mediaItems = Array.isArray(project.media) ? project.media : [];
  const heroFile = mediaItems.length ? mediaItems[0] : null;
  const heroType = heroFile ? getMediaType(heroFile) : null;
  const heroPath = heroFile ? getMediaPath(project, heroFile) : "";

  let heroMediaHTML = "";

  if (heroType === "image") {
    heroMediaHTML = `<img src="${heroPath}" alt="${project.title} hero image" />`;
  } else if (heroType === "pdf") {
    heroMediaHTML = `
      <iframe
        class="project-hero-pdf"
        src="${heroPath}#view=FitH"
        title="${project.title} PDF"
      ></iframe>
    `;
  }

  let sequenceHTML = "";

  mediaItems.forEach((file, index) => {
    const type = getMediaType(file);
    const path = getMediaPath(project, file);

    if (type === "image") {
      sequenceHTML += `
        <figure
          class="project-media-item"
          data-lightbox-index="${index}"
          tabindex="0"
          role="button"
          aria-label="Open ${project.title} media ${index + 1} full screen"
        >
          <img src="${path}" alt="${project.title} image ${index + 1}" />
          <figcaption class="project-media-caption">Open Full Screen</figcaption>
        </figure>
      `;
    } else if (type === "pdf") {
      sequenceHTML += `
        <figure
          class="project-media-item pdf-item"
          data-lightbox-index="${index}"
          tabindex="0"
          role="button"
          aria-label="Open ${project.title} PDF ${index + 1} full screen"
        >
          <iframe
            src="${path}#view=FitH"
            title="${project.title} PDF ${index + 1}"
          ></iframe>
          <figcaption class="project-media-caption">Open Full Screen</figcaption>
        </figure>
      `;
    }
  });

  projectSheetInner.innerHTML = `
    <section class="project-detail">
      <div class="project-detail-hero">
        <div class="project-detail-hero-media">
          ${heroMediaHTML}
        </div>
        <div class="project-detail-hero-overlay"></div>

        <div class="project-detail-head">
          <p class="eyebrow">${project.number} Project</p>
          <h2 class="project-title-large">${project.title}</h2>
          <p class="project-overview">${project.overview}</p>
        </div>
      </div>

      <div class="project-detail-content">
        <div class="project-media-sequence">
          ${sequenceHTML}
        </div>
      </div>
    </section>
  `;

  const interactiveMedia = projectSheetInner.querySelectorAll("[data-lightbox-index]");

  interactiveMedia.forEach(item => {
    item.addEventListener("click", () => {
      const index = Number(item.getAttribute("data-lightbox-index"));
      openLightbox(project, index);
    });

    item.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const index = Number(item.getAttribute("data-lightbox-index"));
        openLightbox(project, index);
      }
    });
  });
}

function openProject(projectId) {
  const project = data.projects.find(item => item.id === projectId);

  if (!project || !projectOverlay) return;

  state.activeProject = project;
  renderProjectOverlay(project);

  projectOverlay.classList.add("active");
  projectOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("project-open");
}

function closeProject() {
  if (!projectOverlay) return;

  projectOverlay.classList.remove("active");
  projectOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("project-open");
  state.activeProject = null;

  if (projectSheetInner) {
    projectSheetInner.innerHTML = "";
  }
}

function openLightbox(project, startIndex) {
  if (!lightbox || !lightboxContent) return;

  const items = (project.media || []).map((file, index) => ({
    index,
    file,
    type: getMediaType(file),
    path: getMediaPath(project, file),
    title: project.title
  }));

  state.lightboxItems = items;
  state.activeLightboxIndex = startIndex;

  renderLightboxItem();

  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  if (!lightbox || !lightboxContent) return;

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  lightboxContent.innerHTML = "";
  state.lightboxItems = [];
  state.activeLightboxIndex = 0;
}

function renderLightboxItem() {
  if (!lightboxContent || !state.lightboxItems.length) return;

  const item = state.lightboxItems[state.activeLightboxIndex];

  if (!item) return;

  if (item.type === "image") {
    lightboxContent.innerHTML = `
      <img src="${item.path}" alt="${item.title} full screen media ${item.index + 1}" />
    `;
  } else if (item.type === "pdf") {
    lightboxContent.innerHTML = `
      <iframe
        src="${item.path}#view=FitH"
        title="${item.title} PDF ${item.index + 1}"
      ></iframe>
    `;
  } else {
    lightboxContent.innerHTML = "";
  }
}

function showPrevLightboxItem() {
  if (!state.lightboxItems.length) return;

  state.activeLightboxIndex =
    (state.activeLightboxIndex - 1 + state.lightboxItems.length) %
    state.lightboxItems.length;

  renderLightboxItem();
}

function showNextLightboxItem() {
  if (!state.lightboxItems.length) return;

  state.activeLightboxIndex =
    (state.activeLightboxIndex + 1) % state.lightboxItems.length;

  renderLightboxItem();
}

function setupReveal() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealItems.forEach(item => observer.observe(item));
}

function setupParallax() {
  const parallaxItems = document.querySelectorAll(".parallax");

  if (!parallaxItems.length) return;

  let ticking = false;

  function updateParallax() {
    const viewportHeight = window.innerHeight;

    parallaxItems.forEach(item => {
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offsetFromCenter = center - viewportHeight / 2;
      const movement = offsetFromCenter * -0.03;

      item.style.transform = `translate3d(0, ${movement}px, 0)`;
    });

    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  requestTick();
}

function setupHeaderScroll() {
  if (!siteHeader) return;

  function onScroll() {
    if (window.scrollY > 24) {
      siteHeader.classList.add("scrolled");
    } else {
      siteHeader.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupNavigation() {
  if (!navToggle) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";

    navToggle.setAttribute("aria-expanded", String(!isOpen));
    document.body.classList.toggle("nav-open", !isOpen);
  });

  const navLinks = document.querySelectorAll(".site-nav a");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}

function setupOverlayEvents() {
  if (projectClose) {
    projectClose.addEventListener("click", closeProject);
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", showPrevLightboxItem);
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", showNextLightboxItem);
  }

  document.querySelectorAll("[data-close-project]").forEach(item => {
    item.addEventListener("click", closeProject);
  });

  document.querySelectorAll("[data-lightbox-close]").forEach(item => {
    item.addEventListener("click", closeLightbox);
  });
}

function setupKeyboardControls() {
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (lightbox && lightbox.classList.contains("active")) {
        closeLightbox();
        return;
      }

      if (projectOverlay && projectOverlay.classList.contains("active")) {
        closeProject();
        return;
      }

      if (document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open");

        if (navToggle) {
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
    }

    if (lightbox && lightbox.classList.contains("active")) {
      if (event.key === "ArrowLeft") {
        showPrevLightboxItem();
      }

      if (event.key === "ArrowRight") {
        showNextLightboxItem();
      }
    }
  });
}

function applySiteData() {
  if (!data || !data.site) return;

  if (homeHeroImage && data.site.homeHero) {
    homeHeroImage.src = encodePath(data.site.homeHero);
  }

  const resumeDownload = document.getElementById("resumeDownload");
  if (resumeDownload) {
    resumeDownload.href = encodePath("projects/08-resume/01 resume.pdf");
  }

  const resumeFrame = document.querySelector(".resume-viewer iframe");
  if (resumeFrame) {
    resumeFrame.src = `${encodePath("projects/08-resume/01 resume.pdf")}#view=FitH`;
  }
}

function hideLoader() {
  if (!pageLoader) return;

  window.setTimeout(() => {
    pageLoader.classList.add("hidden");
  }, 300);
}

function init() {
  applySiteData();
  renderProjectsIndex();
  setupReveal();
  setupParallax();
  setupHeaderScroll();
  setupNavigation();
  setupOverlayEvents();
  setupKeyboardControls();
  hideLoader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
