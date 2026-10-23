export class CreditsScreen {
  constructor(root, audio, callbacks) {
    this.el = document.createElement('div');
    this.el.className = 'screen credits-screen';
    this.el.innerHTML = `
      <div class="credits-bg"></div>
      <h2>CREDITOS</h2>
      <div class="credits-body">
        <p><strong>DUELO DE LÂMINAS</strong></p>
        <p>Jogo de luta 2D de espadas com bonecos-palito.</p>
        <p>Design, programacao, animacoes e sistema de combate.</p>
        <p>Arte: bonecos e cenarios desenhados por codigo (canvas), sem imagens externas.</p>
        <p>Audio: efeitos e musica gerados proceduralmente via Web Audio API.</p>
        <p>Construido com HTML5 Canvas, JavaScript moderno e Vite.</p>
      </div>
      <button class="credits-back" data-action="back">VOLTAR</button>
    `;
    root.appendChild(this.el);
    this.el.querySelector('[data-action="back"]').addEventListener('click', () => {
      audio.sfx('back');
      callbacks.onBack();
    });
  }

  destroy() {
    this.el.remove();
  }
}
