// ==========================================================================
// Main Javascript Controller - Confins do Mundo Viagens
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initMobileMenu();
  initScrollParallaxHero();
  initDestinosCarousel();
  initDepoimentosCarousel();
});

/**
 * 1. Dynamic Header styling on Scroll - changes color only after leaving the Hero section
 */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  const heroSection = document.getElementById('home');
  
  if (!navbar || !heroSection) return;

  function checkScroll() {
    // Unpin threshold: when the sticky container finishes scrolling and next content slides up
    const threshold = heroSection.offsetHeight - window.innerHeight;
    
    if (window.scrollY >= threshold - 20) { // Subtle threshold tolerance
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', checkScroll);
  window.addEventListener('resize', checkScroll);
  checkScroll();
}

/**
 * 2. Scroll-Driven Parallax Background & Curved Plane Flight Animation
 */
function initScrollParallaxHero() {
  const bg = document.getElementById('parallax-bg');
  const plane = document.getElementById('parallax-plane');
  const heroSection = document.getElementById('home');
  const scrollIndicator = document.getElementById('hero-scroll-indicator');
  const steps = [
    { id: 'step-1', min: 0.00, max: 0.18 },
    { id: 'step-2', min: 0.28, max: 0.45 },
    { id: 'step-3', min: 0.55, max: 0.72 },
    { id: 'step-4', min: 0.82, max: 1.00 }
  ];

  if (!bg || !plane || !heroSection) return;

  let scrollPercentage = 0;
  let currentPercentage = 0;
  const easeRate = 0.06;

  // Mathematical path function: centered horizontally, rising from bottom-middle to upper-middle
  function getPathCoords(pct) {
    const xPercent = 50; // Centered
    const yPercent = 65 - pct * 50; // Starts at 65% and climbs to 15%
    return { x: xPercent, y: yPercent };
  }

  function updateScrollTarget() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = heroSection.offsetHeight - window.innerHeight;
    scrollPercentage = Math.max(0, Math.min(1, scrollPosition / maxScroll));
  }

  window.addEventListener('scroll', updateScrollTarget);
  window.addEventListener('resize', updateScrollTarget);

  function smoothAnimationLoop() {
    currentPercentage += (scrollPercentage - currentPercentage) * easeRate;

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = heroSection.offsetHeight - window.innerHeight;
    const isPastHero = scrollPosition > maxScroll + 10;

    // 1. Parallax background movement
    const bgY = currentPercentage * 10; // Shift downward to create depth
    const bgScale = 1.15 - currentPercentage * 0.1; // Slow zooming out
    bg.style.transform = `translateY(${bgY}%) scale(${bgScale})`;

    // 2. Compute airplane position, scale, rotation and opacity
    const currentPt = getPathCoords(currentPercentage);

    // Extreme zoom: starts at 1.8 (larger) and increases to 45.0 (massive zoom-in bypass)
    const scale = 1.8 + Math.pow(currentPercentage, 2.0) * 43.2;

    // Fade out as it passes very close to the viewer (from 0.70 to 1.0 scroll)
    const opacity = currentPercentage > 0.70 ? Math.max(0, 1 - (currentPercentage - 0.70) / 0.30) : 1;

    // Use original image angle (0deg base) with a very subtle roll wiggle
    const wiggle = Math.sin(currentPercentage * Math.PI * 2) * 1.5;
    const angle = wiggle;

    // Apply airplane transformations entirely using GPU-accelerated transforms (no left/top layout changes)
    plane.style.transform = `translate3d(-50%, -50%, 0) translateY(${currentPt.y}vh) rotate(${angle}deg) scale(${scale})`;
    plane.style.opacity = opacity;

    // 3. Toggle text steps based on scroll percentage
    steps.forEach(step => {
      const el = document.getElementById(step.id);
      if (el) {
        if (!isPastHero && scrollPercentage >= step.min && scrollPercentage <= step.max) {
          el.classList.add('visible');
        } else {
          el.classList.remove('visible');
        }
      }
    });

    // 4. Toggle scroll indicator visibility (hide only when scrolled past hero)
    if (scrollIndicator) {
      if (isPastHero) {
        scrollIndicator.classList.add('hidden');
      } else {
        scrollIndicator.classList.remove('hidden');
      }
    }

    requestAnimationFrame(smoothAnimationLoop);
  }

  // --- MOBILE SWIPE SCROLLING ---
  let touchStartY = 0;
  let touchStartTime = 0;
  let isTransitioning = false;
  const stepScrollTargets = [0.0, 0.35, 0.63, 0.90]; // Center positions of steps 1-4

  function getCurrentStepIndex(pct) {
    if (pct < 0.23) return 0;
    if (pct < 0.50) return 1;
    if (pct < 0.77) return 2;
    return 3;
  }

  heroSection.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 768) return; // Only apply on mobile/tablets
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = heroSection.offsetHeight - window.innerHeight;
    // Don't intercept if we have already scrolled past the hero section
    if (scrollPosition >= maxScroll - 10) return;

    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  heroSection.addEventListener('touchend', (e) => {
    if (window.innerWidth > 768) return;
    if (isTransitioning) return;

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = heroSection.offsetHeight - window.innerHeight;
    if (scrollPosition >= maxScroll - 10) return;

    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    const duration = Date.now() - touchStartTime;

    // Detect swipe gesture (min 30px distance, max 400ms duration)
    if (Math.abs(diffY) > 30 && duration < 400) {
      const currentPct = scrollPosition / maxScroll;
      const currentIndex = getCurrentStepIndex(currentPct);

      if (diffY > 0) {
        // Swiped Up (means scroll Down -> next step)
        if (currentIndex < 3) {
          isTransitioning = true;
          const targetPct = stepScrollTargets[currentIndex + 1];
          window.scrollTo({
            top: targetPct * maxScroll,
            behavior: 'smooth'
          });
          setTimeout(() => { isTransitioning = false; }, 600);
        }
      } else {
        // Swiped Down (means scroll Up -> prev step)
        if (currentIndex > 0) {
          isTransitioning = true;
          const targetPct = stepScrollTargets[currentIndex - 1];
          window.scrollTo({
            top: targetPct * maxScroll,
            behavior: 'smooth'
          });
          setTimeout(() => { isTransitioning = false; }, 600);
        }
      }
    }
  }, { passive: true });

  requestAnimationFrame(smoothAnimationLoop);
  updateScrollTarget();
}


/**
 * 4. Mobile Hamburger Drawer Menu Toggle
 */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-item, .btn-drawer-cta');

  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close the drawer menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

/**
 * 5. Destinations Carousel - Autoplay, Responsive, Hover Pause and Touch Swipe
 */
function initDestinosCarousel() {
  const container = document.querySelector('.destinos-carousel-container');
  const track = document.getElementById('destinos-carousel-track');
  if (!container || !track) return;

  const cards = track.querySelectorAll('.destino-card');
  if (cards.length === 0) return;

  const gap = 30; // 30px gap in CSS
  let currentIndex = 0;
  let autoplayInterval;
  let startX = 0;
  let isSwiping = false;

  function getVisibleCardsCount() {
    const width = window.innerWidth;
    if (width > 992) return 3;
    if (width > 600) return 2;
    return 1;
  }

  function updateCarousel() {
    const visibleCards = getVisibleCardsCount();
    const maxIndex = Math.max(0, cards.length - visibleCards);
    
    // Safety check for boundaries
    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }

    const cardWidth = cards[0].offsetWidth;
    const translateX = currentIndex * (cardWidth + gap);
    track.style.transform = `translate3d(-${translateX}px, 0, 0)`;

    // Update dot classes
    const dots = container.querySelectorAll('.destinos-carousel-dots .dot');
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function setupDots() {
    const dotsContainer = document.getElementById('destinos-carousel-dots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';
    const visibleCards = getVisibleCardsCount();
    const steps = Math.max(1, cards.length - visibleCards + 1);

    for (let i = 0; i < steps; i++) {
      const dot = document.createElement('span');
      dot.classList.add('dot');
      if (i === currentIndex) {
        dot.classList.add('active');
      }
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateCarousel();
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      const visibleCards = getVisibleCardsCount();
      const maxIndex = Math.max(0, cards.length - visibleCards);

      if (currentIndex >= maxIndex) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      updateCarousel();
    }, 3000);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // Navigation Arrows Event Listeners
  const prevBtn = document.getElementById('destinos-carousel-prev');
  const nextBtn = document.getElementById('destinos-carousel-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const visibleCards = getVisibleCardsCount();
      const maxIndex = Math.max(0, cards.length - visibleCards);
      if (currentIndex === 0) {
        currentIndex = maxIndex;
      } else {
        currentIndex--;
      }
      updateCarousel();
      resetAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const visibleCards = getVisibleCardsCount();
      const maxIndex = Math.max(0, cards.length - visibleCards);
      if (currentIndex >= maxIndex) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      updateCarousel();
      resetAutoplay();
    });
  }

  // Event Listeners for Autoplay Pause/Resume on Hover
  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', startAutoplay);

  // Touch/Swipe Support for Mobile/Tablet
  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
    stopAutoplay();
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diffX = startX - currentX;

    if (Math.abs(diffX) > 50) {
      const visibleCards = getVisibleCardsCount();
      const maxIndex = Math.max(0, cards.length - visibleCards);

      if (diffX > 0) {
        // Swiped left -> next card
        if (currentIndex < maxIndex) {
          currentIndex++;
          updateCarousel();
        }
      } else {
        // Swiped right -> prev card
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      }
      isSwiping = false; // trigger once per swipe action
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    isSwiping = false;
    startAutoplay();
  }, { passive: true });

  // Window Resize handling
  window.addEventListener('resize', () => {
    const visibleCards = getVisibleCardsCount();
    const maxIndex = Math.max(0, cards.length - visibleCards);
    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }
    setupDots();
    updateCarousel();
  });

  // Initial load
  setupDots();
  updateCarousel();
  startAutoplay();
}

/**
 * 6. Testimonials Carousel - Autoplay and Touch Swipe on Mobile only
 */
function initDepoimentosCarousel() {
  const container = document.querySelector('.depoimentos-carousel-container');
  const track = document.getElementById('depoimentos-carousel-track');
  if (!container || !track) return;

  const cards = track.querySelectorAll('.card-depoimento');
  if (cards.length === 0) return;

  const gap = 20; // 20px gap in CSS on mobile
  let currentIndex = 0;
  let autoplayInterval;
  let startX = 0;
  let isSwiping = false;

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function updateCarousel() {
    if (!isMobile()) {
      track.style.transform = ''; // Clear inline styles on desktop
      const wrapper = container.querySelector('.depoimentos-carousel-track-wrapper');
      if (wrapper) wrapper.style.height = '';
      return;
    }

    const cardWidth = cards[0].offsetWidth;
    const translateX = currentIndex * (cardWidth + gap);
    track.style.transform = `translate3d(-${translateX}px, 0, 0)`;

    // Update dots
    const dots = container.querySelectorAll('.depoimentos-carousel-dots .dot');
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function setupDots() {
    const dotsContainer = document.getElementById('depoimentos-carousel-dots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';
    if (!isMobile()) return;

    for (let i = 0; i < cards.length; i++) {
      const dot = document.createElement('span');
      dot.classList.add('dot');
      if (i === currentIndex) {
        dot.classList.add('active');
      }
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateCarousel();
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (!isMobile()) return;

    autoplayInterval = setInterval(() => {
      if (currentIndex >= cards.length - 1) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      updateCarousel();
    }, 4000); // 4 seconds interval for reading testimonial text
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }


  // Event Listeners for Autoplay Pause/Resume on Hover
  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', startAutoplay);

  // Touch/Swipe Support
  container.addEventListener('touchstart', (e) => {
    if (!isMobile()) return;
    startX = e.touches[0].clientX;
    isSwiping = true;
    stopAutoplay();
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!isSwiping || !isMobile()) return;
    const currentX = e.touches[0].clientX;
    const diffX = startX - currentX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swiped left -> next card
        if (currentIndex < cards.length - 1) {
          currentIndex++;
          updateCarousel();
        }
      } else {
        // Swiped right -> prev card
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      }
      isSwiping = false;
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    isSwiping = false;
    startAutoplay();
  }, { passive: true });

  // Window Resize handling
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      stopAutoplay();
      track.style.transform = '';
      const wrapper = container.querySelector('.depoimentos-carousel-track-wrapper');
      if (wrapper) wrapper.style.height = '';
      const dotsContainer = document.getElementById('depoimentos-carousel-dots');
      if (dotsContainer) dotsContainer.innerHTML = '';
      return;
    }

    if (currentIndex >= cards.length) {
      currentIndex = cards.length - 1;
    }
    setupDots();
    updateCarousel();
    startAutoplay();
  });

  // Initial load
  setupDots();
  updateCarousel();
  startAutoplay();
}
