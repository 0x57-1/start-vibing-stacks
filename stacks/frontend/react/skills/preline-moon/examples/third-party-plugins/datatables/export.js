<script src="../../assets/vendor/datatables.net-buttons/js/dataTables.buttons.min.js"></script>
<script src="../../assets/vendor/jszip/dist/jszip.min.js"></script>
<script src="../../assets/vendor/pdfmake/build/pdfmake.min.js"></script>
<script src="../../assets/vendor/pdfmake/build/vfs_fonts.js"></script>
<script src="../../assets/vendor/datatables.net-buttons/js/buttons.html5.min.js"></script>
<script src="../../assets/vendor/datatables.net-buttons/js/buttons.print.min.js"></script>
<script>
  window.addEventListener('load', () => {
    (function () {
      const { dataTable } = new HSDataTable('#hs-datatable-with-export');
      const buttons = document.querySelectorAll('#hs-dropdown-datatable-with-export .hs-dropdown-menu button');

      buttons.forEach((btn) => {
        const type = btn.getAttribute('data-hs-datatable-action-type');

        btn.addEventListener('click', () => dataTable.button(`.buttons-${type}`).trigger());
      });
    })();
  });
</script>
