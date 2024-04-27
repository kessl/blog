const startStopButton = document.querySelector('#start-stop')
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const cols = 128
const rows = 64

const a = 2 * Math.PI / 6
const r = Math.min(canvas.height / (rows * Math.sin(a)), (canvas.width / cols) / (Math.cos(a) - Math.cos(3 * a)))

let instance = null
let running = false
let lastFrameTime = 0

let color = null
const hoverBuffer = []
let hoverBufferTimeout = null

function flushHoverBuffer() {
  color = null

  const { cols, memory, offset, page_size, cell_size } = instance.exports
  const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)
  for (const [x, y, color] of hoverBuffer) {
    const index = (y * cols.value + x) * cell_size.value
    buffer[index + 2] = color[2]
    buffer[index + 1] = color[1]
    buffer[index] = color[0]
  }

  hoverBuffer.length = 0
  update(instance)
}

function setupMouseover() {
  canvas.addEventListener('mousemove', (event) => {
    if (!running) return

    const x = Math.round(event.offsetX / (r * (1 + Math.cos(2 * Math.PI / 6))))
    const y = Math.round(event.offsetY / (2 * r * Math.sin(2 * Math.PI / 6)))

    clearTimeout(hoverBufferTimeout)
    hoverBufferTimeout = setTimeout(flushHoverBuffer, 300)

    if (!color) {
      color = [~~(Math.random() * 255), ~~(Math.random() * 255), ~~(Math.random() * 255)]
    }

    const fillStyle = `rgb(${color[2]}, ${color[1]}, ${color[0]})`
    drawHexagon(x, y, fillStyle)
    hoverBuffer.push([x, y, color])
  })
}

function simulate(timestamp) {
  if (!running) return

  const deltaTime = timestamp - lastFrameTime
  if (deltaTime > 110) {
    instance.exports.next_gen()
    update(instance)
    lastFrameTime = timestamp
  }
  requestAnimationFrame(simulate)
}

function startStop() {
  running = !running

  if (running) {
    simulate()
  } else {
    flushHoverBuffer()
  }

  startStopButton.innerHTML = running ? '&#x23F8;' : '&#x23F5;'
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

function render(buffer, page_size, cell_size, rows, cols) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < hoverBuffer.length; i++) {
    const [x, y, color] = hoverBuffer[i]
    const fillStyle = `rgb(${color[2]}, ${color[1]}, ${color[0]})`
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

function update(instance) {
  const { page_size, cell_size, rows, cols, memory, offset } = instance.exports
  const buffer = new Uint8Array(memory.buffer, offset.value, page_size.value)
  render(buffer, page_size.value, cell_size.value, rows.value, cols.value)
}

async function setup() {
  instance = (await WebAssembly.instantiateStreaming(fetch('/assets/build/game.wasm'))).instance

  // instance.exports.init()
  setupMouseover()
  startStopButton.addEventListener('click', startStop)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  startStop()
}

window.addEventListener('load', setup)
