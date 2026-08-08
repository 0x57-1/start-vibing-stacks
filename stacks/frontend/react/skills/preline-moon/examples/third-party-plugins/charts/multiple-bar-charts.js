<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    // Apex Multiple Bar Charts
    (function () {
      buildChart('#hs-multiple-bar-charts', (mode) => ({
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
            name: 'Income',
            data: [23000, 44000, 55000, 57000, 56000, 61000, 58000, 63000, 60000, 66000, 34000, 78000]
          }, {
            name: 'Outcome',
            data: [17000, 76000, 85000, 101000, 98000, 87000, 105000, 91000, 114000, 94000, 67000, 66000]
          }
        ],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '14px',
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
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          },
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
            formatter: (title) => title.slice(0, 3)
          }
        },
        yaxis: {
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
            formatter: (value) => value >= 1000 ? `${value / 1000}k` : value
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
        },
        responsive: [{
          breakpoint: 568,
          options: {
            chart: {
              height: 300
            },
            plotOptions: {
              bar: {
                columnWidth: '14px'
              }
            },
            stroke: {
              width: 8
            },
            labels: {
              style: {
                colors: varToColor('--chart-colors-labels'),
                fontSize: '11px',
                fontFamily: 'Inter, ui-sans-serif',
                fontWeight: 400
              },
              offsetX: -2,
              formatter: (title) => title.slice(0, 3)
            },
            yaxis: {
              labels: {
                align: 'left',
                minWidth: 0,
                maxWidth: 140,
                style: {
                  colors: varToColor('--chart-colors-yaxis-labels'),
                  fontSize: '11px',
                  fontFamily: 'Inter, ui-sans-serif',
                  fontWeight: 400
                },
                formatter: (value) => value >= 1000 ? `${value / 1000}k` : value
              }
            },
          },
        }]
      }), () => ({
        colors: [varToColor('--chart-colors-primary'), varToColor('--chart-colors-chart-10')],
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
        colors: [varToColor('--chart-colors-primary-inverse'), varToColor('--chart-colors-chart-10-inverse')],
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
