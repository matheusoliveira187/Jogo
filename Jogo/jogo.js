// ==========================================
// 1. SELEÇÃO DO CANVAS E CONTEXTO DE DESENHO
// ==========================================
const canvas = document.getElementById('canvasJogo');
const ctx = canvas.getContext('2d');

// ==========================================
// 2. CARREGAMENTO DAS IMAGENS (SPRITES)
// ==========================================
// Sprites do Dinossauro em pé
const imgDinoParado = new Image();
imgDinoParado.src = 'dino.png';

const imgDinoPerna1 = new Image();
imgDinoPerna1.src = 'dino_perna1.png';

const imgDinoPerna2 = new Image();
imgDinoPerna2.src = 'dino_perna2.png';

// Sprites do Dinossauro agachado
const imgDinoAgachado1 = new Image();
imgDinoAgachado1.src = 'dino_agachado1.png';

const imgDinoAgachado2 = new Image();
imgDinoAgachado2.src = 'dino_agachado2.png';

// Sprites dos Obstáculos
const imgCacto = new Image();
imgCacto.src = 'cacto.png';

const imgPassaro = new Image();
imgPassaro.src = 'passaro.png';

// ==========================================
// 3. VARIÁVEIS DE ESTADO E CONFIGURAÇÕES
// ==========================================
const alturaChao = 250;
const velocidadeInicial = 6;
let velocidadeJogo = velocidadeInicial;

let frame = 0;
let jogoAtivo = true;

const taxaPontosInicial = 0.15;
let taxaPontos = taxaPontosInicial;
let pontuacao = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;

let obstaculos = [];

// ==========================================
// 4. OBJETO DINOSSAURO
// ==========================================
const dino = {
    x: 50,
    
    // Dimensões Padrão (Em pé)
    larguraEmPe: 62,
    alturaEmPe: 70,

    // Dimensões Agachado
    larguraAgachado: 80,
    alturaAgachado: 42,

    // Propriedades dinâmicas
    largura: 62,
    altura: 70,
    y: alturaChao - 70,

    agachado: false,

    // Física
    velocidadeY: 0,
    pulo: -14,
    gravidade: 0.7,
    noChao: true,

    // Animação das pernas
    framePerna: 0,
    timerAnimacao: 0,

    desenhar: function() {
        let imagemAtual;

        if (!this.noChao || !jogoAtivo) {
            imagemAtual = imgDinoParado;
        } else if (this.agachado) {
            imagemAtual = (this.framePerna === 0) ? imgDinoAgachado1 : imgDinoAgachado2;
        } else {
            imagemAtual = (this.framePerna === 0) ? imgDinoPerna1 : imgDinoPerna2;
        }

        ctx.drawImage(imagemAtual, this.x, this.y, this.largura, this.altura);
    },

    atualizar: function() {
        this.velocidadeY += this.gravidade;
        this.y += this.velocidadeY;

        // Ajusta dimensões e posição Y com base no estado (agachado vs em pé)
        if (this.agachado && this.noChao) {
            this.largura = this.larguraAgachado;
            this.altura = this.alturaAgachado;
        } else {
            this.largura = this.larguraEmPe;
            this.altura = this.alturaEmPe;
        }

        // Trava de colisão com a linha do chão
        if (this.y >= alturaChao - this.altura) {
            this.y = alturaChao - this.altura;
            this.velocidadeY = 0;
            this.noChao = true;
        }

        // Animação de caminhada/corrida
        let intervaloTrocaPerna = Math.max(3, Math.floor(8 - (velocidadeJogo - velocidadeInicial) * 0.4));

        if (this.noChao && jogoAtivo) {
            this.timerAnimacao++;
            if (this.timerAnimacao >= intervaloTrocaPerna) {
                this.framePerna = (this.framePerna === 0) ? 1 : 0;
                this.timerAnimacao = 0;
            }
        }
    },

    pular: function() {
        if (this.noChao && jogoAtivo && !this.agachado) {
            this.velocidadeY = this.pulo;
            this.noChao = false;
        }
    },

    forcarQueda: function() {
        if (!this.noChao) {
            this.velocidadeY += 3;
        }
    },

    resetar: function() {
        this.agachado = false;
        this.largura = this.larguraEmPe;
        this.altura = this.alturaEmPe;
        this.y = alturaChao - this.altura;
        this.velocidadeY = 0;
        this.noChao = true;
        this.framePerna = 0;
        this.timerAnimacao = 0;
    }
};

// ==========================================
// 5. CACTOS E PTERODÁCTILOS (OBSTÁCULOS)
// ==========================================
function criarObstaculo() {
    let incluirPassaro = pontuacao > 150;
    let chancePassaro = incluirPassaro && Math.random() < 0.35;

    if (chancePassaro) {
        // Posicionado a 75px acima do chão para dar folga ao dinossauro agachado
        let novoPassaro = {
            tipo: 'passaro',
            x: canvas.width,
            largura: 52,
            altura: 40,
            y: alturaChao - 75
        };
        obstaculos.push(novoPassaro);
    } else {
        let tipoCacto = Math.floor(Math.random() * 4) + 1;
        let novoCacto;

        switch (tipoCacto) {
            case 1:
                novoCacto = { tipo: 'cacto', x: canvas.width, altura: 40, largura: 26, y: alturaChao - 40 };
                break;
            case 2:
                novoCacto = { tipo: 'cacto', x: canvas.width, altura: 55, largura: 34, y: alturaChao - 55 };
                break;
            case 3:
                novoCacto = { tipo: 'cacto', x: canvas.width, altura: 70, largura: 42, y: alturaChao - 70 };
                break;
            case 4:
                novoCacto = { tipo: 'cacto', x: canvas.width, altura: 50, largura: 58, y: alturaChao - 50, duplo: true };
                break;
        }
        obstaculos.push(novoCacto);
    }
}

function gerenciarObstaculos() {
    for (let i = 0; i < obstaculos.length; i++) {
        let obs = obstaculos[i];

        obs.x -= velocidadeJogo;

        if (obs.tipo === 'passaro') {
            ctx.drawImage(imgPassaro, obs.x, obs.y, obs.largura, obs.altura);
        } else if (obs.duplo) {
            let larguraUnica = Math.floor(obs.largura / 2);
            ctx.drawImage(imgCacto, obs.x, obs.y, larguraUnica, obs.altura);
            ctx.drawImage(imgCacto, obs.x + larguraUnica + 2, obs.y + 5, larguraUnica - 2, obs.altura - 5);
        } else {
            ctx.drawImage(imgCacto, obs.x, obs.y, obs.largura, obs.altura);
        }

        if (verificarColisao(dino, obs)) {
            finalizarJogo();
        }

        if (obs.x + obs.largura < 0) {
            obstaculos.splice(i, 1);
            i--;
        }
    }
}

// ==========================================
// 6. DETECÇÃO DE COLISÃO COM MARGEM DE TOLERÂNCIA
// ==========================================
function verificarColisao(dino, obs) {
    let margemX = 8;
    let margemY = 6;

    if (obs.tipo === 'passaro') {
        margemY = 10;
    }

    return (
        dino.x + margemX < obs.x + obs.largura &&
        dino.x + dino.largura - margemX > obs.x &&
        dino.y + margemY < obs.y + obs.altura &&
        dino.y + dino.altura - margemY > obs.y
    );
}

// ==========================================
// 7. CHÃO E INTERFACE (HUD)
// ==========================================
function desenharChao() {
    ctx.beginPath();
    ctx.moveTo(0, alturaChao);
    ctx.lineTo(canvas.width, alturaChao);
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function desenharPontuacao() {
    ctx.fillStyle = '#535353';
    ctx.font = 'bold 18px monospace';

    let textoPontos = String(Math.floor(pontuacao)).padStart(5, '0');
    let textoHighScore = String(Math.floor(highScore)).padStart(5, '0');

    ctx.fillText(`HI ${textoHighScore}  ${textoPontos}`, canvas.width - 220, 30);
}

function desenharTelaGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200, 70, 400, 160);
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 70, 400, 160);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('G A M E   O V E R', canvas.width / 2, 110);

    ctx.fillStyle = '#333333';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Pontuação: ${Math.floor(pontuacao)}`, canvas.width / 2, 145);
    ctx.fillText(`Melhor Recorde (HI): ${Math.floor(highScore)}`, canvas.width / 2, 170);

    ctx.fillStyle = '#555555';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Pressione ESPAÇO ou SETA PARA CIMA para reiniciar', canvas.width / 2, 205);

    ctx.textAlign = 'left';
}

// ==========================================
// 8. CONTROLE DE DIFICULDADE DINÂMICA
// ==========================================
function atualizarDificuldade() {
    let nivel = Math.floor(pontuacao / 100);
    velocidadeJogo = velocidadeInicial + nivel * 0.5;
    taxaPontos = taxaPontosInicial + nivel * 0.03;
}

// ==========================================
// 9. CONTROLE DE ESTADO
// ==========================================
function finalizarJogo() {
    jogoAtivo = false;

    if (pontuacao > highScore) {
        highScore = pontuacao;
        localStorage.setItem('dinoHighScore', Math.floor(highScore));
    }
}

function reiniciarJogo() {
    velocidadeJogo = velocidadeInicial;
    taxaPontos = taxaPontosInicial;

    pontuacao = 0;
    frame = 0;
    obstaculos = [];
    dino.resetar();
    jogoAtivo = true;
    loop();
}

// ==========================================
// 10. CONTROLES DO TECLADO
// ==========================================
window.addEventListener('keydown', function(evento) {
    if (evento.code === 'Space' || evento.code === 'ArrowUp') {
        if (jogoAtivo) {
            dino.pular();
        } else {
            reiniciarJogo();
        }
    }

    if (evento.code === 'ArrowDown') {
        if (jogoAtivo) {
            dino.agachado = true;
            dino.forcarQueda();
        }
    }
});

window.addEventListener('keyup', function(evento) {
    if (evento.code === 'ArrowDown') {
        dino.agachado = false;
    }
});

// ==========================================
// 11. LOOP PRINCIPAL
// ==========================================
function loop() {
    if (!jogoAtivo) {
        dino.desenhar();
        desenharTelaGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pontuacao += taxaPontos;
    atualizarDificuldade();

    frame++;

    let intervaloObstaculo = Math.max(45, Math.floor(90 - (velocidadeJogo - velocidadeInicial) * 4));
    if (frame % intervaloObstaculo === 0) {
        if (Math.random() > 0.2) {
            criarObstaculo();
        }
    }

    desenharChao();
    dino.atualizar();
    dino.desenhar();
    gerenciarObstaculos();
    desenharPontuacao();

    requestAnimationFrame(loop);
}

// Inicia o jogo
loop();