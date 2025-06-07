// File: gallery/gallery.js


document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger-menu');
  const nav    = document.querySelector('nav.main-nav');

  // Только если оба элемента найдены
  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
    document.querySelectorAll('nav.main-nav a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
      });
    });
  }
});