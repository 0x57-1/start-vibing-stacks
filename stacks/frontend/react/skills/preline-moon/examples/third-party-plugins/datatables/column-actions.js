<script src="../../assets/vendor/datatables.net-colreorder/js/dataTables.colReorder.min.js"></script>
<script>
  window.addEventListener('load', () => {
    (function () {
      const { dataTable } = new HSDataTable('#hs-datatable-with-column-actions');
      const directions = document.querySelectorAll('#hs-datatable-with-column-actions thead [data-hs-datatable-col-reorder]');
      const sorting = document.querySelectorAll('#hs-datatable-with-column-actions thead [data-hs-datatable-col-sorting]');

      function updateColumnIndices() {
        const headers = document.querySelectorAll('#hs-datatable-with-column-actions thead th');

        headers.forEach((th, ind) => {
          th.setAttribute('data-hs-datatable-col-index', dataTable.column(ind).index());
        });
      }

      function moveColumn(currentIndex, direction) {
        const headers = document.querySelectorAll('#hs-datatable-with-column-actions thead th');
        const th = headers[currentIndex];
        const colIndex = parseInt(th.getAttribute('data-hs-datatable-col-index'), 10);
        const newPos = colIndex + direction;

        if (newPos >= 1 && newPos < headers.length - 1) {
          dataTable.colReorder.move(colIndex, newPos);

          updateColumnIndices();
        }
      }

      function sortColumn(colIndex, order) {
        dataTable.order([colIndex, order]).draw();
      }

      directions.forEach((btn) => {
        btn.addEventListener('click', () => {
          const th = btn.closest('th');
          const dropdown = HSDropdown.getInstance(btn.closest('.hs-dropdown'), true);
          const colIndex = Array.from(th.parentNode.children).indexOf(th);
          const direction = btn.getAttribute('data-hs-datatable-col-reorder') === 'left' ? -1 : 1;

          moveColumn(colIndex, direction);
          dropdown.element.el._floatingUI.update();
        });
      });

      sorting.forEach((btn) => {
        btn.addEventListener('click', () => {
          const th = btn.closest('th');
          const colIndex = Array.from(th.parentNode.children).indexOf(th);
          const order = btn.getAttribute('data-hs-datatable-col-sorting');

          sortColumn(colIndex, order);
        });
      });

      updateColumnIndices();
    })();
  });
</script>
