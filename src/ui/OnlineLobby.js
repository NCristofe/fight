export class OnlineLobby {
  constructor(root, audio, callbacks) {
    this.audio = audio;
    this.callbacks = callbacks;

    this.el = document.createElement('div');
    this.el.className = 'screen online-lobby';
    this.el.innerHTML = `
      <div class="movelist-bg"></div>
      <h2>PVP ONLINE</h2>
      <div class="lobby-box">
        <p class="lobby-hint">Os dois jogadores precisam abrir o jogo no mesmo endereco:<br /><strong class="lobby-url"></strong></p>
        <p class="lobby-hint lobby-local-warning hidden">Voce abriu por <em>localhost</em>, que so funciona neste computador. O outro dispositivo (no mesmo wifi) deve abrir o endereco <strong>Network</strong> mostrado no terminal do <em>npm run dev</em>, algo como http://192.168.0.10:5173.</p>
        <div class="lobby-actions">
          <button data-action="create">CRIAR SALA</button>
          <button data-action="join">ENTRAR EM UMA SALA</button>
        </div>
        <div class="lobby-join hidden">
          <input class="lobby-input" maxlength="4" placeholder="CODIGO" autocomplete="off" autocapitalize="characters" spellcheck="false" />
          <button data-action="join-go">ENTRAR</button>
        </div>
        <div class="lobby-code hidden">
          <span>CODIGO DA SALA</span>
          <strong class="lobby-code-value"></strong>
        </div>
        <p class="lobby-status"></p>
      </div>
      <button class="lobby-back" data-action="back">VOLTAR</button>
    `;
    root.appendChild(this.el);

    this.el.querySelector('.lobby-url').textContent = location.origin;
    if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
      this.el.querySelector('.lobby-local-warning').classList.remove('hidden');
    }
    this.statusEl = this.el.querySelector('.lobby-status');
    this.input = this.el.querySelector('.lobby-input');

    const on = (action, fn) => this.el.querySelector(`[data-action="${action}"]`).addEventListener('click', fn);
    on('create', () => {
      audio.sfx('confirm');
      this.setBusy(true);
      this.setStatus('Conectando...');
      callbacks.onCreate();
    });
    on('join', () => {
      audio.sfx('confirm');
      this.el.querySelector('.lobby-join').classList.remove('hidden');
      this.input.focus();
    });
    on('join-go', () => this.submitJoin());
    on('back', () => {
      audio.sfx('back');
      callbacks.onBack();
    });
    this.input.addEventListener('input', () => {
      this.input.value = this.input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') this.submitJoin();
    });
  }

  submitJoin() {
    const code = this.input.value.trim();
    if (code.length < 4) {
      this.setStatus('Digite o codigo de 4 letras da sala.', true);
      return;
    }
    this.audio.sfx('confirm');
    this.setBusy(true);
    this.setStatus('Entrando na sala...');
    this.callbacks.onJoin(code);
  }

  setStatus(text, isError = false) {
    this.statusEl.textContent = text;
    this.statusEl.classList.toggle('is-error', isError);
  }

  setBusy(busy) {
    this.el.querySelectorAll('[data-action="create"], [data-action="join"], [data-action="join-go"]').forEach((b) => {
      b.disabled = busy;
    });
    this.input.disabled = busy;
  }

  showCode(code) {
    this.el.querySelector('.lobby-join').classList.add('hidden');
    this.el.querySelector('.lobby-code').classList.remove('hidden');
    this.el.querySelector('.lobby-code-value').textContent = code;
    this.setStatus('Passe o codigo para o outro jogador. Aguardando oponente...');
  }

  showError(message) {
    this.setBusy(false);
    this.setStatus(message, true);
  }

  destroy() {
    this.el.remove();
  }
}
