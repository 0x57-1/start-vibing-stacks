<script>
  (function() {
    const sortable = document.querySelector("#hs-basic-usage-example-sortable");

    new Sortable(sortable, {
      animation: 150,
      dragClass: 'rounded-none!'
    });
  })();
</script>
