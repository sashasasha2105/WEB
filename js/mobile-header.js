document.addEventListener('DOMContentLoaded', () => {
  if (!window.matchMedia('(max-width: 767px)').matches) return;

  const header = document.getElementById('site-header');
  const burger = header.querySelector('.burger-menu');
  const heroGif = document.querySelector('.hero-gif');
  const threshold = heroGif ? heroGif.offsetHeight : 200;
  let hasAppeared = false;

  header.style.transform = 'translateY(-100%)';
  header.style.transition = 'transform 0.3s ease-out';

  window.addEventListener('scroll', () => {
    if (!hasAppeared && window.scrollY > threshold) {
      header.classList.add('mobile-visible');
      hasAppeared = true;
    } else if (hasAppeared && window.scrollY <= threshold) {
      header.classList.remove('mobile-visible', 'mobile-menu-open');
      hasAppeared = false;
    }
  });

  burger.addEventListener('click', () => {
    header.classList.toggle('mobile-menu-open');
  });

  // Обновление счётчика корзины
  let count = 0;
  try {
    const data = JSON.parse(localStorage.getItem('cartData') || '{}');
    count = (data.cameraCount || 0) + (data.memoryCount || 0);
  } catch {}
  const badge = header.querySelector('.cart-count');
  if (badge) badge.textContent = count;
});