const rows = 50
const columns = 80

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

let running = false
let nextFrame
let lastFrameTime = 0
let generationCount = 0

const currentGen = []
const nextGen = []

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

function randomize() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      currentGen[y][x] = Math.random() > 0.8 ? 1 : 0
    }
  }
}

function createWorld() {
  let world = document.querySelector('#world')

  for (let y = 0; y < rows; y++) {
    let row = document.createElement('div')
    row.classList.add('row')

    for (let x = 0; x < columns; x++) {
      let cell = document.createElement('div')
      cell.classList.add('hex')
      cell.classList.toggle('even', x % 2 === 0)
      cell.id = `${x},${y}`
      cell.addEventListener('click', handleClickCell)
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
      y = evenRowNeighborCoords[i][0]
      x = evenRowNeighborCoords[i][1]
    } else {
      y = oddRowNeighborCoords[i][0]
      x = oddRowNeighborCoords[i][1]
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

function simulate(timestamp) {
  const deltaTime = timestamp - lastFrameTime

  if (deltaTime > 100) {
    createNextGen()
    updateCurrentGen()
    updateWorld()

    generationCount++
    document.querySelector('#gen').innerHTML = generationCount

    lastFrameTime = timestamp
  }

  if (running) {
    nextFrame = requestAnimationFrame(simulate)
  }
}

function handleStartStop(){
  const button = document.querySelector('#start-stop')

  if (!running) {
    running = true
    button.innerText = 'Stop'
    simulate()
  } else {
    running = false
    button.innerText = 'Start'
    cancelAnimationFrame(nextFrame)
  }
}

function handleRandomize() {
  randomize()
  updateWorld()
}

function handleClickCell(event) {
  const cell = event.target
  const [x, y] = cell.id.split(',').map(Number)

  if (cell.classList.contains('alive')) {
    cell.classList.remove('alive')
    currentGen[y][x] = 0
  } else {
    cell.classList.add('alive')
    currentGen[y][x] = 1
  }
}

window.onload = function () {
  createWorld()
  createGenArrays()
  document.querySelector('#start-stop').addEventListener('click', handleStartStop)
  document.querySelector('#randomize').addEventListener('click', handleRandomize)
}
