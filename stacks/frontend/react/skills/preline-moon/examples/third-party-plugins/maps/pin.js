<script>
  window.addEventListener('load', () => {
    (function () {
      const map = L.map('hs-pin-leaflet', {
        center: [51.5074, -0.1278],
        zoom: 14,
        // Prevent dragging over the limit
        maxBounds: [
          [40, -10],
          [60, 10]
        ],
        maxBoundsViscosity: 1.0
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 2,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      L.marker([51.5074, -0.1278]).bindPopup('This is London, UK.').addTo(map);
    })();
  });
</script>
