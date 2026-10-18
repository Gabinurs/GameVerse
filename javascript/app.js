
function formatarPrecoTopo(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function adicionarJogoAoCarrinhoDaLoja(id) {
    try {
        const resposta = await fetch("/api/carrinho", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });
        const tipoConteudo = resposta.headers.get("content-type") || "";

        if (!tipoConteudo.includes("application/json")) {
            throw new Error(
                "Não foi possível conectar ao carrinho. Abra a loja pelo endereço do servidor GameVerse."
            );
        }

        const dados = await resposta.json();

        if (resposta.status === 401) {
            sessionStorage.setItem(
                "gameverseVoltarAposLogin",
                `/detalhes.html?id=${encodeURIComponent(id)}`
            );
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível adicionar ao carrinho.");
        }

        await atualizarContadorCarrinho();
        alert(dados.mensagem || "Jogo adicionado ao carrinho!");
    } catch (erro) {
        console.error("Erro ao adicionar jogo ao carrinho:", erro);
        alert(erro.message);
    }
}

async function atualizarContadorCarrinho() {
    const contador = document.getElementById("contadorCarrinho");
    if (!contador) return;

    try {
        const resposta = await fetch("/api/carrinho", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!resposta.ok) {
            contador.textContent = "0";
            return;
        }

        const itens = await resposta.json();
        const quantidade = itens.reduce(
            (soma, item) => soma + Number(item.quantidade || 0),
            0
        );
        contador.textContent = String(quantidade);
        contador.setAttribute("aria-label", `${quantidade} itens no carrinho`);
    } catch (erro) {
        console.error("Erro ao atualizar contador do carrinho:", erro);
    }
}

function selecionarDestaques(jogos) {
    const selecionados = [];
    const generosIncluidos = new Set();

    jogos.forEach(jogo => {
        if (!generosIncluidos.has(jogo.genero)) {
            generosIncluidos.add(jogo.genero);
            selecionados.push(jogo);
        }
    });

    jogos.forEach(jogo => {
        if (selecionados.length < 8 && !selecionados.includes(jogo)) {
            selecionados.push(jogo);
        }
    });

    return selecionados.slice(0, 8);
}

function renderizarCarrosselHero(jogos) {
    const imagem = document.getElementById("imagemHero");
    const legenda = document.getElementById("legendaHero");
    const pontos = document.getElementById("pontosHero");
    const anterior = document.getElementById("heroAnterior");
    const proximo = document.getElementById("heroProximo");

    if (!imagem || !legenda || !pontos || jogos.length === 0) return;

    const slides = jogos.slice(0, Math.min(5, jogos.length));
    let indiceAtual = 0;

    function exibirSlide(indice) {
        indiceAtual = (indice + slides.length) % slides.length;
        const jogo = slides[indiceAtual];
        imagem.src = jogo.imagem || "imagens/elden-ring.jpg";
        imagem.alt = jogo.nome;
        legenda.textContent = `VIVA NOVAS AVENTURAS · ${jogo.nome.toUpperCase()}`;

        Array.from(pontos.children).forEach((ponto, posicao) => {
            ponto.classList.toggle("ativo", posicao === indiceAtual);
            ponto.setAttribute("aria-current", String(posicao === indiceAtual));
        });
    }

    pontos.replaceChildren();
    slides.forEach((jogo, indice) => {
        const ponto = document.createElement("button");
        ponto.type = "button";
        ponto.className = "ponto-hero";
        ponto.setAttribute("aria-label", `Mostrar ${jogo.nome}`);
        ponto.addEventListener("click", () => exibirSlide(indice));
        pontos.append(ponto);
    });

    anterior.addEventListener("click", () => exibirSlide(indiceAtual - 1));
    proximo.addEventListener("click", () => exibirSlide(indiceAtual + 1));
    exibirSlide(0);

    if (slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.setInterval(() => exibirSlide(indiceAtual + 1), 6000);
    }
}

function renderizarCategorias(jogos, aoSelecionar) {
    const lista = document.getElementById("listaCategorias");
    if (!lista) return;

    const generos = [...new Set(jogos.map(jogo => jogo.genero))];
    const icones = {
        rpg: "♟",
        fps: "◎",
        "sobrevivência": "⌂",
        aventura: "⚔",
        ação: "⚡",
        esportes: "◉"
    };
    const categorias = [
        { nome: "Todos", valor: "", icone: "▦" },
        ...generos.map(genero => ({
            nome: genero,
            valor: genero,
            icone: icones[genero.toLowerCase()] || "✦"
        }))
    ];

    lista.replaceChildren();
    categorias.forEach(categoria => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "cartao-categoria";
        botao.dataset.genero = categoria.valor;
        const icone = document.createElement("span");
        icone.setAttribute("aria-hidden", "true");
        icone.textContent = categoria.icone;
        const nome = document.createElement("span");
        nome.textContent = categoria.nome;
        botao.append(icone, nome);
        botao.addEventListener("click", () => {
            lista.querySelectorAll(".cartao-categoria").forEach(item => {
                item.classList.toggle("ativo", item === botao);
            });
            aoSelecionar(categoria.valor);
        });
        if (!categoria.valor) botao.classList.add("ativo");
        lista.append(botao);
    });
}

function renderizarJogosDestaque(jogos) {
    const lista = document.getElementById("listaDestaques");
    if (!lista) return;

    lista.replaceChildren();
    selecionarDestaques(jogos).forEach(jogo => {
        const cartao = document.createElement("article");
        cartao.className = "cartao-destaque";

        const link = document.createElement("a");
        link.className = "imagem-destaque";
        link.href = `detalhes.html?id=${encodeURIComponent(jogo.id)}`;
        link.setAttribute("aria-label", `Ver detalhes de ${jogo.nome}`);
        const imagem = document.createElement("img");
        imagem.src = jogo.imagem || "imagens/elden-ring.jpg";
        imagem.alt = "";
        imagem.loading = "lazy";
        imagem.onerror = () => {
            imagem.onerror = null;
            imagem.src = "imagens/elden-ring.jpg";
        };
        const plataforma = document.createElement("span");
        plataforma.textContent = jogo.plataforma;
        link.append(imagem, plataforma);

        const informacoes = document.createElement("div");
        informacoes.className = "info-destaque";
        const titulo = document.createElement("h3");
        titulo.textContent = jogo.nome;
        const genero = document.createElement("p");
        genero.textContent = jogo.genero;
        const rodape = document.createElement("div");
        rodape.className = "rodape-destaque";
        const preco = document.createElement("strong");
        preco.textContent = formatarPrecoTopo(jogo.preco);
        const adicionar = document.createElement("button");
        adicionar.type = "button";
        adicionar.className = "botao-adicionar-destaque";
        adicionar.setAttribute("aria-label", `Adicionar ${jogo.nome} ao carrinho`);
        adicionar.textContent = "🛒";
        adicionar.disabled = jogo.estoque <= 0;
        adicionar.addEventListener("click", () => {
            adicionarJogoAoCarrinhoDaLoja(jogo.id);
        });
        rodape.append(preco, adicionar);
        informacoes.append(titulo, genero, rodape);
        cartao.append(link, informacoes);
        lista.append(cartao);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const contador = document.getElementById("contadorJogos");
    const container = document.getElementById("listaJogos");

    // ========================================
    // BOTÕES DE ENTRAR E CRIAR CONTA
    // ========================================

    const btnEntrar = document.getElementById("btnEntrar");
    const btnCriarConta = document.getElementById("btnCriarConta");

    if (btnEntrar) {
        btnEntrar.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    if (btnCriarConta) {
        btnCriarConta.addEventListener("click", () => {
            window.location.href = "cadastro.html";
        });
    }

    // ========================================
    // IDENTIFICAR USUÁRIO CONECTADO
    // ========================================

    async function carregarConta() {
        const acoesConta = document.getElementById("acoesConta");

        if (!acoesConta) return;

        try {
            const resposta = await fetch("/api/auth/me", {
                credentials: "same-origin",
                cache: "no-store"
            });

            if (!resposta.ok) {
                mostrarBotoesVisitante(acoesConta);
                return;
            }

            const dados = await resposta.json();
            const usuario = dados.usuario;

            if (!usuario) {
                mostrarBotoesVisitante(acoesConta);
                return;
            }

            mostrarMenuUsuario(acoesConta, usuario);

        } catch (erro) {
            console.error("Erro ao verificar usuário:", erro);
            mostrarBotoesVisitante(acoesConta);
        }
    }

    // ========================================
    // MOSTRAR BOTÕES PARA QUEM NÃO ESTÁ LOGADO
    // ========================================

    function mostrarBotoesVisitante(acoesConta) {
        acoesConta.innerHTML = `
            <a href="cadastro.html" class="botao-conta botao-criar-conta">
                Criar conta
            </a>
            <a href="login.html" class="botao-conta botao-login">
                Entrar
            </a>
        `;
    }

    // ========================================
    // MOSTRAR AVATAR E MENU DO USUÁRIO
    // ========================================

    function mostrarMenuUsuario(acoesConta, usuario) {
        const nome = usuario.nome || usuario.usuario || "Usuário";
        const inicial = nome.trim().charAt(0).toUpperCase();
        const ehAdmin = usuario.tipo === "admin";

        acoesConta.innerHTML = `
            <div class="menu-conta">
                <button
                    type="button"
                    id="btnMenuConta"
                    class="botao-menu-conta"
                    aria-expanded="false"
                    aria-controls="opcoesConta"
                >
                    <span class="avatar-conta">${inicial}</span>
                    <span class="nome-conta">${nome}</span>
                    <span aria-hidden="true">⌄</span>
                </button>

                <div id="opcoesConta" class="opcoes-conta" hidden>
                    <p class="titulo-menu-conta">
                        Minha conta
                    </p>

                    <a href="minha-conta.html">
                        Modificar conta
                    </a>

                    ${
    ehAdmin
        ? '<a href="admin.html">Painel administrativo</a>'
        : `
            <a href="meus-jogos.html">Meus jogos</a>
            <a href="meus-favoritos.html">Meus favoritos</a>
        `
}


                    <button type="button" id="btnSair">
                        Sair
                    </button>
                </div>
            </div>
        `;

        const btnMenu = document.getElementById("btnMenuConta");
        const opcoes = document.getElementById("opcoesConta");

        btnMenu.addEventListener("click", () => {
            const aberto = !opcoes.hidden;

            opcoes.hidden = aberto;
            btnMenu.setAttribute("aria-expanded", String(!aberto));
        });

        document.addEventListener("click", (evento) => {
            if (!acoesConta.contains(evento.target)) {
                opcoes.hidden = true;
                btnMenu.setAttribute("aria-expanded", "false");
            }
        });

        document.getElementById("btnSair").addEventListener("click", async () => {
            try {
                const resposta = await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });

                if (!resposta.ok) {
                    alert("Não foi possível sair da conta.");
                    return;
                }

                localStorage.removeItem("gameverseCarrinho");
                sessionStorage.removeItem("gameverseVoltarAposLogin");

                window.location.href = "index.html";

            } catch (erro) {
                console.error("Erro ao sair:", erro);
                alert("Erro de conexão ao tentar sair da conta.");
            }
        });
    }

    // ========================================
    // CARREGAR CATÁLOGO E FILTROS
    // ========================================

    try {
        await carregarConta();

        await carregarJogos();
        exibirJogos();

        const busca = document.getElementById("busca");
        const buscaTopo = document.getElementById("buscaTopo");
        const plataforma = document.getElementById("filtroPlataforma");
        const genero = document.getElementById("filtroGenero");

        function aplicarFiltros() {
            const termo = busca?.value.toLowerCase().trim() || "";
            const filtroPlataforma = plataforma?.value || "";
            const filtroGenero = genero?.value.toLowerCase().trim() || "";

            const resultado = jogosDemonstracao.filter(jogo =>
                jogo.nome.toLowerCase().includes(termo) &&
                (
                    !filtroPlataforma ||
                    jogo.plataforma.toLowerCase() === filtroPlataforma.toLowerCase()
                ) &&
                (
                    !filtroGenero ||
                    jogo.genero.toLowerCase().includes(filtroGenero)
                )
            );

            exibirJogos(resultado);
        }

        busca?.addEventListener("input", aplicarFiltros);
        buscaTopo?.addEventListener("input", () => {
            if (busca) {
                busca.value = buscaTopo.value;
                busca.dispatchEvent(new Event("input", { bubbles: true }));
            }
        });
        busca?.addEventListener("input", () => {
            if (buscaTopo) buscaTopo.value = busca.value;
        });
        plataforma?.addEventListener("change", aplicarFiltros);
        genero?.addEventListener("input", aplicarFiltros);

        renderizarCarrosselHero(jogosDemonstracao);
        renderizarJogosDestaque(jogosDemonstracao);
        renderizarCategorias(jogosDemonstracao, valor => {
            if (genero) {
                genero.value = valor;
                aplicarFiltros();
                document.getElementById("catalogo").scrollIntoView({
                    behavior: "smooth"
                });
            }
        });

        const listaDestaques = document.getElementById("listaDestaques");
        document.getElementById("destaquesAnterior")?.addEventListener("click", () => {
            listaDestaques?.scrollBy({ left: -280, behavior: "smooth" });
        });
        document.getElementById("destaquesProximo")?.addEventListener("click", () => {
            listaDestaques?.scrollBy({ left: 280, behavior: "smooth" });
        });
        atualizarContadorCarrinho();

    } catch (erro) {
        console.error("Erro no catálogo:", erro);

        if (contador) {
            contador.textContent = "Erro ao carregar";
        }

        if (container) {
            container.textContent = "Não foi possível carregar os jogos.";
        }
    }
});
