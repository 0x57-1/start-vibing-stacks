<script>
  window.addEventListener('load', () => {
    (function () {
      const customSvgIcon = `
        data:image/svg+xml,
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
      `;
      const mapWrapper = document.querySelector('#hs-change-city-leaflet-wrapper');
      const tabs = mapWrapper.querySelectorAll('[role="tablist"] [data-hs-tab]');
      const map = L.map('hs-change-city-leaflet', {
        center: [51.5074, -0.1278],
        zoom: 14,
        // Prevent dragging over the limit
        maxBounds: [
          [40, -10],
          [60, 10]
        ],
        maxBoundsViscosity: 1.0
      });
      const customIcon = L.icon({
        iconUrl: customSvgIcon,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
      const cities = [
        { coords: [51.5074, -0.1278], city: 'London', description: 'Capital of the United Kingdom.' },
        { coords: [52.4862, -1.8904], city: 'Birmingham', description: 'A major city in England’s West Midlands region.' },
        { coords: [53.8008, -1.5491], city: 'Leeds', description: 'A vibrant city in West Yorkshire, England.' }
      ];

      function createPopupContent(city, description) {
        return `
          <div>
            <h3 class="text-xl font-bold text-gray-800">${city}</h3>
            <div class="text-sm text-gray-500">${description}</div>
          </div>
        `;
      }

      function changeMapCenter(cityName) {
        const selectedCity = cities.find(city => city.city === cityName);

        if (selectedCity) {
          map.setView(selectedCity.coords, 14);
        }
      }

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        minZoom: 2,
        attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      cities.forEach(({ coords, city, description }) => {
        L.marker(coords, { icon: customIcon })
          .bindPopup(createPopupContent(city, description))
          .addTo(map);
      });

      tabs.forEach((city) => {
        city.addEventListener('click', () => {
          const cityName = city.getAttribute('data-hs-tab');

          Array.from(tabs).filter((el) => el !== city).forEach((city) => city.classList.remove('active'));
          city.classList.add('active');
          changeMapCenter(cityName);
        });
      });
    })();
  });
</script>
