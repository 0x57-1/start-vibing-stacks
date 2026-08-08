<script>
  window.addEventListener('load', () => {
    (function () {
      const sortables = document.querySelectorAll("#hs-nested-sortable .nested-sortable");

      for (var i = 0; i < sortables.length; i++) {
        new Sortable(sortables[i], {
          group: 'nested',
          animation: 150,
          fallbackOnBody: true,
          swapThreshold: 0.65
        });
      }
    })();
  });
</script>
