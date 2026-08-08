<script src="../../assets/vendor/lodash/lodash.min.js"></script>
<script>
  window.addEventListener('load', () => {
    (function() {
      const tabs = HSTabs.getInstance("#hs-tabs-centered", true);
      const scrollNav = HSScrollNav.getInstance('#hs-scroll-nav-tabs-centered', true);

      tabs.element.on('change', ({ el }) => {
        scrollNav.element.centerElement(el);
      });

      window.addEventListener('resize', _.debounce(()=> {
        scrollNav.element.centerElement(tabs.element.current);
      }, 100));
    })();
  });
</script>
