<script src="../../assets/vendor/datatables.net-fixedheader/js/dataTables.fixedHeader.min.js"></script>

<script>
  window.addEventListener('load', () => {
    (function () {
      function getHeaderOffset() {
        if (window.innerWidth <= 769) return 100;
        else if (window.innerWidth <= 1024) return 112;
        else return 55;
      };

      function updateHeaderOffset(table) {
        const headerOffset = getHeaderOffset();
        const fixedHeader = table.dataTable.fixedHeader;

        fixedHeader.headerOffset(headerOffset);
        fixedHeader.adjust();
      };

      function adjustFixedHeaderParentWidth() {
        const tableContainerWidth = document.querySelector('#hs-datatable-fixed-header .overflow-x-auto').clientWidth;
        const fixedHeaderParent = document.querySelector('.dtfh-floatingparent');

        if (fixedHeaderParent) fixedHeaderParent.style.width = `${tableContainerWidth}px`;
      };

      const tableContainer = document.querySelector('#hs-datatable-fixed-header .overflow-x-auto');
      const datatable = new HSDataTable('#hs-datatable-fixed-header', {
        fixedHeader: {
          header: true,
          headerOffset: getHeaderOffset()
        },
      });
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) adjustFixedHeaderParentWidth();
        });
      });
      const fixedHeaderParent = document.querySelector('.dtfh-floatingparent');

      adjustFixedHeaderParentWidth();

      if (fixedHeaderParent) {
        observer.observe(fixedHeaderParent, {
          childList: true,
          subtree: true
        });
      }

      tableContainer.addEventListener('scroll', (evt) => {
        const scrollLeft = evt.target.scrollLeft;
        const fixedHeaderFloating = document.querySelector('.fixedHeader-floating');

        if (fixedHeaderFloating) fixedHeaderFloating.style.transform = `translateX(${-scrollLeft}px)`;
      });

      window.addEventListener('resize', () => {
        updateHeaderOffset(datatable);
        adjustFixedHeaderParentWidth();
      });
    })();
  });  
</script>
