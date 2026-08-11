function syncCartBadges() {
  const cart = JSON.parse(localStorage.getItem("ecafe_cart") || "[]");
  const count = Array.isArray(cart) ? cart.length : 0;
  const label = count >= 100 ? "99+" : String(count);

  document.querySelectorAll(".badge, .cart-count").forEach((element) => {
    element.textContent = label;
    element.hidden = count === 0;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  syncCartBadges();

  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  const cartLinks = document.querySelectorAll(".action-cart, .cart");

  cartLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = (link.getAttribute("href") || "").trim();

      if (href && href !== "#") {
        return;
      }

      event.preventDefault();

      if (window.location.pathname.endsWith("/cart.html")) {
        return;
      }

      const target = window.location.pathname.includes("/pages/")
        ? "../cart.html"
        : "pages/cart.html";

      window.location.assign(target);
    });
  });

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks?.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      navLinks?.classList.remove("open");
      hamburger?.classList.remove("open");
    }
  });

  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks?.classList.remove("open");
      hamburger?.classList.remove("open");
    });
  });

  window.addEventListener("storage", syncCartBadges);
});
