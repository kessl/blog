const rows = 60
const columns = 100

// Even row
//         (-1, 0)
//          ____
// (0, -1) /    \ (0, 1)
// (1, -1) \____/ (1, 1)
//         (1, 0)
const evenRowNeighborCoords = [[0, -1], [-1, 0], [0, 1], [1, -1], [1, 0], [1, 1]]

// Odd row
//         (-1, -0)
//           ____
// (-1, -1) /    \ (-1, 1)
//  (0, -1) \____/  (0, 1)
//          (1, 0)
const oddRowNeighborCoords = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [1, 0], [0, 1]]

let lastFrameTime = 0

const hoverBuffer = []
let hoverBufferTimeout = null

const currentGen = []
const nextGen = []

function flushHoverBuffer() {
  hoverBuffer.length = 0
}

function handleMouseoverCell(event) {
  const cell = event.target
  const [x, y] = cell.id.split(',').map(Number)

  hoverBuffer.push([x, y])
  currentGen[y][x] = 1
  cell.classList.add('alive')

  clearTimeout(hoverBufferTimeout)
  hoverBufferTimeout = setTimeout(flushHoverBuffer, 200)
}

function createGenArrays() {
  for (let y = 0; y < rows; y++) {
    currentGen[y] = new Array(columns)
    nextGen[y] = new Array(columns)
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      currentGen[y][x] = 0
      nextGen[y][x] = 0
    }
  }
}

function createWorld() {
  let world = document.querySelector('#world')

  for (let y = 0; y < rows; y++) {
    let row = document.createElement('div')
    row.classList.add('hex-row')

    for (let x = 0; x < columns; x++) {
      let cell = document.createElement('div')
      cell.classList.add('hex')
      cell.classList.toggle('even', x % 2 === 0)
      cell.id = `${x},${y}`
      cell.addEventListener('mouseover', handleMouseoverCell)
      row.appendChild(cell)
    }
    world.appendChild(row)
  }
}

function createNextGen() {
  for (row in currentGen) {
    for (column in currentGen[row]) {
      let neighbors = getNeighborCount(row, column)
      if (neighbors === 3 || neighbors === 5) {
        nextGen[row][column] = currentGen[row][column]
      } else if (neighbors === 2 && currentGen[row][column] === 0) {
        nextGen[row][column] = 1
      } else {
        nextGen[row][column] = 0
      }
    }
  }
}

function getNeighborCount(row, column) {
  let neighbors = 0
  row = Number(row)
  column = Number(column)

  let y, x
  for (let i = 0; i < 6; i++) {
    if (column % 2) {
      [y, x] = evenRowNeighborCoords[i]
    } else {
      [y, x] = oddRowNeighborCoords[i]
    }

    if ((row + y >= 0) && (row + y < rows) && (column + x >= 0) && (column + x < columns)) {
      neighbors += currentGen[row + y][column + x]
    }
  }
  return neighbors
}

function updateCurrentGen() {
  for (row in currentGen) {
    for (col in currentGen[row]) {
      if (hoverBuffer.includes([row, col])) continue
      currentGen[row][col] = nextGen[row][col]
      nextGen[row][col] = 0
    }
  }
}

function updateWorld() {
  for (y in currentGen) {
    for (x in currentGen[y]) {
      const cell = document.getElementById(`${x},${y}`)
      cell.classList.toggle('alive', currentGen[y][x] !== 0)
    }
  }
}

function positionWorld() {
  const world = document.querySelector('#world')

  function resizeWorld() {
    const scaleX =  window.innerWidth / (world.offsetWidth - 15)
    const scaleY = window.innerHeight / (world.offsetHeight - 15)
    const scale = Math.max(scaleX, scaleY)
    world.style.transform = `scale(${scale})`
  }

  resizeWorld()
  window.addEventListener('resize', resizeWorld)
}

function simulate(timestamp) {
  const deltaTime = timestamp - lastFrameTime
  if (deltaTime > 100) {
    createNextGen()
    updateCurrentGen()
    updateWorld()
    lastFrameTime = timestamp
  }
  requestAnimationFrame(simulate)
}

window.onload = function () {
  createWorld()
  createGenArrays()
  positionWorld()
  simulate()
}
