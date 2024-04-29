export class Channel {
  constructor(url, channel, handleMessage) {
    this.id = Math.random().toString(36)
    this.channel = channel
    this.onMessage = handleMessage

    this.socket = new WebSocket(url)
    this.socket.addEventListener('message', this.receive.bind(this))
  }

  send(data) {
    this.socket.send(JSON.stringify(data))
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
    this.send({
      command: 'subscribe',
      identifier: JSON.stringify({
        channel: this.channel,
        client_id: this.id,
      }),
    })
  }

  sendMouseMove(x, y) {
    this.send({
      command: 'message',
      type: 'message',
      identifier: JSON.stringify({
        channel: this.channel,
        client_id: this.id,
      }),
      data: JSON.stringify({
        type: 'mousemove',
        client_id: this.id,
        x, y,
      }),
    })
  }
}
