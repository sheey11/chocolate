import { localize } from "@/i18n/i18n"
import "humanizer.node"

export const corsair = {
  // see https://stackoverflow.com/a/74443361/6559890
  id: 'corsair',
  defaults: {
    width: 1,
    color: '#FF4949',
    dash: [3, 3],
  },
  afterInit: (chart: any) => {
    chart.corsair = {
      x: 0,
      y: 0,
    }
  },
  afterEvent: (chart: any, args: any) => {
    const {inChartArea} = args
    const {x, y} = args.event

    chart.corsair = {x, y, draw: inChartArea}
    chart.draw()
  },
  beforeDatasetsDraw: (chart: any, _: any, opts: any) => {
    const {ctx} = chart
    const {top, bottom} = chart.chartArea
    const {x, draw} = chart.corsair
    if (!draw) return

    ctx.save()

    ctx.beginPath()
    ctx.lineWidth = opts.width
    ctx.strokeStyle = opts.color
    ctx.setLineDash(opts.dash)
    ctx.moveTo(x, bottom)
    ctx.lineTo(x, top)
    // ctx.moveTo(left, y)
    // ctx.lineTo(right, y)
    ctx.stroke()

    ctx.restore()
  }
}

function bytes2bits(v: number) {
  return v * 8
}

function humanizeSpeed(v: any) {
  v = Math.abs(v)
  let bs = (v).bytes()

  if(bs.bits < 1024) {
    return `${bs.bits.toFixed(0)} bps`
  } else if (bs.megabytes < 128) {
    return `${bytes2bits(bs.megabytes).toFixed(1)} Mbps`
  } else if (bs.gigabytes < 128) {
    return `${bytes2bits(bs.gigabytes).toFixed(1)} Gbps`
  } else if (bs.terabytes < 128) {
    return `${bytes2bits(bs.terabytes).toFixed(1)} Tbps`
  }
  return `${v} Bps`
}

function percentize(v: number) {
  return `${(v * 100).toFixed(2)}%`
}

function getLabelCallback(lang: string, valueFormatter: (arg0: number) => string) {
  return (context: any) => {
    let name = context.dataset.label || '';
    name = localize(lang, name)
    let value = valueFormatter(context.parsed.y)
    return `${name}: ${value}`
  }
}

function tooltips(lang: string, valueFormatter: (arg0: number) => string) {
  return {
    interaction: {
      intersect: false,
      mode: 'index' as 'index',
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
        animation: {
          duration: 100,
        },
        callbacks: {
          label: getLabelCallback(lang, valueFormatter),
        }
      },
      corsair: {
        color: '#71717a',
      }
    },
    hover: {
      mode: 'index' as 'index',
      intersect: false,
    },
  }
}

function animations(from: number, delay?: number) {
  let delayOptions = delay ? { animation: { delay: delay } } : {}
  return {
    ...delayOptions,
    animations: {
      y: {
        easing: 'easeOutExpo' as 'easeOutExpo',
        duration: 600,
        from: (ctx: any) => {
          if(ctx.type === 'data' && ctx.mode === 'default' && !ctx.animated) {
            ctx.animated = true
            return from
          }
        },
      },
    },
  }
}

const aspectRatio = {
  responsive: true,
  maintainAspectRatio: false,
}

const noPoints = {
  elements: {
    point: {
      pointStyle: false as false,
    },
  },
}

export function getMiniChartOptions(delay?: number) {
  return {
    ...aspectRatio,
    ...noPoints,
    ...animations(80, delay),
    plugins: {
      tooltip: {
        enabled: false,
      },
    },
    layout: {
      padding: {
        bottom: -10,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { display: false }, },
      y: { grid: { display: false }, border: { display: false }, ticks: { display: false }, },
    },
  }
}

export function getNetworkChartOptions(lang: string, delay?: number) {
  return {
    ...aspectRatio,
    ...noPoints,
    ...animations(100, delay),
    ...tooltips(lang, humanizeSpeed),
    scales: {
      x: { grid: { display: false, }, ticks: { display: false, }, },
      y: {
        border: { display: false, },
        ticks: {
          callback: humanizeSpeed,
        },
      }
    },
  }
}

export function getPerfChartOptions(lang: string, delay?: number) {
  return {
    ...aspectRatio,
    ...noPoints,
    ...animations(200, delay),
    ...tooltips(lang, percentize),
    scales: {
      x: { ticks: { display: false, }, border: { display: false, }, grid: { display: false, }, },
      y: {
        ticks: {
          format: {
            style: 'percent',
          },
        },
      }
    },
  }
}

export function getDiskChartOptions(lang: string, delay?: number) {
  return {
    ...getNetworkChartOptions(lang),
    ...animations(75, delay),
    ...tooltips(lang, humanizeSpeed),
  }
}
