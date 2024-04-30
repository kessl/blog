const pointerSvg = `<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32px" height="32px" viewBox="0 0 600 450" overflow="visible" xml:space="preserve"><path d="M231,251h16v32h-64v16h-16v-32h64V251z M231,251v-16h-16v16H231z M215,235v-16h-16v16H215z M199,219v-16h-16v16H199z   M183,203v-16h-16v16H183z M167,187v-16h-16v16H167z M151,171v-16h-16v16H151z M135,155v-16h-16v16H135z M119,139v-16h-16v16H119z   M103,123v-16H87v16H103z M71,107h16V91H71V75H55v272h32v-16H71V107z M119,283v16h16v-16H119z M103,315h16v-16h-16V315z M87,331h16  v-16H87V331z M135,299v32h16v-32H135z M151,331v32h16v-32H151z M215,363v-32h-16v32H215z M199,331v-32h-16v32H199z M167,379h32v-16  h-32V379z"/></svg>`

function throttle(callback, limit) {
  let throttled = false
  return function (...args) {
    if (!throttled) {
      callback(...args)
      throttled = true
      window.setTimeout(function () {
        throttled = false
      }, limit)
    }
  }
}

export class Pointers {
  pointers = {}

  constructor(channel) {
    this.channel = channel

    const throttledSendMouseMove = throttle(this.channel.sendMouseMove.bind(this.channel), 100)
    document.addEventListener('mousemove', (event) => {
      throttledSendMouseMove(event.clientX / window.innerWidth, event.clientY / window.innerHeight)
    })
  }

  createPointer(x, y) {
    const template = document.createElement('template')
    template.innerHTML = pointerSvg

    const svg = template.content.firstChild
    svg.style.transition = 'all 100ms linear'
    svg.style.position = 'absolute'
    svg.style.left = `${x * window.innerWidth}px`
    svg.style.top = `${y * window.innerHeight}px`

    document.body.appendChild(svg)
    return svg
  }

  updatePointer({ client_id, x, y }) {
    if (!x || !y) {
      this.pointers[client_id]?.remove()
      delete this.pointers[client_id]
      return
    }

    this.pointers[client_id] ||= this.createPointer(x, y)
    this.pointers[client_id].style.left = `${x * window.innerWidth}px`
    this.pointers[client_id].style.top = `${y * window.innerHeight}px`
  }
}
