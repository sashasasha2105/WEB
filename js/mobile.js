document.addEventListener('DOMContentLoaded', () => {
  // принудительно сбрасываем скролл на верх на мобильных
  if (window.innerWidth <= 768) {
    // отключаем автоматическое восстановление позиции
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }

  const header = document.getElementById('site-header');
  const hero   = document.getElementById('hero');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;  // на десктопе — ничего
    const curr = window.pageYOffset;
    if (curr > lastScroll && curr >= hero.offsetHeight) {
      header.classList.add('show');
    } else if (curr < lastScroll) {
      header.classList.remove('show');
    }
    lastScroll = curr;
  });

  // бургер-меню
  const burger = document.querySelector('.burger-menu');
  const nav    = document.querySelector('nav.main-nav');
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    document.body.classList.toggle('nav-open');
  });

  // закрываем меню и вкладки при клике по пункту
  document.querySelectorAll('nav.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');

      // свернуть все табы на странице
      document.querySelectorAll('.tab-content.open').forEach(tab => {
        tab.classList.remove('open');
      });
      document.querySelectorAll('.tab-header.opened').forEach(hdr => {
        hdr.classList.remove('opened');
      });
    });
  });

  // баннер cookies
  const banner = document.getElementById('cookie-banner');
  const accept = document.getElementById('accept-cookies');
  if (!localStorage.getItem('cookiesAccepted')) {
    banner.classList.add('show');
  }
  accept.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted','true');
    banner.classList.remove('show');
  });
});