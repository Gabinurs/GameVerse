
const listaFavoritos = document.getElementById("listaFavoritos");
const mensagemFavoritos = document.getElementById("mensagemFavoritos");

// ========================================
// FORMATAR PREÇO
// ========================================

function formatarPrecoFavorito(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ========================================
// CARREGAR FAVORITOS
// ========================================

async function carregarMeusFavoritos() {
    mensagemFavoritos.textContent = "Carregando seus favoritos...";
    listaFavoritos.innerHTML = "";

    try {
        // Verificar se o usuário está conectado.
        const respostaLogin = await fetch("/api/auth/me", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respostaLogin.ok) {
            window.location.href = "login.html";
            return;
        }

        const dadosLogin = await respostaLogin.json();
        const usuario = dadosLogin.usuario;

        if (!usuario) {
            window.location.href = "login.html";
            return;
        }

        if (usuario.tipo === "admin") {
            mensagemFavoritos.textContent =
                "Entre com uma conta de cliente para consultar favoritos.";
            return;
        }

        // Buscar os IDs dos jogos favoritos.
        const respostaFavoritos = await fetch("/api/favoritos", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respostaFavoritos.ok) {
            throw new Error(
                "Não foi possível carregar os favoritos. Verifique o servidor."
            );
        }

        const favoritos = await respostaFavoritos.json();

        // Consultar todos os jogos cadastrados.
        const respostaJogos = await fetch("/api/jogos");

        if (!respostaJogos.ok) {
            throw new Error("Não foi possível carregar o catálogo.");
        }

        const jogos = await respostaJogos.json();

        const idsFavoritos = Array.isArray(favoritos)
            ? favoritos.map(Number)
            : [];

        const jogosFavoritos = jogos.filter(jogo =>
            idsFavoritos.includes(Number(jogo.id))
        );

        if (jogosFavoritos.length === 0) {
            mensagemFavoritos.textContent =
                "Você ainda não adicionou jogos aos favoritos.";
            return;
        }

        mensagemFavoritos.textContent =
            `${jogosFavoritos.length} jogo(s) nos seus favoritos.`;

        // Criar um cartão para cada jogo favorito.
        jogosFavoritos.forEach(jogo => {
            const card = document.createElement("article");
            card.className = "card-favorito";

            const imagem = document.createElement("img");
            imagem.src = jogo.imagem ||
                "https://placehold.co/600x400/172342/FFFFFF?text=GameVerse";
            imagem.alt = jogo.nome;

            imagem.onerror = function () {
                this.onerror = null;
                this.src =
                    "https://placehold.co/600x400/172342/FFFFFF?text=GameVerse";
            };

            const conteudo = document.createElement("div");
            conteudo.className = "conteudo-favorito";

            const plataforma = document.createElement("p");
            plataforma.textContent =
                `${jogo.plataforma} · ${jogo.genero}`;

            const nome = document.createElement("h2");
            nome.textContent = jogo.nome;

            const preco = document.createElement("p");
            preco.className = "preco-favorito";
            preco.textContent = formatarPrecoFavorito(jogo.preco);

            const botaoDetalhes = document.createElement("button");
            botaoDetalhes.type = "button";
            botaoDetalhes.className = "btn-detalhes-favorito";
            botaoDetalhes.textContent = "Ver detalhes";

            botaoDetalhes.addEventListener("click", () => {
                window.location.href =
                    `detalhes.html?id=${encodeURIComponent(jogo.id)}`;
            });

            const botaoRemover = document.createElement("button");
            botaoRemover.type = "button";
            botaoRemover.className = "btn-remover-favorito";
            botaoRemover.textContent = "♥ Remover dos favoritos";

            botaoRemover.addEventListener("click", async () => {
                await removerFavorito(jogo.id, botaoRemover);
            });

            conteudo.append(
                plataforma,
                nome,
                preco,
                botaoDetalhes,
                botaoRemover
            );

            card.append(imagem, conteudo);
            listaFavoritos.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar favoritos:", erro);
        mensagemFavoritos.textContent = erro.message;
    }
}

// ========================================
// REMOVER DOS FAVORITOS
// ========================================

async function removerFavorito(id, botao) {
    botao.disabled = true;

    try {
        const resposta = await fetch(`/api/favoritos/${id}`, {
            method: "DELETE",
            credentials: "same-origin"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Não foi possível remover o favorito."
            );
        }

        await carregarMeusFavoritos();

    } catch (erro) {
        console.error("Erro ao remover favorito:", erro);
        alert(erro.message);
        botao.disabled = false;
    }
}

// ========================================
// INICIAR PÁGINA
// ========================================

carregarMeusFavoritos();
