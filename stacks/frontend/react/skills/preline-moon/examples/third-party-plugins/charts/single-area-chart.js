<script src="https://preline.co/assets/js/hs-shared-helpers.js"></script>
<script src="https://preline.co/assets/js/hs-apexcharts-helpers.js"></script>
<script>
  window.addEventListener('load', () => {
    // Apex Single Area Chart
    (function () {
      buildChart('#hs-single-area-chart', (mode) => ({
        chart: {
          height: 300,
          type: 'area',
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          }
        },
        series: [
          {
            name: 'Visitors',
            data: [180, 51, 60, 38, 88, 50, 40, 52, 88, 80, 60, 70]
          }
        ],
        legend: {
          show: false
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'straight',
          width: 2
        },
        grid: {
          strokeDashArray: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            type: 'vertical',
            shadeIntensity: 1,
            opacityFrom: 0.1,
            opacityTo: 0.8
          }
        },
        xaxis: {
          type: 'category',
          tickPlacement: 'on',
          categories: [
            '25 January 2023',
            '26 January 2023',
            '27 January 2023',
            '28 January 2023',
            '29 January 2023',
            '30 January 2023',
            '31 January 2023',
            '1 February 2023',
            '2 February 2023',
            '3 February 2023',
            '4 February 2023',
            '5 February 2023'
          ],
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          },
          crosshairs: {
            stroke: {
              dashArray: 0
            },
            dropShadow: {
              show: false
            }
          },
          tooltip: {
            enabled: false
          },
          labels: {
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
        tooltip: {
          x: {
            format: 'MMMM yyyy'
          },
          y: {
            formatter: (value) => `${value >= 1000 ? `${value / 1000}k` : value}`
          },
          custom: function (props) {
            const { categories } = props.ctx.opts.xaxis;
            const { dataPointIndex } = props;
            const title = categories[dataPointIndex].split(' ');
            const newTitle = `${title[0]} ${title[1]}`;

            return buildTooltip(props, {
              title: newTitle,
              mode,
              valuePrefix: '',
              hasTextLabel: true,
              wrapperExtClasses: 'min-w-28'
            });
          }
        },
        responsive: [{
          breakpoint: 568,
          options: {
            chart: {
              height: 300
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
        colors: [varToColor('--chart-colors-primary-hex')],
        fill: {
          gradient: {
            shadeIntensity: .1,
            opacityFrom: .5,
            opacityTo: 0,
            stops: [50, 100, 100, 100]
          }
        },
        xaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-xaxis-labels')
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: varToColor('--chart-colors-yaxis-labels')
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border')
        }
      }), () => ({
        colors: [varToColor('--chart-colors-primary-hex-inverse')],
        fill: {
          gradient: {
            shadeIntensity: .1,
            opacityFrom: .5,
            opacityTo: 0,
            stops: [50, 100, 100, 100]
          }
        },
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
              colors: varToColor('--chart-colors-yaxis-labels-inverse')
            }
          }
        },
        grid: {
          borderColor: varToColor('--chart-colors-grid-border-inverse')
        }
      }));
    })();
  });
</script>
