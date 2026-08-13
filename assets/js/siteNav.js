(function initSiteNav() {
  const ABOUT_PANEL_ID = "about-panel";
  const ABOUT_OVERLAY_ID = "about-overlay";
  let isPanelOpen = false;

  const ABOUT_CONTENT = `
    <div class="about-panel-brand">
      <p class="about-panel-eyebrow">Nossa história</p>
      <h2 class="about-panel-title" id="about-panel-title">Sobre a eCafe</h2>
      <p class="about-panel-slogan">Sabor que inspira</p>
    </div>
    <div class="about-panel-body">
      <p>
        A eCafe nasceu da paixão pelos melhores cafés, grãos selecionados e produtos
        artesanais que fazem parte da mesa brasileira. No Mercado Municipal de
        Governador Valadares, unimos tradição, aroma e atendimento acolhedor para
        entregar qualidade em cada detalhe.
      </p>
      <p>
        Selecionamos fornecedores confiáveis, priorizamos frescor e cuidamos de cada
        etapa — do armazém à sua casa — para que cada compra seja uma experiência
        especial.
      </p>
      <ul class="about-panel-highlights">
        <li><i class="fa-solid fa-mug-saucer" aria-hidden="true"></i> Cafés especiais e blends selecionados</li>
        <li><i class="fa-solid fa-seedling" aria-hidden="true"></i> Grãos, farinhas e produtos naturais</li>
        <li><i class="fa-solid fa-gift" aria-hidden="true"></i> Cestas e presentes para ocasiões especiais</li>
        <li><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Entrega rápida para todo o Brasil</li>
      </ul>
      <div class="about-panel-location">
        <h3>Onde estamos</h3>
        <p>
          Mercado Municipal — R. Bárbara Heliodora, Lj 61<br />
          Centro, Gov. Valadares - MG, 35010-131
        </p>
      </div>
    </div>
  `;

  function createAboutPanel() {
    if (document.getElementById(ABOUT_PANEL_ID)) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = ABOUT_OVERLAY_ID;
    overlay.className = "about-overlay";
    overlay.hidden = true;

    const panel = document.createElement("aside");
    panel.id = ABOUT_PANEL_ID;
    panel.className = "about-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "about-panel-title");
    panel.hidden = true;
    panel.innerHTML = `
      <button type="button" class="about-panel-close" aria-label="Fechar sobre nós">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
      ${ABOUT_CONTENT}
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    overlay.addEventListener("click", closeAboutPanel);
    panel.querySelector(".about-panel-close")?.addEventListener("click", closeAboutPanel);
  }

  function openAboutPanel() {
    const overlay = document.getElementById(ABOUT_OVERLAY_ID);
    const panel = document.getElementById(ABOUT_PANEL_ID);

    if (!overlay || !panel) return;

    isPanelOpen = true;
    overlay.hidden = false;
    panel.hidden = false;
    document.body.classList.add("about-panel-open");

    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      panel.classList.add("is-visible");
    });

    panel.querySelector(".about-panel-close")?.focus();
  }

  function closeAboutPanel() {
    if (!isPanelOpen) return;

    const overlay = document.getElementById(ABOUT_OVERLAY_ID);
    const panel = document.getElementById(ABOUT_PANEL_ID);

    isPanelOpen = false;
    overlay?.classList.remove("is-visible");
    panel?.classList.remove("is-visible");
    document.body.classList.remove("about-panel-open");

    window.setTimeout(() => {
      if (!isPanelOpen) {
        overlay.hidden = true;
        panel.hidden = true;
      }
    }, 320);
  }

  function scrollToContact() {
    const target = document.getElementById("contato");

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.location.href = getHomePath("#contato");
  }

  function scrollToCategories() {
    const target = document.getElementById("categorias");

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.location.href = getHomePath("#categorias");
  }

  function scrollToProducts() {
    const target = document.getElementById("produtos");

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.location.href = getHomePath("#produtos");
  }

  function getHomePath(hash = "") {
    if (window.location.pathname.includes("/pages/home/")) {
      return `${window.location.pathname}${hash}`;
    }

    if (window.location.pathname.includes("/pages/")) {
      return `../home/index.html${hash}`;
    }

    return `pages/home/index.html${hash}`;
  }

  function isAboutLink(link) {
    const href = (link.getAttribute("href") || "").trim().toLowerCase();
    const text = link.textContent.replace(/\s+/g, " ").trim().toLowerCase();

    return (
      link.dataset.action === "about" ||
      href === "#sobre-nos" ||
      href === "#sobre" ||
      text === "sobre nós"
    );
  }

  function isContactLink(link) {
    const href = (link.getAttribute("href") || "").trim().toLowerCase();
    const text = link.textContent.replace(/\s+/g, " ").trim().toLowerCase();

    return (
      link.dataset.action === "contact" ||
      href === "#contato" ||
      href === "#contatos" ||
      text === "contato" ||
      text === "contatos"
    );
  }

  function isCategoriesLink(link) {
    const href = (link.getAttribute("href") || "").trim().toLowerCase();
    const text = link.textContent.replace(/\s+/g, " ").trim().toLowerCase();

    return (
      link.dataset.action === "categories" ||
      href === "#categorias" ||
      href === "#categoria" ||
      text === "categorias" ||
      text === "categoria"
    );
  }

  function isProductsLink(link) {
    const href = (link.getAttribute("href") || "").trim().toLowerCase();
    const text = link.textContent.replace(/\s+/g, " ").trim().toLowerCase();

    if (link.dataset.action === "products") return true;
    if (href === "#produtos" || href === "#produto") return true;

    if (text !== "produtos") return false;

    return href === "#" || href === "" || href.startsWith("#");
  }

  function bindNavActions() {
    document.querySelectorAll("a").forEach((link) => {
      if (isAboutLink(link)) {
        link.setAttribute("href", "#sobre-nos");
        link.addEventListener("click", (event) => {
          event.preventDefault();
          openAboutPanel();
        });
      }

      if (isContactLink(link)) {
        link.setAttribute("href", "#contato");
        link.addEventListener("click", (event) => {
          event.preventDefault();
          scrollToContact();
        });
      }

      if (isCategoriesLink(link)) {
        link.setAttribute("href", "#categorias");
        link.addEventListener("click", (event) => {
          event.preventDefault();
          scrollToCategories();
        });
      }

      if (isProductsLink(link)) {
        link.setAttribute("href", "#produtos");
        link.addEventListener("click", (event) => {
          event.preventDefault();
          scrollToProducts();
        });
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isPanelOpen) {
      closeAboutPanel();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    createAboutPanel();
    bindNavActions();

    if (window.location.hash === "#contato") {
      window.setTimeout(scrollToContact, 250);
    }

    if (window.location.hash === "#categorias") {
      window.setTimeout(scrollToCategories, 250);
    }

    if (window.location.hash === "#produtos") {
      window.setTimeout(scrollToProducts, 250);
    }
  });
})();
