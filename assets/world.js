const randChannel = () => ~~(Math.random() * (200 - 50) + 50)

function debounce(callback, wait) {
  let timeoutId = null
  return (...args) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback(...args)
    }, wait)
  }
}

export class World {
  instance = null
  running = false
  lastFrameTime = 0

  color = null
  clientPaintBuffers = { [undefined]: {} }
  paintBufferTimeout = null

  a = 2 * Math.PI / 6

  constructor(canvas, startStopButton) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.startStopButton = startStopButton

    window.addEventListener('load', this.setup.bind(this))
    window.addEventListener('resize', debounce(this.initCanvas.bind(this)), 50)
  }

  initCanvas() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    const cols = this.instance.exports.cols.value
    const rows = this.instance.exports.rows.value

    // choose radius so that hex grid covers entire canvas
    const widthFitRadius = (this.canvas.width / cols) / (Math.cos(this.a) - Math.cos(3 * this.a))
    const heightFitRadius = this.canvas.height / (rows * Math.sin(this.a))
    this.r = Math.min(widthFitRadius, heightFitRadius)
  }

  flushPaintBuffer(client_id) {
    const { cols, memory, offset, page_size, cell_size } = this.instance.exports
    const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)
    for (const [x, y, color] of Object.values(this.clientPaintBuffers[client_id])) {
      const index = (y * cols.value + x) * cell_size.value
      buffer[index + 2] = color[2]
      buffer[index + 1] = color[1]
      buffer[index] = color[0]
    }

    this.color = null
    this.clientPaintBuffers[client_id] = {}
    this.update()

    if (!client_id) {
      this.onFlushPaintBuffer?.()
    }
  }

  gridToCanvas(x, y) {
    return [
      x * this.r * (1 + Math.cos(this.a)),
      y * 2 * this.r * Math.sin(this.a) - (-1) ** x * this.r * Math.sin(this.a) / 2,
    ]
  }

  canvasToGrid(offsetX, offsetY) {
    return [
      Math.round(offsetX / (this.r * (1 + Math.cos(this.a)))),
      Math.round(offsetY / (2 * this.r * Math.sin(this.a))),
    ]
  }

  pushCell(client_id, x, y, color) {
    this.clientPaintBuffers[client_id] ||= {}
    this.clientPaintBuffers[client_id][`${x},${y}`] = [x, y, color]
  }

  handleCanvasMouseover(event) {
    if (!this.running) return

    window.clearTimeout(this.paintBufferTimeout)
    this.paintBufferTimeout = window.setTimeout(this.flushPaintBuffer.bind(this), 200)

    const [x, y] = this.canvasToGrid(event.offsetX, event.offsetY)
    if (this.clientPaintBuffers[undefined][`${x},${y}`]) return

    if (!this.color) {
      this.color = [randChannel(), randChannel(), randChannel()]
    }

    const fillStyle = `rgba(${this.color[2]}, ${this.color[1]}, ${this.color[0]}, 0.7)`
    this.drawHexagon(x, y, fillStyle)
    this.clientPaintBuffers[undefined][`${x},${y}`] = [x, y, this.color]
    this.onPushPaintBuffer?.(x, y, this.color)
  }

  handleCanvasClick(event) {
    if (this.running) return

    window.clearTimeout(this.paintBufferTimeout) // abuse to reset color
    this.paintBufferTimeout = window.setTimeout(this.flushPaintBuffer.bind(this), 1000)

    if (!this.color) {
      this.color = [randChannel(), randChannel(), randChannel()]
    }

    const { cols, memory, offset, page_size, cell_size } = this.instance.exports
    const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)

    const [x, y] = this.canvasToGrid(event.offsetX, event.offsetY)
    const index = (y * cols.value + x) * cell_size.value

    if (buffer[index + 2] && buffer[index + 1] && buffer[index]) {
      buffer[index + 2] = buffer[index + 1] = buffer[index] = 0
    } else {
      buffer[index + 2] = this.color[2]
      buffer[index + 1] = this.color[1]
      buffer[index] = this.color[0]
    }
    this.onPushPaintBuffer?.(x, y, this.color)
    this.update()
  }

  handleStartStop() {
    this.running = !this.running

    if (this.running) {
      this.simulate()
    } else {
      this.flushPaintBuffer()
    }

    this.startStopButton.innerHTML = this.running ? '&#x23F8;' : '&#x23F5;'
  }

  simulate(timestamp) {
    if (!this.running) return

    const deltaTime = timestamp - this.lastFrameTime
    if (deltaTime > 110) {
      this.instance.exports.next_gen()
      this.update()
      this.lastFrameTime = timestamp
    }
    window.requestAnimationFrame(this.simulate.bind(this))
  }

  drawHexagon(x, y, fillStyle) {
    const [canvasX, canvasY] = this.gridToCanvas(x, y)

    this.ctx.beginPath()
    for (var i = 0; i < 6; i++) {
      this.ctx.lineTo(canvasX + this.r * Math.cos(this.a * i), canvasY + this.r * Math.sin(this.a * i))
    }
    this.ctx.closePath()
    this.ctx.fillStyle = fillStyle
    this.ctx.fill()
  }

  render(buffer, cell_size, rows, cols) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const paintCells = Object.values(this.clientPaintBuffers).flatMap(buffer => Object.values(buffer))
    for (const [x, y, color] of paintCells) {
      if (!color[2] && !color[1] && !color[0]) continue
      const fillStyle = `rgba(${color[2]}, ${color[1]}, ${color[0]}, 0.7)`
      this.drawHexagon(x, y, fillStyle)
    }

    for (let i = 0; i < rows * cols * cell_size; i += cell_size) {
      if (!buffer[i + 2] && !buffer[i + 1] && !buffer[i]) continue

      const x = ~~((i / cell_size) % cols)
      const y = ~~((i / cell_size) / cols)
      const fillStyle = `rgb(${buffer[i + 2]}, ${buffer[i + 1]}, ${buffer[i]})`

      this.drawHexagon(x, y, fillStyle)
    }
  }

  update() {
    const {page_size, cell_size, rows, cols, memory, offset} = this.instance.exports
    const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)
    this.render(buffer, cell_size.value, rows.value, cols.value)
  }

  async setup() {
    this.instance = (await WebAssembly.instantiateStreaming(fetch('/assets/build/game.wasm'))).instance

    this.initCanvas()
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseover.bind(this))
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this))
    this.startStopButton.addEventListener('click', this.handleStartStop.bind(this))

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    this.handleStartStop()
  }
}
