export class CreditsScreen {
  constructor(root, audio, callbacks) {
    this.el = document.createElement('div');
    this.el.className = 'screen credits-screen';
    this.el.innerHTML = `
      <div class="credits-bg"></div>
      <h2>CREDITOS</h2>
      <div class="credits-body">
        <p><strong>BR FIGHTER - Duelo de Poder</strong></p>
        <p>Jogo de luta 2D retro, satira ficticia e nao-oficial da politica brasileira.</p>
        <p>Personagens, falas e golpes sao fictícios e criados para fins de comedia e entretenimento;
           nao representam declaracoes, fatos ou posicionamentos reais.</p>
        <p>Design, programacao e sistema de combate: equipe BR Fighter.</p>
        <p>Arte: sprites vetoriais originais (sistema de rig proprio), sem uso de imagens reais.</p>
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
