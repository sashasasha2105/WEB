// Политика: плавные появления и «Вверх» по логотипу

document.addEventListener('DOMContentLoaded', () => {
  const elems = document.querySelectorAll('.fade-in-on-scroll');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  elems.forEach(el => io.observe(el));
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}