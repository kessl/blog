const pointerHtml = (client_id) => `
  <div style="position: absolute; transition: all 100ms linear">
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 20.9999L4 3.99994L21 10.9999L14.7353 13.6848C14.2633 13.8871 13.8872 14.2632 13.6849 14.7353L11 20.9999Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div style="font: 7px monospace; position: relative; left: -10px">${client_id}</div>
  </div>
`

export class Pointers {
  pointers = {}

  createPointer(client_id, x, y) {
    const template = document.createElement('template')
    template.innerHTML = pointerHtml(client_id)

    const svg = template.content.firstElementChild
    svg.style.left = `${x * window.innerWidth}px`
    svg.style.top = `${y * window.innerHeight}px`

    document.body.appendChild(svg)
    return svg
  }

  updatePointer(client_id, x, y) {
    if (!x || !y) {
      this.pointers[client_id]?.remove()
      delete this.pointers[client_id]
      return
    }

    this.pointers[client_id] ||= this.createPointer(client_id, x, y)
    this.pointers[client_id].style.left = `${x}px`
    this.pointers[client_id].style.top = `${y}px`
  }
}
