// ============ DARK MODE TOGGLE ============
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);

  function updateIcon() {
    if (!toggle) return;
    toggle.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  updateIcon();

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateIcon();
    });
  }
})();


// ============ PROGRAM SZŰRÉS ============
const weatherMap = {
  nap: ['nap'],
  valtozekony: ['valtozekony', 'nap'],
  eso: ['eso', 'valtozekony'],
  pihi: ['pihi', 'valtozekony'],
  osszes: null
};

function filterCards(filter) {
  const cards = document.querySelectorAll('#cardsGrid .card');
  const resetBtn = document.getElementById('filterReset');

  if (filter === 'osszes' || !weatherMap[filter]) {
    cards.forEach(c => c.classList.remove('hidden'));
    resetBtn.style.display = 'none';
    return;
  }

  const allowed = weatherMap[filter];
  let shown = 0;

  cards.forEach(card => {
    const tags = (card.getAttribute('data-weather') || '').split(' ');
    const match = tags.some(t => allowed.includes(t));
    if (match) {
      card.classList.remove('hidden');
      shown++;
    } else {
      card.classList.add('hidden');
    }
  });

  resetBtn.style.display = 'block';

  // Scroll a kártyákhoz
  setTimeout(() => {
    document.getElementById('programok').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}


// ============ SMOOTH HOVER CARDS ============
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.willChange = 'transform, box-shadow';
  });
  card.addEventListener('mouseleave', () => {
    card.style.willChange = 'auto';
  });
});


// ============ ACTIVE NAV HIGHLIGHT ============
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.jump-nav a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--color-primary)';
        }
      });
    }
  });
}, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

sections.forEach(s => observer.observe(s));


// ============ DECISION CARDS HIGHLIGHT ============
document.querySelectorAll('.decision-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.decision-card').forEach(c => c.style.borderColor = '');
    card.style.borderColor = 'var(--color-primary)';
    card.style.boxShadow = 'var(--shadow-md)';
  });
});
