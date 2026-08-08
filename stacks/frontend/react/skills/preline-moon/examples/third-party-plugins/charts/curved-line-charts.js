<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    // Apex Curved Line Charts
    (function () {
      buildChart('#hs-curved-line-charts', (mode) => ({
        chart: {
          height: 250,
          type: 'line',
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
            data: [0, 27000, 25000, 27000, 40000]
          },
          {
            name: 'Outcome',
            data: [19500, 10000, 19000, 17500, 26000]
          },
          {
            name: 'Others',
            data: [8000, 2200, 6000, 9000, 10000]
          }
        ],
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: [4, 4, 4],
          dashArray: [0, 0, 4]
        },
        title: {
          show: false
        },
        legend: {
          show: false
        },
        grid: {
          strokeDashArray: 0,
          borderColor: varToColor('--chart-colors-grid-border'),
          padding: {
            top: -20,
            right: 0
          }
        },
        xaxis: {
          type: 'category',
          categories: [
            '25 January 2023',
            '28 January 2023',
            '31 January 2023',
            '1 February 2023',
            '3 February 2023'
          ],
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          },
          tooltip: {
            enabled: false
          },
          labels: {
            offsetY: 5,
            style: {
              colors: varToColor('--chart-colors-xaxis-labels'),
              fontSize: '13px',
              fontFamily: 'Inter, ui-sans-serif',
              fontWeight: 400
            },
            formatter: (title) => {
              let t = title;

              if (t) {
                const newT = t.split(' ');
                t = `${newT[0]} ${newT[1].slice(0, 3)}`;
              }

              return t;
            }
          }
        },
        yaxis: {
          min: 0,
          max: 40000,
          tickAmount: 4,
          labels: {
            align: 'left',
            minWidth: 0,
            maxWidth: 140,
            style: {
              colors: varToColor('--chart-colors-yaxis-labels'),
              fontSize: '12px',
              fontFamily: 'Inter, ui-sans-serif',
              fontWeight: 400
            },
            formatter: (value) => value >= 1000 ? `${value / 1000}k` : value
          }
        },
        tooltip: {
          custom: function (props) {
            const { categories } = props.ctx.opts.xaxis;
            const { dataPointIndex } = props;
            const title = categories[dataPointIndex].split(' ');
            const newTitle = `${title[0]} ${title[1]}`;

            return buildTooltip(props, {
              title: newTitle,
              mode,
              hasTextLabel: true,
              wrapperExtClasses: 'min-w-36',
              labelDivider: ':',
              labelExtClasses: 'ms-2'
            });
          }
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary'), varToColor('--chart-colors-chart-6'), varToColor('--chart-colors-chart-10')],
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
        colors: [varToColor('--chart-colors-primary-inverse'), varToColor('--chart-colors-chart-6-inverse'), varToColor('--chart-colors-chart-10-inverse')],
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
