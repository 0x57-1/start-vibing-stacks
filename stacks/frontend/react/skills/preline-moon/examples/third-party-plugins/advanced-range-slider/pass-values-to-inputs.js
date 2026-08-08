<script>
  window.addEventListener('load', () => {
    (function () {
      const range = document.querySelector('#hs-pass-values-to-inputs');
      const rangeInstance = new HSRangeSlider(range);
      const min = document.querySelector('#hs-pass-values-to-inputs-min-target');
      const max = document.querySelector('#hs-pass-values-to-inputs-max-target');

      range.noUiSlider.on('update', (values) => {
        min.value = rangeInstance.formattedValue[0];
        max.value = rangeInstance.formattedValue[1];
      });
      min.addEventListener('input', _.debounce((evt) => rangeInstance.el.noUiSlider.set([evt.target.value, max.value]), 200));
      max.addEventListener('input', _.debounce((evt) => rangeInstance.el.noUiSlider.set([min.value, evt.target.value]), 200));
    })();
  });
</script>
