// Scroll-triggered reveal animations
document.addEventListener('DOMContentLoaded', () => {
  // Add 'reveal' class to major sections
  document.querySelectorAll('section, footer, .grid, .space-y-md > div, .fav-card').forEach((el, i) => {
    if (!el.classList.contains('reveal') && el.offsetTop > window.innerHeight * 0.3) {
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(i * 0.05, 0.3)}s`;
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Back to top button
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.innerHTML = '<span class="material-symbols-outlined">arrow_upward</span>';
  btn.className = 'fixed bottom-24 left-4 z-80 w-11 h-11 rounded-full bg-primary/90 text-on-primary shadow-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 opacity-0 translate-y-4 pointer-events-none';
  btn.style.cssText = 'z-index:80;';
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.style.opacity = '1';
      btn.style.transform = 'translateY(0)';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(16px)';
      btn.style.pointerEvents = 'none';
    }
  }, { passive: true });
});
