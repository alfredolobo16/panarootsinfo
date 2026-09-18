const routes = [
  { key: "home", label: "Home", href: "index.html" },
  { key: "destinations", label: "Destinations", href: "destinations.html" },
  { key: "tours", label: "Tours", href: "tour-grid.html" },
  { key: "experiences", label: "Experiences", href: "experiences.html" },
  { key: "calendar", label: "Cultural Calendar", href: "calendar.html" },
  { key: "about", label: "About", href: "about.html" },
  { key: "contact", label: "Contact", href: "contact-us.html" },
];

const currentPage = document.body.dataset.page || "home";
const headerHost = document.querySelector("[data-site-header]");
const footerHost = document.querySelector("[data-site-footer]");

if (headerHost) {
  headerHost.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header${document.body.dataset.header === "solid" ? " site-header--solid" : ""}" data-header>
      <div class="site-header__inner">
        <a class="brand" href="index.html" aria-label="PanaRoots home">
          <img src="assets/media/logo.png" alt="" width="42" height="42">
          <span>PANAROOTS</span>
        </a>
        <nav class="site-nav" id="site-navigation" aria-label="Primary navigation" data-navigation>
          <ul class="site-nav__list">
            ${routes.map((route) => `
              <li><a href="${route.href}"${route.key === currentPage ? ' aria-current="page"' : ""}>${route.label}</a></li>
            `).join("")}
          </ul>
        </nav>
        <div class="header-actions">
          <a class="icon-button" href="account.html" aria-label="Account" title="Account" data-account-link>
            <img class="header-profile-photo" data-header-profile-photo alt="" referrerpolicy="no-referrer" hidden>
            <iframe class="header-profile-canva" data-header-profile-canva title="Canva profile design" tabindex="-1" aria-hidden="true" hidden></iframe>
            <i class="fa-regular fa-user" aria-hidden="true" data-header-profile-icon></i>
          </a>
          <a class="button header-cta" href="contact-us.html?interest=plan">
            Plan your visit <i class="fa-regular fa-arrow-right" aria-hidden="true"></i>
          </a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" aria-label="Open menu" data-menu-toggle>
            <i class="fa-solid fa-bars" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </header>
  `;

  const header = headerHost.querySelector("[data-header]");
  const navigation = headerHost.querySelector("[data-navigation]");
  const menuToggle = headerHost.querySelector("[data-menu-toggle]");
  const menuIcon = menuToggle.querySelector("i");
  const accountLink = headerHost.querySelector("[data-account-link]");
  const profilePhoto = headerHost.querySelector("[data-header-profile-photo]");
  const profileCanva = headerHost.querySelector("[data-header-profile-canva]");
  const profileIcon = headerHost.querySelector("[data-header-profile-icon]");
  let profileCanvaRevealTimer = 0;

  const getCanvaEmbedUrl = (value) => {
    try {
      const url = new URL(value);
      const isCanva = ["canva.com", "www.canva.com"].includes(url.hostname.toLowerCase());
      const isPublicView = /^\/design\/[^/]+\/(?:[^/]+\/)?view\/?$/.test(url.pathname);
      return isCanva && isPublicView ? `${url.origin}${url.pathname}?embed` : "";
    } catch (error) {
      return "";
    }
  };

  const showProfileIcon = () => {
    window.clearTimeout(profileCanvaRevealTimer);
    accountLink.href = "account.html";
    profilePhoto.onload = null;
    profilePhoto.onerror = null;
    profileCanva.onload = null;
    profilePhoto.hidden = true;
    profilePhoto.removeAttribute("src");
    profileCanva.hidden = true;
    profileCanva.classList.remove("is-loading");
    profileCanva.removeAttribute("src");
    profileIcon.hidden = false;
  };

  const showProfilePhoto = (url) => {
    if (!url) {
      showProfileIcon();
      return;
    }

    const canvaEmbedUrl = getCanvaEmbedUrl(url);
    if (canvaEmbedUrl) {
      window.clearTimeout(profileCanvaRevealTimer);
      profilePhoto.onload = null;
      profilePhoto.onerror = null;
      profilePhoto.hidden = true;
      profilePhoto.removeAttribute("src");
      profileCanva.hidden = false;
      profileCanva.classList.add("is-loading");
      const revealCanva = () => {
        if (profileCanva.src !== canvaEmbedUrl) return;
        accountLink.href = "profile.html";
        profileCanva.classList.remove("is-loading");
        profileIcon.hidden = true;
      };
      profileCanva.onload = revealCanva;
      profileCanva.src = canvaEmbedUrl;
      profileCanvaRevealTimer = window.setTimeout(revealCanva, 1500);
      return;
    }

    window.clearTimeout(profileCanvaRevealTimer);
    profileCanva.onload = null;
    profileCanva.hidden = true;
    profileCanva.classList.remove("is-loading");
    profileCanva.removeAttribute("src");
    profilePhoto.onload = () => {
      accountLink.href = "profile.html";
      profilePhoto.hidden = false;
      profileIcon.hidden = true;
    };
    profilePhoto.onerror = showProfileIcon;
    profilePhoto.src = url;
  };

  try {
    showProfilePhoto(window.localStorage.getItem("panarootsProfilePhoto") || "");
  } catch (error) {
    showProfileIcon();
  }

  window.addEventListener("panaroots:profile-photo", (event) => {
    showProfilePhoto(event.detail?.url || "");
  });

  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    menuIcon.className = "fa-solid fa-bars";
    document.body.classList.remove("nav-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
      return;
    }

    navigation.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    menuIcon.className = "fa-solid fa-xmark";
    document.body.classList.add("nav-open");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });

  if (document.body.dataset.header !== "solid") {
    const updateHeader = () => header.classList.toggle("is-sticky", window.scrollY > 42);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }
}

if (footerHost) {
  footerHost.innerHTML = `
    <footer class="site-footer">
      <div class="container site-footer__main">
        <div class="site-footer__about">
          <a class="brand" href="index.html" aria-label="PanaRoots home">
            <img src="assets/media/logo.png" alt="" width="42" height="42">
            <span>PANAROOTS</span>
          </a>
          <p>PanaRoots connects international visitors with Panama's culture, traditions, gastronomy, crafts and local communities.</p>
        </div>
        <div>
          <h2>Explore</h2>
          <ul class="footer-links">
            ${routes.slice(1, 5).map((route) => `<li><a href="${route.href}">${route.label}</a></li>`).join("")}
          </ul>
        </div>
        <div>
          <h2>PanaRoots</h2>
          <ul class="footer-links">
            <li><a href="about.html">About</a></li>
            <li><a href="contact-us.html">Contact</a></li>
            <li><a href="account.html">Account</a></li>
          </ul>
        </div>
      </div>
      <div class="container site-footer__bottom">
        <span>&copy; <span data-current-year></span> PanaRoots. Feel the essence of Panama.</span>
        <span>Event dates and availability should be confirmed before travel.</span>
      </div>
    </footer>
  `;
}

document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const hero = document.querySelector("[data-parallax-hero]");
if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let ticking = false;

  const updateParallax = () => {
    const bounds = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(bounds.height, 1)));
    hero.style.setProperty("--background-shift", `${progress * -16}px`);
    hero.style.setProperty("--title-shift", `${progress * -46}px`);
    hero.style.setProperty("--island-shift", `${progress * -24}px`);
    hero.style.setProperty("--water-shift", `${progress * 12}px`);
    ticking = false;
  };

  const requestParallax = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  updateParallax();
  window.addEventListener("scroll", requestParallax, { passive: true });
}

const tourFilters = document.querySelector("[data-tour-filters]");
if (tourFilters) {
  const cards = [...document.querySelectorAll("[data-tour-card]")];
  const category = tourFilters.querySelector("[name='category']");
  const destination = tourFilters.querySelector("[name='destination']");
  const count = document.querySelector("[data-tour-count]");
  const empty = document.querySelector("[data-tour-empty]");
  const params = new URLSearchParams(window.location.search);

  const setIfValid = (select, value) => {
    if (value && [...select.options].some((option) => option.value === value)) select.value = value;
  };

  setIfValid(category, params.get("experience") || params.get("category"));
  setIfValid(destination, params.get("destination"));

  const filterTours = () => {
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatches = !category.value || card.dataset.category === category.value;
      const destinations = (card.dataset.destinations || "").split(" ");
      const destinationMatches = !destination.value || destinations.includes(destination.value);
      const show = categoryMatches && destinationMatches;
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = `${visible} experience ${visible === 1 ? "concept" : "concepts"}`;
    empty.hidden = visible !== 0;
  };

  tourFilters.addEventListener("change", filterTours);
  filterTours();
}

const calendarFilters = document.querySelector("[data-calendar-filters]");
if (calendarFilters) {
  const eventCards = [...document.querySelectorAll("[data-event-card]")];
  const month = calendarFilters.querySelector("[name='month']");
  const category = calendarFilters.querySelector("[name='category']");
  const count = document.querySelector("[data-event-count]");
  const empty = document.querySelector("[data-event-empty]");

  const filterEvents = () => {
    let visible = 0;
    eventCards.forEach((card) => {
      const monthMatches = !month.value || card.dataset.month === month.value;
      const categoryMatches = !category.value || card.dataset.category === category.value;
      const show = monthMatches && categoryMatches;
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = `${visible} cultural ${visible === 1 ? "highlight" : "highlights"}`;
    empty.hidden = visible !== 0;
  };

  calendarFilters.addEventListener("change", filterEvents);
  filterEvents();
}

const contactForm = document.querySelector("[data-contact-form]");
if (contactForm) {
  const interest = contactForm.querySelector("[name='interest']");
  const status = contactForm.querySelector("[data-form-status]");
  const requestedInterest = new URLSearchParams(window.location.search).get("interest");
  if (requestedInterest && [...interest.options].some((option) => option.value === requestedInterest)) {
    interest.value = requestedInterest;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const draft = Object.fromEntries(new FormData(contactForm));
    draft.savedAt = new Date().toISOString();
    try {
      localStorage.setItem("panaroots-enquiry", JSON.stringify(draft));
      status.classList.remove("is-error");
      status.textContent = "Your enquiry has been saved on this device. Connect the form to the official PanaRoots inbox before launch.";
    } catch (error) {
      status.classList.add("is-error");
      status.textContent = "This browser could not save the enquiry. Please try again in a standard browser window.";
    }
  });
}
