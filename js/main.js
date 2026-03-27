'use strict';

// =============================================================================
// SEASONAL CONFIG
// Change this manually when the baker confirms the season is ready.
// Valid values: 'spring' | 'summer' | 'fall' | 'winter'
// =============================================================================
const currentSeason = 'spring';

// =============================================================================
// HAMBURGER MENU
// =============================================================================
function initNav() {
  const nav = document.querySelector('nav');
  const hamburger = nav.querySelector('.hamburger');
  const navLinks = nav.querySelector('.nav-links');

  function openMenu() {
    nav.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    nav.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    nav.classList.contains('nav-open') ? closeMenu() : openMenu();
  });

  // Close when any anchor link in the nav is tapped
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close when clicking outside the nav
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('nav-open') && !nav.contains(e.target)) {
      closeMenu();
    }
  });
}

// =============================================================================
// SLIDESHOW ENGINE
// =============================================================================

// NOTE: Slideshows load manifests via fetch(). This requires a local server
// (e.g. live-server) or the deployed site — fetch is blocked on file:// URLs
// in most browsers. On the live site this works as expected.

function getManifestPath(category) {
  if (category === 'seasonal') {
    return `images/seasonal/${currentSeason}/manifest.json`;
  }
  return `images/${category}/manifest.json`;
}

function initSlideshow(container) {
  const category = container.dataset.category;
  const slidesEl = container.querySelector('.slides');
  const prevBtn  = container.querySelector('.arrow.prev');
  const nextBtn  = container.querySelector('.arrow.next');
  const dotsEl   = container.querySelector('.dots');

  let images = [];
  let currentIndex = 0;

  function showSlide(index) {
    images.forEach((img, i) => {
      img.classList.toggle('active', i === index);
    });
    dotsEl.querySelectorAll('.dot').forEach((dot, i) => {
      const isActive = i === index;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
    currentIndex = index;
  }

  function goTo(index) {
    if (images.length === 0) return;
    showSlide((index + images.length) % images.length);
  }

  function prev() { goTo(currentIndex - 1); }
  function next() { goTo(currentIndex + 1); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Keyboard navigation — arrow keys when focus is anywhere inside the slideshow.
  // tabindex="0" makes the container itself focusable as a tab stop.
  // Keydown events from child elements (buttons, dots) also bubble up here.
  container.setAttribute('tabindex', '0');
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  });

  // Touch swipe
  let touchStartX = 0;
  const SWIPE_THRESHOLD = 50; // px — prevents accidental swipes

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    delta < 0 ? next() : prev();
  }, { passive: true });

  // Fetch manifest and build slides + dots
  fetch(getManifestPath(category))
    .then(res => res.json())
    .then(manifest => {
      if (!manifest.length) return;

      manifest.forEach((item, i) => {
        // Build image
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        img.loading = 'lazy';
        if (i === 0) img.classList.add('active');
        slidesEl.appendChild(img);
        images.push(img);

        // Build dot button
        const dot = document.createElement('button');
        dot.classList.add('dot');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
      });
    })
    .catch(() => {
      // Manifest missing or empty — slideshow stays empty, no error shown to user
    });
}

// =============================================================================
// CONTACT FORM VALIDATION
// =============================================================================
function initContactForm() {
  const form = document.querySelector('form[name="contact"]');
  if (!form) return;

  const emailInput = form.querySelector('#email');
  const phoneInput = form.querySelector('#phone');
  let warningEl = null;

  form.addEventListener('submit', (e) => {
    const emailEmpty = emailInput.value.trim() === '';
    const phoneEmpty = phoneInput.value.trim() === '';

    if (emailEmpty && phoneEmpty) {
      e.preventDefault();

      if (!warningEl) {
        warningEl = document.createElement('p');
        warningEl.classList.add('form-warning');
        warningEl.textContent = 'Please provide at least an email address or phone number so we can reach you.';
        phoneInput.insertAdjacentElement('afterend', warningEl);
      }

      emailInput.focus();
    } else {
      if (warningEl) {
        warningEl.remove();
        warningEl = null;
      }
    }
  });
}

// =============================================================================
// INIT
// =============================================================================
// scroll-behavior: smooth is handled by CSS — no JS needed for anchor links

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  document.querySelectorAll('.slideshow[data-category]').forEach(initSlideshow);
  initContactForm();
});
