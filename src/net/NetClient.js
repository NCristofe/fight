// Thin WebSocket wrapper for the room relay (see server/relay.js).
export class NetClient {
  constructor() {
    this.ws = null;
    this.onmessage = null;
    this.onclose = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      let ws;
      try {
        ws = new WebSocket(`${proto}://${location.host}/ws`);
      } catch {
        reject(new Error('Nao foi possivel conectar ao servidor.'));
        return;
      }
      this.ws = ws;
      let opened = false;
      ws.onopen = () => {
        opened = true;
        resolve();
      };
      ws.onerror = () => {
        if (!opened) reject(new Error('Nao foi possivel conectar ao servidor. Abra o jogo pelo endereco do servidor (npm run dev).'));
      };
      ws.onmessage = (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (this.onmessage) this.onmessage(msg);
      };
      ws.onclose = () => {
        if (opened && this.onclose) this.onclose();
      };
    });
  }

  get connected() {
    return Boolean(this.ws && this.ws.readyState === 1);
  }

  send(obj) {
    if (this.connected) this.ws.send(JSON.stringify(obj));
  }

  close() {
    if (!this.ws) return;
    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.onmessage = null;
    this.ws.close();
    this.ws = null;
  }
}
