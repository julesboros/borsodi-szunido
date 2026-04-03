// ============ PWA SERVICE WORKER ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW error:', err));
  });
}

// ============ DARK MODE TOGGLE ============
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
      localStorage.setItem('theme', theme);
      updateIcon();
    });
  }
})();

// ============ WEATHER WIDGET ============
async function fetchWeather() {
  const lat = 48.2494; // Kazincbarcika
  const lon = 20.62;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await res.json();
    if (data.current_weather) {
      document.getElementById('weather-temp').innerText = Math.round(data.current_weather.temperature) + '°C';
      const code = data.current_weather.weathercode;
      let icon = '☀️';
      if (code > 0) icon = '⛅';
      if (code > 40) icon = '🌧️';
      document.getElementById('weather-icon').innerText = icon;
    }
  } catch (e) {
    console.log('Weather fetch error');
  }
}
fetchWeather();

// ============ INTERACTIVE MAP ============
let map;
function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  map = L.map('map').setView([48.18, 20.5], 11);

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

  const baseMaps = {
    "Térkép": osm,
    "Műhold": satellite
  };

  L.control.layers(baseMaps).addTo(map);

  const locations = [
    { name: "Dédestapolcsány (Lázbérc)", pos: [48.1873, 20.4851], type: "base" },
    { name: "Dédesi vár", pos: [48.163, 20.478], type: "hike" },
    { name: "Uppony-szoros", pos: [48.2198, 20.4447], type: "hike" },
    { name: "Szilvásvárad", pos: [48.1026, 20.3891], type: "hike" },
    { name: "Lillafüred", pos: [48.1018, 20.6231], type: "hike" },
    { name: "Miskolctapolca", pos: [48.074, 20.744], type: "wellness" },
    { name: "Bogács", pos: [47.905, 20.531], type: "wellness" },
    { name: "Kazincbarcika", pos: [48.2494, 20.62], type: "city" }
  ];

  locations.forEach(loc => {
    L.marker(loc.pos).addTo(map).bindPopup(`<b>${loc.name}</b>`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) initMap();
  renderFavorites();
  updateFavButtons();
});

// ============ KEDVENCEK (LOCALSTORAGE) ============
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx > -1) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavButtons();
  renderFavorites();
}

function updateFavButtons() {
  document.querySelectorAll('.btn-save').forEach(btn => {
    const id = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
    if (favorites.includes(id)) {
      btn.classList.add('active');
      btn.innerHTML = '⭐ Mentve';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '⭐ Mentés';
    }
  });
}

function renderFavorites() {
  const container = document.getElementById('favoritesGrid');
  const navBtn = document.getElementById('navKedvencek');
  const section = document.getElementById('kedvencek');

  if (favorites.length === 0) {
    section.style.display = 'none';
    navBtn.style.fontWeight = 'normal';
    return;
  }

  section.style.display = 'block';
  navBtn.style.fontWeight = 'bold';
  container.innerHTML = '';

  favorites.forEach(id => {
    // Keresés az eredeti kártyák között (egyszerűsített demo megoldás)
    const original = document.querySelector(`.card .btn-save[onclick*="${id}"]`)?.closest('.card');
    if (original) {
      const clone = original.cloneNode(true);
      // Eltávolítunk minden gombot a klónból, kivéve a törlést
      clone.querySelectorAll('button, .card-link').forEach(el => el.remove());
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-save active';
      removeBtn.innerHTML = '🗑 Eltávolítás';
      removeBtn.onclick = () => toggleFavorite(id);
      clone.appendChild(removeBtn);
      container.appendChild(clone);
    }
  });
}
renderFavorites();
updateFavButtons();

// ============ PROGRAM SZŰRÉS + CHECKLIST ============
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
  const checklistItems = document.querySelectorAll('#packingList li');

  // Checklist szűrés
  checklistItems.forEach(li => {
    const tag = li.getAttribute('data-weather');
    if (filter === 'osszes' || tag === 'all' || tag === filter) {
      li.style.opacity = '1';
      li.style.textDecoration = 'none';
    } else {
      li.style.opacity = '0.4';
    }
  });

  if (filter === 'osszes' || !weatherMap[filter]) {
    cards.forEach(c => c.classList.remove('hidden'));
    resetBtn.style.display = 'none';
    return;
  }

  const allowed = weatherMap[filter];
  cards.forEach(card => {
    const tags = (card.getAttribute('data-weather') || '').split(' ');
    const match = tags.some(t => allowed.includes(t));
    card.classList.toggle('hidden', !match);
  });

  resetBtn.style.display = 'block';
  setTimeout(() => {
    document.getElementById('programok').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ============ SMOOTH HOVER CARDS ============
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mouseenter', () => card.style.willChange = 'transform, box-shadow');
  card.addEventListener('mouseleave', () => card.style.willChange = 'auto');
});

// ============ ACTIVE NAV HIGHLIGHT ============
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.jump-nav a');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === '#' + entry.target.id ? 'var(--color-primary)' : '';
      });
    }
  });
}, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });
sections.forEach(s => observer.observe(s));
