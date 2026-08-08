<script>
  window.addEventListener('load', () => {
    (function () {
      const map = L.map('hs-custom-popover-leaflet', {
        center: [51.5074, -0.1278],
        zoom: 5,
        // Prevent dragging over the limit
        maxBounds: [
          [40, -10],
          [60, 10]
        ],
        maxBoundsViscosity: 1.0
      });
      const cities = [
        {
          coords: [51.5074, -0.1278],
          country: 'UK',
          city: 'London',
          short: 'gb',
          current: {
            value: '5,101',
            percent: '42.2',
            isGrown: false
          },
          previous: {
            value: '444',
            percent: '41.2',
            isGrown: false
          },
        },
        {
          coords: [52.4862, -1.8904],
          country: 'UK',
          city: 'Birmingham',
          short: 'gb',
          current: {
            value: '10,101',
            percent: '13.7',
            isGrown: true
          },
          previous: {
            value: '509',
            percent: '0.1',
            isGrown: false
          },
        },
        {
          coords: [53.8008, -1.5491],
          country: 'UK',
          city: 'Leeds',
          short: 'gb',
          current: {
            value: '8,408',
            percent: '5.4',
            isGrown: false
          },
          previous: {
            value: '1001',
            percent: '5.1',
            isGrown: true
          },
          }
      ];

      function createPopupContent(country, city, short, current, previous) {
        const growUp = `<svg class="size-4 text-teal-500 dark:text-teal-400 " xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`;
        const growDown = `<svg class="size-4 text-red-500 dark:text-red-400 " xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`;

        return `<div class="bg-white rounded-xl shadow-xl w-40 p-3">
          <div class="flex mb-1">
            <div class="mt-0.5 me-2">
              <div class="size-4 rounded-full bg-no-repeat bg-center bg-cover" style="background-image: url('../../assets/vendor/svg-country-flags/svg/${short}.svg')"></div>
            </div>
            <span class="text-sm font-medium">${city}, ${country}</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-sm text-gray-500 dark:text-neutral-500 ">Active:</span>
            <span class="text-sm ${current.isGrown ? 'text-teal-500 dark:text-teal-400' : 'text-red-500 dark:text-red-400'} ">${current.value}</span>
            ${current.isGrown ? growUp : growDown}
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-sm text-gray-500 dark:text-neutral-500 ">New:</span>
            <span class="text-sm ${previous.isGrown ? 'text-teal-500 dark:text-teal-400' : 'text-red-500 dark:text-red-400'} ">${previous.value}</span>
            ${previous.isGrown ? growUp : growDown}
          </div>
        </div>`;
      }

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        minZoom: 2,
        attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      cities.forEach(({ coords, country, city, short, current, previous }) => {
        L.marker(coords)
          .bindPopup(createPopupContent(country, city, short, current, previous))
          .addTo(map);
      });
    })();
  });
</script>
