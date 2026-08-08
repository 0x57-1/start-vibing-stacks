<script>
  window.addEventListener('load', () => {
    (function () {
      const sortableLeft = document.querySelector("#hs-shared-left-sortable");
      const sortableRight = document.querySelector("#hs-shared-right-sortable");
      const options = {
        group: 'shared',
        animation: 150,
        dragClass: 'rounded-none!'
      };

      new Sortable(sortableLeft, options);
      new Sortable(sortableRight, options);
    })();
  });
</script>
