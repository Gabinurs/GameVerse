
let jogosDemonstracao = [];

// ========================================
// CARREGAR JOGOS DA API
// ========================================

async function carregarJogos() {
    const resposta = await fetch("/api/jogos");

    if (!resposta.ok) {
        throw new Error("Erro ao consultar a API: " + resposta.status);
    }

    const dados = await resposta.json();

    jogosDemonstracao = dados.map(dadosJogo =>
        new Jogo(
            dadosJogo.id,
            dadosJogo.nome,
            dadosJogo.plataforma,
            dadosJogo.genero,
            dadosJogo.preco,
            dadosJogo.estoque,
            dadosJogo.imagem
        )
    );

    console.log(
        "É uma instância de Jogo?",
        jogosDemonstracao.length > 0 &&
        jogosDemonstracao[0] instanceof Jogo
    );

    return jogosDemonstracao;
}

// ========================================
// FORMATAR PREÇO
// ========================================

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ========================================
// EXIBIR JOGOS NO CATÁLOGO
// ========================================

function exibirJogos(lista = jogosDemonstracao) {
    const container = document.getElementById("listaJogos");

    if (!container) {
        throw new Error("Elemento listaJogos não encontrado no HTML.");
    }

    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum jogo encontrado.
            </p>
        `;
    }

    lista.forEach(jogo => {
        const imagem = jogo.imagem ||
            "https://placehold.co/600x400/172342/FFFFFF?text=GameVerse";

        const artigo = document.createElement("article");
        artigo.className = "card-jogo";

        const img = document.createElement("img");
        img.src = imagem;
        img.alt = jogo.nome;
        img.onerror = function () {
            this.onerror = null;
            this.src = "https://placehold.co/600x400/172342/FFFFFF?text=GameVerse";
        };

        const informacoes = document.createElement("div");
        informacoes.className = "info-jogo";

        const plataformaGenero = document.createElement("p");
        plataformaGenero.textContent = `${jogo.plataforma} · ${jogo.genero}`;

        const titulo = document.createElement("h3");
        titulo.textContent = jogo.nome;

        const preco = document.createElement("p");
        preco.className = "preco-jogo";
        preco.textContent = formatarPreco(jogo.preco);

        const estoque = document.createElement("p");
        estoque.textContent = `${jogo.estoque} unidades em estoque`;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = "Ver detalhes";

        botao.addEventListener("click", function () {
            verDetalhes(jogo.id);
        });

        const botaoCarrinho = document.createElement("button");
        botaoCarrinho.type = "button";
        botaoCarrinho.className = "botao-adicionar-card";
        botaoCarrinho.textContent = "🛒";
        botaoCarrinho.setAttribute(
            "aria-label",
            `Adicionar ${jogo.nome} ao carrinho`
        );
        botaoCarrinho.disabled = jogo.estoque <= 0;
        botaoCarrinho.addEventListener("click", () => {
            if (typeof adicionarJogoAoCarrinhoDaLoja === "function") {
                adicionarJogoAoCarrinhoDaLoja(jogo.id);
            } else {
                verDetalhes(jogo.id);
            }
        });

        const acoes = document.createElement("div");
        acoes.className = "acoes-card-jogo";
        acoes.append(botao, botaoCarrinho);

        informacoes.append(
            plataformaGenero,
            titulo,
            preco,
            estoque,
            acoes
        );

        artigo.append(img, informacoes);
        container.appendChild(artigo);
    });

    const contador = document.getElementById("contadorJogos");

    if (contador) {
        contador.textContent = `${lista.length} jogos encontrados`;
    }
}

// ========================================
// ABRIR PÁGINA DE DETALHES
// ========================================

function verDetalhes(id) {
    const jogo = jogosDemonstracao.find(
        item => Number(item.id) === Number(id)
    );

    if (!jogo) {
        alert("Jogo não encontrado.");
        return;
    }

    window.location.href = `detalhes.html?id=${encodeURIComponent(jogo.id)}`;
}

// ========================================
// BUSCA E FILTROS
// ========================================

function aplicarFiltros() {
    const campoBusca = document.getElementById("busca");
    const campoPlataforma = document.getElementById("filtroPlataforma");
    const campoGenero = document.getElementById("filtroGenero");

    const termoBusca = campoBusca
        ? campoBusca.value.trim().toLowerCase()
        : "";

    const plataformaSelecionada = campoPlataforma
        ? campoPlataforma.value
        : "";

    const generoSelecionado = campoGenero
        ? campoGenero.value.trim().toLowerCase()
        : "";

    const jogosFiltrados = jogosDemonstracao.filter(jogo => {
        const correspondeNome = jogo.nome
            .toLowerCase()
            .includes(termoBusca);

        const correspondePlataforma =
            !plataformaSelecionada ||
            jogo.plataforma.toLowerCase() ===
            plataformaSelecionada.toLowerCase();

        const correspondeGenero =
            !generoSelecionado ||
            jogo.genero.toLowerCase().includes(generoSelecionado);

        return (
            correspondeNome &&
            correspondePlataforma &&
            correspondeGenero
        );
    });

    exibirJogos(jogosFiltrados);
}

// ========================================
// INICIALIZAR CATÁLOGO
// ========================================

document.addEventListener("DOMContentLoaded", async function () {
    try {
        await carregarJogos();
        exibirJogos();

        const campoBusca = document.getElementById("busca");
        const campoPlataforma = document.getElementById("filtroPlataforma");
        const campoGenero = document.getElementById("filtroGenero");

        if (campoBusca) {
            campoBusca.addEventListener("input", aplicarFiltros);
        }

        if (campoPlataforma) {
            campoPlataforma.addEventListener("change", aplicarFiltros);
        }

        if (campoGenero) {
            campoGenero.addEventListener("input", aplicarFiltros);
        }

    } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);

        const container = document.getElementById("listaJogos");

        if (container) {
            container.innerHTML = `
                <p class="mensagem-vazia">
                    Não foi possível carregar os jogos.
                    Tente atualizar a página.
                </p>
            `;
        }
    }
});
