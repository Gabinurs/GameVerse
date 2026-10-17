
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
            <button type="button" id="btnEntrar">
                Entrar
            </button>

            <button type="button" id="btnCriarConta"
                class="botao-principal">
                Criar conta
            </button>
        `;

        document.getElementById("btnEntrar").addEventListener("click", () => {
            window.location.href = "login.html";
        });

        document.getElementById("btnCriarConta").addEventListener("click", () => {
            window.location.href = "cadastro.html";
        });
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
        plataforma?.addEventListener("change", aplicarFiltros);
        genero?.addEventListener("input", aplicarFiltros);

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
