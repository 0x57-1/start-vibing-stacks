<script>
  window.addEventListener('load', () => {
    (function () {
      const range = document.querySelector('#hs-pass-values-to-html-elements');
      const rangeInstance = new HSRangeSlider(range);
      const min = document.querySelector('#hs-pass-values-to-html-elements-min-target');
      const max = document.querySelector('#hs-pass-values-to-html-elements-max-target');

      range.noUiSlider.on('update', (values) => {
        min.innerText = rangeInstance.formattedValue[0];
        max.innerText = rangeInstance.formattedValue[1];
      });
    })();
  });
</script>
