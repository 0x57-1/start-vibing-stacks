<script src="../../assets/vendor/lodash/lodash.min.js"></script>
<script src="../../assets/vendor/apexcharts/dist/apexcharts.min.js"></script>
<script src="../../assets/vendor/preline/dist/helper-shared.js"></script>
<script src="../../assets/vendor/preline/dist/helper-apexcharts.js"></script>
<script>
  window.addEventListener('load', () => {
    (function () {
      const updateForegroundChart = (foregroundParent, foreground, values) => {
        const from = (100 * values[0]) / 1000;
        const to = (100 * values[1]) / 1000;
        const width = (100 - (from + (100 - to)));

        foregroundParent.style.left = `${from}%`;
        foregroundParent.style.width = `${width}%`;
        foreground.style.width = `${foregroundParent.parentElement.clientWidth}px`;
        foreground.style.marginLeft = `${-((foregroundParent.parentElement.clientWidth / 100) * from)}px`;
      };

      const range = document.querySelector('#hs-range-with-charts');
      const rangeInstance = new HSRangeSlider(range);
      const min = document.querySelector('#hs-pass-charts-values-to-inputs-min-target');
      const max = document.querySelector('#hs-pass-charts-values-to-inputs-max-target');
      const background = document.querySelector('#hs-range-with-charts-bar-chart-background');
      const foreground = document.querySelector('#hs-range-with-charts-bar-chart-foreground');
      const foregroundParent = foreground.parentElement;

      buildChart('#hs-range-with-charts-bar-chart-background', (mode) => ({
        series: [{
          name: 'Sales',
          data: [21, 20, 24, 45, 47, 50, 60, 70, 80, 75, 65, 55, 50, 40, 30, 30, 35, 45, 50, 60, 70, 80, 75, 65, 55, 50, 40, 35, 40]
        }],
        chart: {
          height: 150,
          type: 'bar',
          sparkline: {
            enabled: true
          }
        },
        xaxis: {
          type: 'category',
          crosshairs: {
            show: false
          }
        },
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          },
          active: {
            allowMultipleDataPointsSelection: false,
            filter: {
              type: 'none'
            }
          }
        },
        tooltip: {
          enabled: false
        },
      }), () => ({
        colors: [varToColor('--chart-colors-chart-8')],
        plotOptions: {
          bar: {
            colors: {
              ranges: [{
                from: -45,
                to: 0,
                color: varToColor('--chart-colors-chart-8')
              }]
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border')
        }
      }), () => ({
        colors: [varToColor('--chart-colors-chart-8-inverse')],
        plotOptions: {
          bar: {
            colors: {
              ranges: [{
                from: -45,
                to: 0,
                color: varToColor('--chart-colors-chart-8-inverse')
              }]
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border-inverse')
        }
      }));
      buildChart('#hs-range-with-charts-bar-chart-foreground', (mode) => ({
        series: [{
          name: 'Sales',
          data: [21, 20, 24, 45, 47, 50, 60, 70, 80, 75, 65, 55, 50, 40, 30, 30, 35, 45, 50, 60, 70, 80, 75, 65, 55, 50, 40, 35, 40]
        }],
        chart: {
          height: 150,
          type: 'bar',
          sparkline: {
            enabled: true
          }
        },
        xaxis: {
          type: 'category',
          crosshairs: {
            show: false
          }
        },
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          },
          active: {
            allowMultipleDataPointsSelection: false,
            filter: {
              type: 'none'
            }
          }
        },
        tooltip: {
          enabled: false
        },
      }), () => ({
        colors: [varToColor('--chart-colors-primary')],
        plotOptions: {
          bar: {
            colors: {
              ranges: [{
                from: -45,
                to: 0,
                color: varToColor('--chart-colors-chart-8')
              }]
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border')
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary-inverse')],
        plotOptions: {
          bar: {
            colors: {
              ranges: [{
                from: -45,
                to: 0,
                color: varToColor('--chart-colors-chart-8-inverse')
              }]
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border-inverse')
        }
      }));

      range.noUiSlider.on('update', (values) => {
        min.value = rangeInstance.formattedValue[0];
        max.value = rangeInstance.formattedValue[1];

        updateForegroundChart(foregroundParent, foreground, values);
      });

      min.addEventListener('input', _.debounce((evt) => rangeInstance.el.noUiSlider.set([evt.target.value, max.value]), 200));
      max.addEventListener('input', _.debounce((evt) => rangeInstance.el.noUiSlider.set([min.value, evt.target.value]), 200));

      window.addEventListener("resize", () => updateForegroundChart(foregroundParent, foreground, range.noUiSlider.get()));
    })();
  });
</script>
