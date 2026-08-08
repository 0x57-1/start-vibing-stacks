<script>
  window.addEventListener('load', () => {
    (function () {
      const sortable = document.querySelector("#hs-handle-sortable");

      new Sortable(sortable, {
        animation: 150,
        handle: '.hs-handle',
        dragClass: 'rounded-none!'
      });
    })();
  });
</script>
