document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carousel-track");
  const originalSlides = Array.from(
    document.querySelectorAll(".carousel-slide"),
  );
  const dots = Array.from(document.querySelectorAll(".carousel-dot"));
  const nextButton = document.querySelector(".carousel-control.next");
  const prevButton = document.querySelector(".carousel-control.prev");

  if (!track || originalSlides.length === 0) return;

  const firstClone = originalSlides[0].cloneNode(true);
  const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);

  firstClone.classList.add("clone");
  lastClone.classList.add("clone");

  track.appendChild(firstClone);
  track.insertBefore(lastClone, originalSlides[0]);

  const slides = Array.from(track.children);

  let activeIndex = 1;
  let autoSlide;
  let isTransitioning = false;

  const slideCount = originalSlides.length;

  const getTrackWidth = () => track.clientWidth;

  function updateDots(index) {
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  function moveTo(index, animate = true) {
    track.style.transition = animate ? "transform .5s ease" : "none";
    track.style.transform = `translateX(-${index * getTrackWidth()}px)`;
  }

  moveTo(activeIndex, false);
  updateDots(0);

  function nextSlide() {
    if (isTransitioning) return;

    isTransitioning = true;
    activeIndex++;
    moveTo(activeIndex);

    if (activeIndex <= slideCount) updateDots(activeIndex - 1);
    else updateDots(0);
  }

  function prevSlide() {
    if (isTransitioning) return;

    isTransitioning = true;
    activeIndex--;
    moveTo(activeIndex);

    if (activeIndex >= 1) updateDots(activeIndex - 1);
    else updateDots(slideCount - 1);
  }

  track.addEventListener("transitionend", () => {
    if (slides[activeIndex] === firstClone) {
      activeIndex = 1;
      moveTo(activeIndex, false);
    }

    if (slides[activeIndex] === lastClone) {
      activeIndex = slideCount;
      moveTo(activeIndex, false);
    }

    isTransitioning = false;
  });

  function startAutoSlide() {
    clearInterval(autoSlide);
    autoSlide = setInterval(nextSlide, 5500);
  }

  nextButton?.addEventListener("click", () => {
    nextSlide();
    startAutoSlide();
  });

  prevButton?.addEventListener("click", () => {
    prevSlide();
    startAutoSlide();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (isTransitioning) return;

      activeIndex = index + 1;
      moveTo(activeIndex);
      updateDots(index);
      startAutoSlide();
    });
  });

  window.addEventListener("resize", () => {
    moveTo(activeIndex, false);
  });

  startAutoSlide();

  document
    .querySelectorAll('.carousel-cta[href="#produtos"]')
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        const productsSection = document.getElementById("produtos");
        if (!productsSection) return;

        event.preventDefault();
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

  const categoriesTrack = document.querySelector(".categories-track");
  const categoriesCarousel = document.querySelector(".categories-carousel");
  const prevCategory = document.querySelector(".categories-nav.prev");
  const nextCategory = document.querySelector(".categories-nav.next");
  const categoriesCarouselWrap = document.querySelector(
    ".categories-carousel-wrap",
  );
  const mobileCategoriesMq = window.matchMedia("(max-width: 768px)");
  let categoryIndex = 0;

  function getCategoryCards() {
    return Array.from(document.querySelectorAll(".category-card"));
  }

  function initCategoriesCarousel() {
    const categoryCards = getCategoryCards();

    if (
      !categoriesTrack ||
      categoryCards.length === 0 ||
      !prevCategory ||
      !nextCategory
    ) {
      return;
    }

    if (categoriesCarouselWrap?.dataset.carouselReady === "true") {
      categoryIndex = 0;
      syncCategoryCarouselMode();
      return;
    }

    if (categoriesCarouselWrap) {
      categoriesCarouselWrap.dataset.carouselReady = "true";
    }

    const isMobileCategories = () => mobileCategoriesMq.matches;

    const getCategoryGap = () => {
      return parseInt(getComputedStyle(categoriesTrack).gap, 10) || 0;
    };

    const getCategoryStep = () => {
      const cards = getCategoryCards();
      if (!cards.length) return 0;
      return cards[0].clientWidth + getCategoryGap();
    };

    const getVisibleCount = () => {
      const viewport =
        categoriesCarousel?.clientWidth ?? categoriesTrack.clientWidth;
      const step = getCategoryStep();
      if (!step) return 1;
      return Math.max(1, Math.floor((viewport + getCategoryGap()) / step));
    };

    const updateCategoryButtonsDesktop = () => {
      const cards = getCategoryCards();
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, cards.length - visibleCount);
      prevCategory.disabled = categoryIndex <= 0;
      nextCategory.disabled = categoryIndex >= maxIndex;
    };

    const updateCategoryButtonsMobile = () => {
      if (!categoriesCarousel) return;

      const maxScroll =
        categoriesCarousel.scrollWidth - categoriesCarousel.clientWidth;
      const tolerance = 4;

      prevCategory.disabled = categoriesCarousel.scrollLeft <= tolerance;
      nextCategory.disabled =
        categoriesCarousel.scrollLeft >= maxScroll - tolerance;
    };

    const updateCategoryButtons = () => {
      if (isMobileCategories()) {
        updateCategoryButtonsMobile();
        return;
      }

      updateCategoryButtonsDesktop();
    };

    const updateCategoryPositionDesktop = () => {
      const offset = categoryIndex * getCategoryStep();
      categoriesTrack.style.transform = `translateX(-${offset}px)`;
      updateCategoryButtonsDesktop();
    };

    const resetCategoryTrackForMobile = () => {
      categoriesTrack.style.transform = "none";
      categoriesTrack.style.transition = "none";
      if (categoriesCarousel) {
        categoriesCarousel.scrollLeft = 0;
      }
      updateCategoryButtonsMobile();
    };

    const enableCategoryPointerScroll = () => {
      if (!categoriesCarousel) return;

      let isDragging = false;
      let startX = 0;
      let scrollStart = 0;

      categoriesCarousel.addEventListener("pointerdown", (event) => {
        if (!isMobileCategories() || event.pointerType !== "mouse") return;

        isDragging = true;
        startX = event.clientX;
        scrollStart = categoriesCarousel.scrollLeft;
        categoriesCarousel.style.scrollBehavior = "auto";
        categoriesCarousel.setPointerCapture(event.pointerId);
      });

      categoriesCarousel.addEventListener("pointermove", (event) => {
        if (!isDragging || !isMobileCategories()) return;

        categoriesCarousel.scrollLeft = scrollStart - (event.clientX - startX);
      });

      const endPointerDrag = (event) => {
        if (!isDragging) return;

        isDragging = false;
        categoriesCarousel.style.scrollBehavior = "smooth";

        try {
          categoriesCarousel.releasePointerCapture(event.pointerId);
        } catch {
          /* pointer already released */
        }

        updateCategoryButtonsMobile();
      };

      categoriesCarousel.addEventListener("pointerup", endPointerDrag);
      categoriesCarousel.addEventListener("pointercancel", endPointerDrag);

      categoriesCarousel.addEventListener(
        "wheel",
        (event) => {
          if (!isMobileCategories()) return;
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

          categoriesCarousel.scrollLeft += event.deltaY;
          event.preventDefault();
        },
        { passive: false },
      );
    };

    const syncCategoryCarouselMode = () => {
      if (isMobileCategories()) {
        categoryIndex = 0;
        resetCategoryTrackForMobile();
        return;
      }

      categoriesTrack.style.transition = "";
      updateCategoryPositionDesktop();
    };

    nextCategory.addEventListener("click", () => {
      if (isMobileCategories()) {
        categoriesCarousel?.scrollBy({
          left: getCategoryStep(),
          behavior: "smooth",
        });
        return;
      }

      const cards = getCategoryCards();
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, cards.length - visibleCount);
      if (categoryIndex >= maxIndex) return;
      categoryIndex += 1;
      updateCategoryPositionDesktop();
    });

    prevCategory.addEventListener("click", () => {
      if (isMobileCategories()) {
        categoriesCarousel?.scrollBy({
          left: -getCategoryStep(),
          behavior: "smooth",
        });
        return;
      }

      if (categoryIndex <= 0) return;
      categoryIndex -= 1;
      updateCategoryPositionDesktop();
    });

    categoriesCarousel?.addEventListener("scroll", () => {
      if (isMobileCategories()) {
        updateCategoryButtonsMobile();
      }
    });

    window.addEventListener("resize", () => {
      syncCategoryCarouselMode();
    });

    mobileCategoriesMq.addEventListener("change", syncCategoryCarouselMode);

    enableCategoryPointerScroll();
    syncCategoryCarouselMode();
  }

  initCategoriesCarousel();
  document.addEventListener("ecafe:categories-loaded", () => {
    initCategoriesCarousel();
    initMobileScrollReveal();
  });

  function initFeaturedProductCards() {
    const productsRow = document.querySelector(
      ".featured-products-section .products-row",
    );
    const productCards = productsRow
      ? Array.from(productsRow.querySelectorAll(".product-card"))
      : [];

    const cardRatings = [
      4.7, 5.0, 4.8, 4.9, 4.6, 5.0, 4.8, 4.7, 4.9, 5.0, 4.8, 4.6,
    ];

    productCards.forEach((card, index) => {
      if (card.dataset.featuredBound === "true") {
        return;
      }

      card.dataset.featuredBound = "true";

      if (!card.querySelector(".product-rating")) {
        const ratingValue = cardRatings[index % cardRatings.length] ?? 5;

        const rating = document.createElement("div");
        rating.className = "product-rating";
        rating.setAttribute(
          "aria-label",
          `Avaliação ${ratingValue.toFixed(1)} de 5 estrelas`,
        );
        rating.innerHTML = `
        <span class="product-rating-stars">★</span>
        <span class="product-rating-value">${ratingValue.toFixed(1)}</span>
      `;

        const cardLink = card.querySelector(".product-card-link");
        if (cardLink) {
          const firstChild = cardLink.firstElementChild ?? cardLink.firstChild;
          if (firstChild) {
            cardLink.insertBefore(rating, firstChild);
          } else {
            cardLink.appendChild(rating);
          }
        } else {
          const image = card.querySelector(".product-image");
          if (image) {
            card.insertBefore(rating, image);
          } else {
            card.prepend(rating);
          }
        }
      }

      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", "Abrir detalhes do produto");

      const goToDetails = (event) => {
        const targetButton = event.target.closest("button");
        const isFavoriteButton = targetButton?.classList.contains("fav-btn");
        const productId = card.dataset.productId;

        if (!productId || isFavoriteButton) {
          return;
        }

        const cardLink = card.querySelector(".product-card-link");
        if (cardLink) {
          window.location.href = cardLink.href;
          return;
        }

        window.location.href = `../products/details.html?id=${productId}`;
      };

      card.addEventListener("click", (event) => {
        const targetButton = event.target.closest("button");
        const isCartButton = targetButton?.classList.contains("btn-add");

        if (targetButton && isCartButton) {
          event.stopPropagation();
          return;
        }

        goToDetails(event);
      });

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToDetails(event);
        }
      });
    });
  }

  initFeaturedProductCards();
  document.addEventListener("ecafe:featured-products-loaded", () => {
    initFeaturedProductCards();
    initMobileScrollReveal();
  });

  const mobileRevealMq = window.matchMedia("(max-width: 768px)");
  const reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealObserver = null;

  const revealGroups = [
    { selector: ".categories-header", staggerStep: 0 },
    { selector: ".category-card", staggerStep: 70 },
    { selector: ".featured-subtitle", staggerStep: 0 },
    { selector: ".featured-title", staggerStep: 0 },
    { selector: ".product-card", staggerStep: 60 },
    { selector: ".benefit", staggerStep: 80 },
  ];

  function cleanupScrollReveal() {
    document.querySelectorAll(".scroll-reveal").forEach((element) => {
      element.classList.remove("scroll-reveal", "is-visible");
      element.style.removeProperty("--reveal-delay");
    });

    revealObserver?.disconnect();
    revealObserver = null;
  }

  function initMobileScrollReveal() {
    cleanupScrollReveal();

    if (!mobileRevealMq.matches) return;

    const elementsToReveal = [];

    revealGroups.forEach(({ selector, staggerStep }) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add("scroll-reveal");

        if (staggerStep > 0) {
          const delay = Math.min(index * staggerStep, 300);
          element.style.setProperty("--reveal-delay", `${delay}ms`);
        }

        if (reducedMotionMq.matches) {
          element.classList.add("is-visible");
          return;
        }

        elementsToReveal.push(element);
      });
    });

    if (reducedMotionMq.matches || elementsToReveal.length === 0) return;

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          revealObserver?.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -6% 0px",
      },
    );

    elementsToReveal.forEach((element) => revealObserver.observe(element));
  }

  initMobileScrollReveal();
  mobileRevealMq.addEventListener("change", initMobileScrollReveal);
  reducedMotionMq.addEventListener("change", initMobileScrollReveal);
});
