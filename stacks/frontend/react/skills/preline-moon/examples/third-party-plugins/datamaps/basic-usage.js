<script src="../../assets/vendor/preline/dist/helper-shared.js"></script>

<script>
  // Map
  (function () {
    const tabpanel = document.querySelector('#hs-users-datamap').closest('[role="tabpanel"]');
    let tabTheme = null;
    const dataSet = {
      BRA: {
        active: {
          value: '5,101',
          percent: '42.2',
          isGrown: false
        },
        new: {
          value: '444',
          percent: '41.2',
          isGrown: false
        },
        fillKey: 'MAJOR',
        short: 'br'
      },
      CHN: {
        active: {
          value: '10,101',
          percent: '13.7',
          isGrown: true
        },
        new: {
          value: '509',
          percent: '0.1',
          isGrown: false
        },
        fillKey: 'MAJOR',
        short: 'cn'
      },
      DEU: {
        active: {
          value: '8,408',
          percent: '5.4',
          isGrown: false
        },
        new: {
          value: '1001',
          percent: '5.1',
          isGrown: true
        },
        fillKey: 'MAJOR',
        short: 'de'
      },
      GBR: {
        active: {
          value: '4,889',
          percent: '9.1',
          isGrown: false
        },
        new: {
          value: '2,001',
          percent: '3.2',
          isGrown: true
        },
        fillKey: 'MAJOR',
        short: 'gb'
      },
      IND: {
        active: {
          value: '1,408',
          percent: '19.2',
          isGrown: true
        },
        new: {
          value: '392',
          percent: '11.1',
          isGrown: true
        },
        fillKey: 'MAJOR',
        short: 'in'
      },
      USA: {
        active: {
          value: '392',
          percent: '0.9',
          isGrown: true
        },
        new: {
          value: '1,408',
          percent: '2.2',
          isGrown: true
        },
        fillKey: 'MAJOR',
        short: 'us',
        customName: 'United States'
      }
    };
    const dataMap = new Datamap({
      element: document.querySelector('#hs-users-datamap'),
      projection: 'mercator',
      responsive: true,
      fills: {
        defaultFill: varToColor('--map-colors-default'),
        MAJOR: varToColor('--map-colors-primary'),
      },
      data: dataSet,
      geographyConfig: {
        borderColor: (localStorage.getItem('hs_theme') === 'dark') ? varToColor('--map-colors-border-inverse') : varToColor('--map-colors-border'),
        highlightFillColor: () => (localStorage.getItem('hs_theme') === 'dark') ? varToColor('--map-colors-highlight-inverse') : varToColor('--map-colors-highlight'),
        highlightBorderColor: () => (localStorage.getItem('hs_theme') === 'dark') ? varToColor('--map-colors-highlight-inverse') : varToColor('--map-colors-highlight'),
        popupTemplate: function (geo, data) {
          const growUp = `<svg class="size-4 text-teal-500 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </svg>`;
          const growDown = `<svg class="size-4 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
          </svg>`;

          return `<div class="bg-white rounded-xl shadow-xl w-37.5 p-3">
            <div class="flex mb-1">
              <div class="me-2">
                <div class="size-4 rounded-full bg-no-repeat bg-center bg-cover" style="background-image: url('../../assets/vendor/svg-country-flags/svg/${data.short}.svg')"></div>
              </div>
              <span class="text-sm font-medium">${data.customName || geo.properties.name}</span>
            </div>
            <div class="flex items-center">
              <span class="text-sm text-muted-foreground-1">Active:</span>
               <span class="text-sm font-medium ${data.active.value}</span>
               <span class="text-sm ${data.active.isGrown ? 'text-teal-500 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}">${data.active.percent}</span>
               ${data.active.isGrown ? growUp : growDown}
            </div>
            <div class="flex items-center">
              <span class="text-sm text-muted-foreground-1">New:</span>
               <span class="text-sm font-medium ${data.new.value}</span>
               <span class="text-sm ${data.active.isGrown ? 'text-teal-500 dark:text-teal-400' : 'text-red-500 dark:text-red-400'}">${data.new.percent}</span>
               ${data.new.isGrown ? growUp : growDown}
            </div>
          </div>`;
        }
      }
    });
    dataMap.addPlugin('update', function (_, mode) {
      this.options.fills = (mode === 'dark') ? {
        defaultFill: varToColor('--map-colors-default-inverse'),
        MAJOR: varToColor('--map-colors-primary-inverse'),
      } : {
        defaultFill: varToColor('--map-colors-default'),
        MAJOR: varToColor('--map-colors-primary'),
      };

      this.svg.selectAll('.datamaps-subunit').style('stroke', () => (mode === 'dark') ? varToColor('--map-colors-border-inverse') : varToColor('--map-colors-border'));

      this.updateChoropleth(dataSet, {reset: true});
    });

    dataMap.update(localStorage.getItem('hs_theme'));

    window.addEventListener('on-hs-appearance-change', (evt) => {
      tabTheme = evt.detail;

      dataMap.update(evt.detail);
    });

    window.addEventListener('on-hs-color-theme-change', (evt) => {
      if (tabTheme) dataMap.update(tabTheme);
      else dataMap.update(evt.detail);
    });

    if (tabpanel) tabpanel.addEventListener('on-hs-appearance-change', (evt) => {
      tabTheme = evt.detail;

      dataMap.update(tabTheme);
    });

    window.addEventListener('resize', function () {
      dataMap.resize();
    });
  })();
</script>
