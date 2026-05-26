const lazyVisualizations = document.querySelectorAll(".lazy-viz");

const vizObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      const iframe = entry.target;

      if (entry.isIntersecting && !iframe.dataset.loaded) {
        iframe.src = iframe.dataset.src;
        iframe.dataset.loaded = "true";
        vizObserver.unobserve(iframe);
      }
    });
  },
  {
    threshold: 0.25,
    rootMargin: "0px 0px -80px 0px"
  }
);

lazyVisualizations.forEach(iframe => {
  vizObserver.observe(iframe);
});

const navLinks = document.querySelectorAll(".nav a");
const sections = document.querySelectorAll("section[id]");

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      navLinks.forEach(link => {
        link.classList.remove("active");

        if (link.getAttribute("href") === `#${entry.target.id}`) {
          link.classList.add("active");
        }
      });
    });
  },
  {
    threshold: 0.35,
    rootMargin: "-140px 0px -55% 0px"
  }
);

sections.forEach(section => {
  sectionObserver.observe(section);
});

/* =========================
   IMAGE LIGHTBOX
========================= */

const expandableImages = document.querySelectorAll(".expandable-image");
const lightbox = document.getElementById("imageLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");

if (lightbox && lightboxImage && lightboxCaption) {
  expandableImages.forEach(image => {
    image.addEventListener("click", () => {
      lightbox.classList.add("active");

      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = image.dataset.caption || image.alt;

      document.body.style.overflow = "hidden";
    });
  });

  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}