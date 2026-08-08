<script>
  window.addEventListener('load', () => {
    (function () {
      const range = document.querySelector('#hs-thousands-separators-and-decimal-points');
      const rangeInstance = new HSRangeSlider(range);
      const min = document.querySelector('#hs-thousands-separators-and-decimal-points-min-target');
      const max = document.querySelector('#hs-thousands-separators-and-decimal-points-max-target');

      range.noUiSlider.on('update', (values) => {
        min.innerText = rangeInstance.formattedValue[0];
        max.innerText = rangeInstance.formattedValue[1];
      });
    })();
  });
</script>
