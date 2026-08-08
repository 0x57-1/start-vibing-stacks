<script>
  window.addEventListener('load', () => {
    (function () {
      const range = document.querySelector('#hs-pass-value-to-input');
      const rangeInstance = new HSRangeSlider(range);
      const target = document.querySelector('#hs-pass-value-to-input-target');

      range.noUiSlider.on('update', (values) => target.value = rangeInstance.formattedValue);
      target.addEventListener('input', _.debounce((evt) => rangeInstance.el.noUiSlider.set(evt.target.value)), 200);
    })();
  });
</script>
