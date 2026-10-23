import { WebSocketServer } from 'ws';

// Minimal room relay for 2-player online matches. It never simulates the game:
// it only pairs two sockets by a short room code and forwards every other
// message from one to the other. The room creator ("host") runs the fight and
// streams state to the guest, who sends back only inputs (see src/game/Game.js).
//
// Control messages (client -> server):  {t:'create'}  {t:'join', code}
// Control messages (server -> client):  {t:'created', code}  {t:'joined'}
//                                       {t:'peer-joined'}  {t:'peer-left'}  {t:'error', message}
// Anything else is relayed untouched to the other player in the room.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function attachRelay(httpServer, path = '/ws') {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  const rooms = new Map(); // code -> { host, guest }

  httpServer.on('upgrade', (req, socket, head) => {
    if ((req.url || '').split('?')[0] !== path) return; // leave other upgrades (e.g. Vite HMR) alone
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  const send = (ws, obj) => {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  };

  const newCode = () => {
    for (;;) {
      let code = '';
      for (let i = 0; i < 4; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      if (!rooms.has(code)) return code;
    }
  };

  function leave(ws) {
    const code = ws.room;
    if (!code) return;
    ws.room = null;
    const room = rooms.get(code);
    if (!room) return;
    if (ws.role === 'host') {
      rooms.delete(code);
      if (room.guest) {
        send(room.guest, { t: 'peer-left' });
        room.guest.room = null;
      }
    } else {
      room.guest = null;
      send(room.host, { t: 'peer-left' });
    }
  }

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.room = null;
    ws.role = null;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      const text = raw.toString();
      let msg;
      try {
        msg = JSON.parse(text);
      } catch {
        return;
      }

      if (msg.t === 'create') {
        leave(ws);
        const code = newCode();
        rooms.set(code, { host: ws, guest: null });
        ws.room = code;
        ws.role = 'host';
        send(ws, { t: 'created', code });
        return;
      }

      if (msg.t === 'join') {
        leave(ws);
        const code = String(msg.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) return send(ws, { t: 'error', message: 'Sala nao encontrada. Confira o codigo.' });
        if (room.guest) return send(ws, { t: 'error', message: 'Essa sala ja esta cheia.' });
        room.guest = ws;
        ws.room = code;
        ws.role = 'guest';
        send(ws, { t: 'joined' });
        send(room.host, { t: 'peer-joined' });
        return;
      }

      const room = rooms.get(ws.room);
      if (!room) return;
      const peer = ws.role === 'host' ? room.guest : room.host;
      if (peer && peer.readyState === 1) peer.send(text);
    });

    ws.on('close', () => leave(ws));
    ws.on('error', () => leave(ws));
  });

  // Drop sockets that vanished without a close frame (phone locked, wifi lost).
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 15000);
  heartbeat.unref();
  httpServer.on('close', () => clearInterval(heartbeat));

  return wss;
}
