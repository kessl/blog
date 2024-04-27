const startStopButton = document.querySelector('#start-stop')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const a = 2 * Math.PI / 6
let r // hexagon radius

let instance = null
let running = false
let lastFrameTime = 0

let color = null
let hoverBuffer = {}
let hoverBufferTimeout = null

function initCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const cols = instance.exports.cols.value
  const rows = instance.exports.rows.value

  // choose radius so that hex grid covers entire canvas
  const widthFitRadius = (canvas.width / cols) / (Math.cos(a) - Math.cos(3 * a))
  const heightFitRadius = canvas.height / (rows * Math.sin(a))
  r = Math.min(widthFitRadius, heightFitRadius)
}

function flushHoverBuffer() {
  const { cols, memory, offset, page_size, cell_size } = instance.exports
  const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)
  for (const [x, y, color] of Object.values(hoverBuffer)) {
    const index = (y * cols.value + x) * cell_size.value
    buffer[index + 2] = color[2]
    buffer[index + 1] = color[1]
    buffer[index] = color[0]
  }

  color = null
  hoverBuffer = {}
  update()
}

const canvasToGrid = (offsetX, offsetY) => [
  Math.round(offsetX / (r * (1 + Math.cos(2 * Math.PI / 6)))),
  Math.round(offsetY / (2 * r * Math.sin(2 * Math.PI / 6))),
]

function handleCanvasMouseover(event) {
  if (!running) return

  window.clearTimeout(hoverBufferTimeout)
  hoverBufferTimeout = window.setTimeout(flushHoverBuffer, 100)

  const [x, y] = canvasToGrid(event.offsetX, event.offsetY)
  if (hoverBuffer[`${x},${y}`]) return

  if (!color) {
    const randChannel = () => ~~(Math.random() * (200 - 50) + 50)
    color = [randChannel(), randChannel(), randChannel()]
  }

  const fillStyle = `rgba(${color[2]}, ${color[1]}, ${color[0]}, 0.7)`
  drawHexagon(x, y, fillStyle)
  hoverBuffer[`${x},${y}`] = [x, y, color]
}

function handleCanvasClick(event) {
  if (running) return

  window.clearTimeout(hoverBufferTimeout) // abuse to reset color
  hoverBufferTimeout = window.setTimeout(flushHoverBuffer, 1000)

  if (!color) {
    const randChannel = () => ~~(Math.random() * (200 - 50) + 50)
    color = [randChannel(), randChannel(), randChannel()]
  }

  const { cols, memory, offset, page_size, cell_size } = instance.exports
  const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)

  const [x, y] = canvasToGrid(event.offsetX, event.offsetY)
  const index = (y * cols.value + x) * cell_size.value

  if (buffer[index + 2] && buffer[index + 1] && buffer[index]) {
    buffer[index + 2] = buffer[index + 1] = buffer[index] = 0
  } else {
    buffer[index + 2] = color[2]
    buffer[index + 1] = color[1]
    buffer[index] = color[0]
  }
  update()
}

function handleStartStop() {
  running = !running

  if (running) {
    simulate()
  } else {
    flushHoverBuffer()
  }

  startStopButton.innerHTML = running ? '&#x23F8;' : '&#x23F5;'
}

function simulate(timestamp) {
  if (!running) return

  const deltaTime = timestamp - lastFrameTime
  if (deltaTime > 110) {
    instance.exports.next_gen()
    update()
    lastFrameTime = timestamp
  }
  window.requestAnimationFrame(simulate)
}

function drawHexagon(x, y, fillStyle) {
  const canvasX = x * r * (1 + Math.cos(a))
  const canvasY = y * 2 * r * Math.sin(a) - (-1) ** x * r * Math.sin(a) / 2

  ctx.beginPath()
  for (var i = 0; i < 6; i++) {
    ctx.lineTo(canvasX + r * Math.cos(a * i), canvasY + r * Math.sin(a * i))
  }
  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
}

function render(buffer, cell_size, rows, cols) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const [x, y, color] of Object.values(hoverBuffer)) {
    if (!color[2] && !color[1] && !color[0]) continue
    const fillStyle = `rgba(${color[2]}, ${color[1]}, ${color[0]}, 0.7)`
    drawHexagon(x, y, fillStyle)
  }

  for (let i = 0; i < rows * cols * cell_size; i += cell_size) {
    if (!buffer[i + 2] && !buffer[i + 1] && !buffer[i]) continue

    const x = ~~((i / cell_size) % cols)
    const y = ~~((i / cell_size) / cols)
    const fillStyle = `rgb(${buffer[i + 2]}, ${buffer[i + 1]}, ${buffer[i]})`

    drawHexagon(x, y, fillStyle)
  }
}

function update() {
  const { page_size, cell_size, rows, cols, memory, offset } = instance.exports
  const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)
  render(buffer, cell_size.value, rows.value, cols.value)
}

async function setup() {
  instance = (await WebAssembly.instantiateStreaming(fetch('/assets/build/game.wasm'))).instance

  initCanvas()
  canvas.addEventListener('mousemove', handleCanvasMouseover)
  canvas.addEventListener('click', handleCanvasClick)
  startStopButton.addEventListener('click', handleStartStop)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  handleStartStop()
}

function debounce(callback, wait) {
  let timeoutId = null
  return (...args) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback(...args)
    }, wait)
  }
}

window.addEventListener('load', setup)
window.addEventListener('resize', debounce(initCanvas, 50))
