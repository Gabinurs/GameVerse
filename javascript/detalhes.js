
const areaDetalhes = document.getElementById("detalhesJogo");

let jogoAtual = null;
let usuarioAtual = null;
let favoritosUsuario = [];

// ========================================
// FORMATAR PREÇO
// ========================================

function formatarPrecoDetalhes(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ========================================
// VERIFICAR LOGIN
// ========================================

async function verificarLogin() {
    try {
        const resposta = await fetch("/api/auth/me", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!resposta.ok) {
            return null;
        }

        const dados = await resposta.json();
        return dados.usuario || null;

    } catch (erro) {
        console.error("Erro ao verificar login:", erro);
        return null;
    }
}

// ========================================
// CARREGAR FAVORITOS DO USUÁRIO
// ========================================

async function carregarFavoritos() {
    if (!usuarioAtual || usuarioAtual.tipo === "admin") {
        favoritosUsuario = [];
        return;
    }

    try {
        const resposta = await fetch("/api/favoritos", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os favoritos.");
        }

        favoritosUsuario = await resposta.json();

        if (!Array.isArray(favoritosUsuario)) {
            favoritosUsuario = [];
        }

    } catch (erro) {
        console.error("Erro ao carregar favoritos:", erro);
        favoritosUsuario = [];
    }
}

// ========================================
// CARREGAR DETALHES DO JOGO
// ========================================

async function carregarDetalhes() {
    try {
        const parametros = new URLSearchParams(window.location.search);
        const id = Number(parametros.get("id"));

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("O jogo selecionado é inválido.");
        }

        const resposta = await fetch("/api/jogos");

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar os jogos.");
        }

        const jogos = await resposta.json();

        const dados = jogos.find(
            jogo => Number(jogo.id) === id
        );

        if (!dados) {
            throw new Error("Jogo não encontrado.");
        }

        jogoAtual = new Jogo(
            dados.id,
            dados.nome,
            dados.plataforma,
            dados.genero,
            dados.preco,
            dados.estoque,
            dados.imagem
        );

        usuarioAtual = await verificarLogin();

        await carregarFavoritos();

        exibirDetalhes();

    } catch (erro) {
        console.error("Erro ao carregar detalhes:", erro);

        areaDetalhes.textContent = erro.message;

        const link = document.createElement("a");
        link.href = "index.html#catalogo";
        link.textContent = "Voltar para a loja";

        areaDetalhes.appendChild(link);
    }
}

// ========================================
// EXIBIR DETALHES E BOTÕES
// ========================================

function exibirDetalhes() {
    const jogo = jogoAtual;

    const imagem = jogo.imagem ||
        "https://placehold.co/600x400/172342/FFFFFF?text=GameVerse";

    const estaFavoritado = favoritosUsuario.some(
        id => Number(id) === Number(jogo.id)
    );

    const podeFavoritar = usuarioAtual &&
        usuarioAtual.tipo !== "admin";

    const podeAdicionarCarrinho = usuarioAtual &&
        usuarioAtual.tipo !== "admin";

    areaDetalhes.innerHTML = `
        <article class="detalhes-card">
            <img
                src="${imagem}"
                alt="${jogo.nome}"
                onerror="this.onerror=null;this.src='https://placehold.co/600x400/172342/FFFFFF?text=GameVerse'"
            >

            <div class="detalhes-info">
                <p>${jogo.plataforma} · ${jogo.genero}</p>

                <h1>${jogo.nome}</h1>

                <p class="detalhes-preco">
                    ${formatarPrecoDetalhes(jogo.preco)}
                </p>

                <p>Disponibilidade: ${jogo.estoque} unidades</p>

                <h3>Sobre o jogo</h3>

                <p>
                    Explore o universo de ${jogo.nome} e prepare-se
                    para uma nova aventura. Confira a compatibilidade
                    antes de realizar sua compra.
                </p>

                <p>Plataforma: ${jogo.plataforma}</p>
                <p>Gênero: ${jogo.genero}</p>

                <button
                    type="button"
                    id="btnAdicionarCarrinho"
                    ${!podeAdicionarCarrinho || jogo.estoque <= 0 ? "disabled" : ""}
                >
                    ${
                        jogo.estoque <= 0
                            ? "Indisponível"
                            : podeAdicionarCarrinho
                                ? "Adicionar ao carrinho"
                                : "Entre para adicionar ao carrinho"
                    }
                </button>

                <button
                    type="button"
                    id="btnFavorito"
                    class="botao-favorito"
                    ${!podeFavoritar ? "disabled" : ""}
                >
                    ${
                        !podeFavoritar
                            ? "♡ Entre para favoritar"
                            : estaFavoritado
                                ? "♥ Remover dos favoritos"
                                : "♡ Adicionar aos favoritos"
                    }
                </button>

                <p id="mensagem" role="status">
                    ${
                        usuarioAtual
                            ? "Você está conectado."
                            : "Entre na sua conta para comprar e favoritar jogos."
                    }
                </p>

                ${
                    !usuarioAtual
                        ? '<a href="login.html" id="linkLogin">Entrar na minha conta</a>'
                        : ""
                }
            </div>
        </article>
    `;

    document.title = `${jogo.nome} | GameVerse`;

    const botaoCarrinho = document.getElementById("btnAdicionarCarrinho");
    const botaoFavorito = document.getElementById("btnFavorito");

    if (podeAdicionarCarrinho && jogo.estoque > 0) {
        botaoCarrinho.addEventListener("click", adicionarAoCarrinho);
    }

    if (podeFavoritar) {
        botaoFavorito.addEventListener("click", alternarFavorito);
    }

    const linkLogin = document.getElementById("linkLogin");

    if (linkLogin) {
        linkLogin.addEventListener("click", () => {
            sessionStorage.setItem(
                "gameverseVoltarAposLogin",
                window.location.pathname + window.location.search
            );
        });
    }
}

// ========================================
// ADICIONAR OU REMOVER FAVORITO
// ========================================

async function alternarFavorito() {
    const botao = document.getElementById("btnFavorito");
    const mensagem = document.getElementById("mensagem");

    if (!usuarioAtual || usuarioAtual.tipo === "admin") {
        mensagem.textContent = "Entre com uma conta de cliente para favoritar.";
        return;
    }

    const estaFavoritado = favoritosUsuario.some(
        id => Number(id) === Number(jogoAtual.id)
    );

    botao.disabled = true;

    try {
        const resposta = await fetch(
            `/api/favoritos/${jogoAtual.id}`,
            {
                method: estaFavoritado ? "DELETE" : "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Não foi possível atualizar os favoritos."
            );
        }

        favoritosUsuario = dados.favoritos || [];

        mensagem.textContent = estaFavoritado
            ? "Jogo removido dos favoritos."
            : "Jogo adicionado aos favoritos!";

        exibirDetalhes();

    } catch (erro) {
        console.error("Erro ao atualizar favorito:", erro);
        mensagem.textContent = erro.message;
        botao.disabled = false;
    }
}

// ========================================
// ADICIONAR AO CARRINHO
// ========================================

async function adicionarAoCarrinho() {
    const mensagem = document.getElementById("mensagem");

    const usuario = await verificarLogin();

    if (!usuario || usuario.tipo === "admin") {
        mensagem.textContent = "Entre com uma conta de cliente para comprar.";

        sessionStorage.setItem(
            "gameverseVoltarAposLogin",
            window.location.pathname + window.location.search
        );

        setTimeout(() => {
            window.location.href = "login.html";
        }, 700);

        return;
    }

    let carrinho = [];

    try {
        carrinho = JSON.parse(
            localStorage.getItem("gameverseCarrinho") || "[]"
        );

        if (!Array.isArray(carrinho)) {
            carrinho = [];
        }
    } catch (erro) {
        carrinho = [];
    }

    const itemExistente = carrinho.find(
        item => Number(item.id) === Number(jogoAtual.id)
    );

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: Number(jogoAtual.id),
            quantidade: 1
        });
    }

    localStorage.setItem(
        "gameverseCarrinho",
        JSON.stringify(carrinho)
    );

    mensagem.textContent = "Jogo adicionado ao carrinho!";
}

// ========================================
// INICIAR PÁGINA
// ========================================

carregarDetalhes();
