<script>
  window.addEventListener('load', () => {
    (function () {
      const customSvgIcon = `
        data:image/svg+xml,
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
      `;
      const map = L.map('hs-custom-pin-leaflet', {
        center: [51.5074, -0.1278],
        zoom: 5,
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

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        minZoom: 2,
        attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      L.marker([51.5074, -0.1278], { icon: customIcon }).bindPopup('This is London, UK.').addTo(map);
    })();
  });
</script>
