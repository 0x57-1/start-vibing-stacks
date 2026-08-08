<script src="../../assets/vendor/preline/dist/helper-shared.js"></script>

<script>
  window.addEventListener('load', () => {
    let currentTheme = localStorage.getItem('hs_theme');
    const map = L.map('hs-pro-chrm', {
      center: [51.5074, 15],
      zoom: 3,
      zoomControl: false,
      // Prevent dragging over the limit
      maxBounds: [
        [-90, -180],
        [90, 180]
      ],
      maxBoundsViscosity: 1.0
    });
    const maxRadius = 700000;
    const circles = [];
    const dataPoints = [
      { lat: 51.5, lng: -0.12, country: 'UK', city: 'London', short: 'gb', percentage: 50, current: { value: '8,408', percent: '5.4', isGrown: false }, previous: { value: '1,001', percent: '5.1', isGrown: true } },
      { lat: 48.8566, lng: 2.3522, country: 'France', city: 'Paris', short: 'fr', percentage: 55, current: { value: '5,101', percent: '42.2', isGrown: false }, previous: { value: '444', percent: '41.2', isGrown: false } },
      { lat: 52.52, lng: 13.405, country: 'Germany', city: 'Berlin', short: 'de', percentage: 30, current: { value: '7,000', percent: '25.5', isGrown: true }, previous: { value: '3,000', percent: '20.1', isGrown: true } },
      { lat: 41.9028, lng: 12.4964, country: 'Italy', city: 'Rome', short: 'it', percentage: 50, current: { value: '9,100', percent: '30.4', isGrown: false }, previous: { value: '7,500', percent: '25.2', isGrown: false } },
      { lat: 52.2297, lng: 21.0122, country: 'Poland', city: 'Warsaw', short: 'pl', percentage: 50, current: { value: '5,100', percent: '40.2', isGrown: true }, previous: { value: '4,000', percent: '35.1', isGrown: true } },
      { lat: 55.7558, lng: 37.6173, country: 'Russia', city: 'Moscow', short: 'ru', percentage: 50, current: { value: '15,500', percent: '25.3', isGrown: true }, previous: { value: '12,000', percent: '24.8', isGrown: true } },
      { lat: 41.2995, lng: 69.2401, country: 'Uzbekistan', city: 'Tashkent', short: 'uz', percentage: 50, current: { value: '15,500', percent: '25.3', isGrown: true }, previous: { value: '12,000', percent: '24.8', isGrown: true } },
      { lat: 31.7683, lng: 35.2137, country: 'Israel', city: 'Jerusalem', short: 'il', percentage: 50, current: { value: '9,000', percent: '15.0', isGrown: true }, previous: { value: '7,800', percent: '14.8', isGrown: true } },
      { lat: 30.0444, lng: 31.2357, country: 'Egypt', city: 'Cairo', short: 'eg', percentage: 40, current: { value: '4,500', percent: '7.8', isGrown: false }, previous: { value: '4,700', percent: '8.1', isGrown: false } },
      { lat: 35.6892, lng: 51.389, country: 'Iran', city: 'Tehran', short: 'ir', percentage: 50, current: { value: '13,000', percent: '21.5', isGrown: true }, previous: { value: '10,900', percent: '20.0', isGrown: true } },
      { lat: 9.082, lng: 8.6753, country: 'Nigeria', city: 'Abuja', short: 'ng', percentage: 50, current: { value: '11,500', percent: '18.2', isGrown: true }, previous: { value: '10,200', percent: '17.5', isGrown: true } },
      { lat: 28.6139, lng: 77.209, country: 'India', city: 'New Delhi', short: 'in', percentage: 30, current: { value: '22,000', percent: '35.6', isGrown: true }, previous: { value: '20,000', percent: '34.2', isGrown: true } },
      { lat: 23.685, lng: 90.3563, country: 'Bangladesh', city: 'Dhaka', short: 'bd', percentage: 50, current: { value: '8,500', percent: '13.7', isGrown: true }, previous: { value: '7,800', percent: '12.9', isGrown: true } },
      { lat: 15.870, lng: 100.992, country: 'Thailand', city: 'Bangkok', short: 'th', percentage: 30, current: { value: '7,200', percent: '11.6', isGrown: false }, previous: { value: '7,500', percent: '12.0', isGrown: false } },
      { lat: 14.0583, lng: 108.2772, country: 'Vietnam', city: 'Hanoi', short: 'vn', percentage: 50, current: { value: '6,800', percent: '11.2', isGrown: true }, previous: { value: '6,200', percent: '10.8', isGrown: true } },
      { lat: 4.2105, lng: 101.9758, country: 'Malaysia', city: 'Kuala Lumpur', short: 'my', percentage: 50, current: { value: '6,000', percent: '9.9', isGrown: true }, previous: { value: '5,500', percent: '9.1', isGrown: true } },
      { lat: 1.3521, lng: 103.8198, country: 'Singapore', city: 'Singapore', short: 'sg', percentage: 50, current: { value: '5,700', percent: '9.5', isGrown: false }, previous: { value: '6,000', percent: '9.8', isGrown: false } },
      { lat: -0.7893, lng: 113.9213, country: 'Indonesia', city: 'Jakarta', short: 'id', percentage: 70, current: { value: '25,000', percent: '40.0', isGrown: true }, previous: { value: '23,000', percent: '38.5', isGrown: true } },
      { lat: 35.6895, lng: 139.6917, country: 'Japan', city: 'Tokyo', short: 'jp', percentage: 50, current: { value: '20,000', percent: '32.0', isGrown: true }, previous: { value: '18,500', percent: '31.0', isGrown: true } },
      { lat: 40.7128, lng: -74.006, country: 'USA', city: 'New York', short: 'us', percentage: 60, current: { value: '15,000', percent: '25.0', isGrown: true }, previous: { value: '12,000', percent: '20.0', isGrown: true } },
      { lat: 34.0522, lng: -118.2437, country: 'USA', city: 'Los Angeles', short: 'us', percentage: 50, current: { value: '12,500', percent: '22.5', isGrown: true }, previous: { value: '10,000', percent: '20.0', isGrown: true } },
      { lat: 41.8781, lng: -87.6298, country: 'USA', city: 'Chicago', short: 'us', percentage: 45, current: { value: '10,000', percent: '18.0', isGrown: false }, previous: { value: '11,000', percent: '19.5', isGrown: false } },
      { lat: 29.7604, lng: -95.3698, country: 'USA', city: 'Houston', short: 'us', percentage: 40, current: { value: '8,000', percent: '14.5', isGrown: true }, previous: { value: '7,000', percent: '13.0', isGrown: true } },
      { lat: 33.749, lng: -84.388, country: 'USA', city: 'Atlanta', short: 'us', percentage: 35, current: { value: '7,500', percent: '13.0', isGrown: true }, previous: { value: '6,800', percent: '12.5', isGrown: true } }
    ];
    const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      minZoom: 2,
      attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
    });
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      minZoom: 2,
      attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
    });
    const setInitialTheme = (theme) => {
      if (theme === 'dark') {
        darkLayer.addTo(map);
      } else {
        lightLayer.addTo(map);
      }
    };
    const changeTheme = (theme) => {
      if (theme === 'default' || theme === 'light') {
        map.removeLayer(darkLayer);
        map.addLayer(lightLayer);
        circles.forEach(({ circle }) => {
          circle.setStyle({ fillColor: varToColor('--map-colors-primary') });
        });
      } else {
        map.removeLayer(lightLayer);
        map.addLayer(darkLayer);
        circles.forEach(({ circle }) => {
          circle.setStyle({ fillColor: varToColor('--map-colors-primary-inverse') });
        });
      }
    };

    setInitialTheme(currentTheme);

    L.control.zoom({
      position: 'topright'
    }).addTo(map);


    let currentHoveredCircle = null;
    let isOnPopover = false;

    dataPoints.forEach((point, index) => {
      const baseMaxRadius = 700000;
      const zoom = map.getZoom();
      const baseZoom = 3;
      const scalePerZoom = 2;
      const scaleFactor = 1 / Math.pow(scalePerZoom, (zoom - baseZoom));
      const initialRadius = (point.percentage / 100) * baseMaxRadius * scaleFactor;
      const maxRadius = initialRadius * 0.25;
      const animationDuration = 6000;
      const delay = index * 800;
      let startTime = null;

      const circle = L.circle([point.lat, point.lng], {
        fillColor: currentTheme === 'default' || currentTheme === 'light' ? varToColor('--map-colors-primary') : varToColor('--map-colors-primary-inverse'),
        fillOpacity: 0.6,
        radius: initialRadius,
        color: null,
        weight: 0
      }).addTo(map);
      const { city, country, short, current, previous } = point;
      const growUp = `<svg class="size-4 text-emerald-500 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`;
      const growDown = `<svg class="size-4 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`;
      const popupContent = `<div class="bg-white rounded-[12px] shadow-xl w-40 p-3">
        <div class="flex mb-1">
          <div class="mt-0.5 me-2">
            <div class="size-4 rounded-full bg-no-repeat bg-center bg-cover" style="background-image: url('../../assets/vendor/svg-country-flags/svg/${short}.svg')"></div>
          </div>
          <span class="text-sm font-medium">${city}, ${country}</span>
        </div>
        <div class="flex items-center space-x-1">
          <span class="text-sm text-muted-foreground-1">Active:</span>
          <span class="text-sm ${current.isGrown ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">${current.value}</span>
          ${current.isGrown ? growUp : growDown}
        </div>
        <div class="flex items-center space-x-1">
          <span class="text-sm text-muted-foreground-1">New:</span>
          <span class="text-sm ${previous.isGrown ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">${previous.value}</span>
          ${previous.isGrown ? growUp : growDown}
        </div>
      </div>`;

      const animatePulse = (timestamp) => {
        if (!startTime) startTime = timestamp;

        const elapsed = (timestamp - startTime + delay) % animationDuration;
        const progress = elapsed / animationDuration;

        const easing = Math.sin(progress * Math.PI) * Math.sin(progress * Math.PI * 0.5);
        const currentRadius = initialRadius + (maxRadius - initialRadius) * easing;

        circle.setRadius(currentRadius);

        requestAnimationFrame(animatePulse);
      };

      requestAnimationFrame(animatePulse);

      circles.push({
        circle,
        data: point
      });

      circle.on('mouseover', function () {
        circle.bindPopup(popupContent, { closeButton: false }).openPopup();
      });

      circle.on('mouseout', function () {
        map.closePopup();
      });
    });

    map.on('zoomend', () => {
      const zoom = map.getZoom();
      const baseZoom = 3;
      const scalePerZoom = 1.5;
      const scaleFactor = 1 / Math.pow(scalePerZoom, (zoom - baseZoom));

      circles.forEach(({ circle, data }) => {
        const newRadius = (data.percentage / 100) * maxRadius * scaleFactor;

        circle.setRadius(newRadius);
      });
    });

    window.addEventListener('on-hs-appearance-change', (evt) => {
      currentTheme = evt.detail;

      return changeTheme(evt.detail);
    });
    window.addEventListener('on-hs-color-theme-change', () => changeTheme(currentTheme));
  });
</script>
