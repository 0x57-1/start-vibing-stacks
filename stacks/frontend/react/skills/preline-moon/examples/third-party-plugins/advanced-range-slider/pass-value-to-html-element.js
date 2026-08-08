<script>
  window.addEventListener('load', () => {
    (function () {
      const range = document.querySelector('#hs-pass-value-to-html-element');
      const rangeInstance = new HSRangeSlider(range);
      const target = document.querySelector('#hs-pass-value-to-html-element-target');

      range.noUiSlider.on('update', (values) => target.innerText = rangeInstance.formattedValue);
    })();
  });
</script>
