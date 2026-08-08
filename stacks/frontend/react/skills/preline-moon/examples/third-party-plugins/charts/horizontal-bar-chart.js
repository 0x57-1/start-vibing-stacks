<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    // Apex Horizontal Bar Chart
    (function () {
      buildChart('#hs-horizontal-bar-chart', (mode) => ({
        chart: {
          type: 'bar',
          height: 300,
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          }
        },
        series: [
          {
            name: 'Sales',
            data: [23000, 44000, 55000, 57000, 56000, 61000, 58000, 63000, 60000, 66000, 34000, 78000]
          }
        ],
        plotOptions: {
          bar: {
            horizontal: true,
            columnWidth: '16px',
            borderRadius: 0
          }
        },
        legend: {
          show: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: [
            'January', 
            'February', 
            'March', 
            'April', 
            'May', 
            'June', 
            'July', 
            'August', 
            'September', 
            'October', 
            'November', 
            'December'
          ],
          crosshairs: {
            show: false
          },
          labels: {
            style: {
              colors: varToColor('--chart-colors-xaxis-labels'),
              fontSize: '13px',
              fontFamily: 'Inter, ui-sans-serif',
              fontWeight: 400
            },
            offsetX: -2,
            formatter: (value) => value >= 1000 ? `${value / 1000}k` : value
          }
        },
        yaxis: {
          crosshairs: {
            show: false
          },
          labels: {
            align: 'left',
            minWidth: 0,
            maxWidth: 140,
            style: {
              colors: varToColor('--chart-colors-yaxis-labels'),
              fontSize: '13px',
              fontFamily: 'Inter, ui-sans-serif',
              fontWeight: 400
            },
            offsetX: -10,
            formatter: (title) => typeof title === 'string' ? title.slice(0, 3) : title
          }
        },
        states: {
          hover: {
            filter: {
              type: 'darken',
              value: 0.9
            }
          }
        },
        tooltip: {
          y: {
            formatter: (value) => `$${value >= 1000 ? `${value / 1000}k` : value}`
          },
          custom: function (props) {
            const { categories } = props.ctx.opts.xaxis;
            const { dataPointIndex } = props;
            const title = categories[dataPointIndex];
            const newTitle = `${title}`;

            return buildTooltip(props, {
              title: newTitle,
              mode,
              hasTextLabel: true,
              wrapperExtClasses: 'min-w-28',
              labelDivider: ':',
              labelExtClasses: 'ms-2'
            });
          }
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary')],
        xaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-xaxis-labels'),
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-yaxis-labels'),
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border'),
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary-inverse')],
        xaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-xaxis-labels-inverse'),
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-yaxis-labels-inverse'),
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border-inverse'),
        }
      }));
    })();
  });
</script>
