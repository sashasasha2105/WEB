// === File: instruction/instruction.js ===

document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.step');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  steps.forEach(step => observer.observe(step));
});