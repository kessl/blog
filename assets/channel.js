export class Channel {
  constructor(url, channel) {
    this.id = Math.random().toString(36)
    this.channel = channel

    this.socket = new WebSocket(url)
    this.socket.addEventListener('message', this.receive.bind(this))
  }

  send(data, command = 'message') {
    this.socket.send(JSON.stringify({
      command,
      type: 'message',
      identifier: JSON.stringify({
        channel: this.channel,
        client_id: this.id,
      }),
      data: JSON.stringify({
        client_id: this.id,
        ...data,
      }),
    }))
  }

  receive(message) {
    const data = JSON.parse(message.data)

    switch (data.type) {
      case 'welcome':
        this.subscribe()
        return
      case 'ping':
      case 'confirm_subscription':
        return
    }

    if (data.message) {
      this.onMessage?.(data.message)
      return
    }
  }

  subscribe() {
    this.send({}, 'subscribe')
  }

  sendMouseMove(x, y) {
    this.send({ type: 'mousemove', x, y })
  }

  sendPushPaintBuffer(x, y, color) {
    this.send({ type: 'push_cell', x, y, color })
  }

  sendFlushPaintBuffer() {
    this.send({ type: 'flush' })
  }
}
