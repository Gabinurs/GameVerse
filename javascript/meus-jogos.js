document.addEventListener("DOMContentLoaded", () => {
    const lista = document.getElementById("listaCarrinho");
    const mensagem = document.getElementById("mensagemCarrinho");
    const subtotal = document.getElementById("subtotalCarrinho");
    const total = document.getElementById("totalCarrinho");
    const formCompra = document.getElementById("formCompra");
    const botaoFinalizar = document.getElementById("btnFinalizarCompra");
    const botaoEsvaziar = document.getElementById("btnEsvaziarCarrinho");
    let itensCarrinho = [];

    const moeda = valor => Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    async function requisicao(url, opcoes = {}) {
        const resposta = await fetch(url, {
            credentials: "same-origin",
            ...opcoes
        });

        const tipoConteudo = resposta.headers.get("content-type") || "";

        if (!tipoConteudo.includes("application/json")) {
            throw new Error(
                "O servidor da loja não encontrou a API do carrinho. " +
                "Reinicie com npm start e abra a loja pelo endereço do servidor " +
                "(normalmente http://localhost:3000)."
            );
        }

        const dados = await resposta.json();

        if (resposta.status === 401) {
            window.location.href = "login.html";
            return null;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível atualizar o carrinho.");
        }

        return dados;
    }

    function renderizarCarrinho() {
        lista.replaceChildren();

        if (itensCarrinho.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "estado-carrinho";
            vazio.textContent = "Seu carrinho está vazio. Explore os jogos e adicione sua próxima aventura.";
            lista.append(vazio);
            subtotal.textContent = moeda(0);
            total.textContent = moeda(0);
            botaoFinalizar.disabled = true;
            botaoEsvaziar.hidden = true;
            return;
        }

        const valorTotal = itensCarrinho.reduce(
            (soma, item) => soma + Number(item.preco) * item.quantidade,
            0
        );
        subtotal.textContent = moeda(valorTotal);
        total.textContent = moeda(valorTotal);
        botaoFinalizar.disabled = false;
        botaoEsvaziar.hidden = false;

        itensCarrinho.forEach(item => {
            const artigo = document.createElement("article");
            artigo.className = "item-carrinho";

            const imagem = document.createElement("img");
            imagem.src = item.imagem || "imagens/elden-ring.jpg";
            imagem.alt = item.nome;
            imagem.onerror = () => {
                imagem.onerror = null;
                imagem.src = "imagens/elden-ring.jpg";
            };

            const descricao = document.createElement("div");
            descricao.className = "descricao-carrinho";
            const nome = document.createElement("h2");
            nome.textContent = item.nome;
            const plataforma = document.createElement("p");
            plataforma.textContent = item.plataforma;
            const preco = document.createElement("p");
            preco.textContent = `${moeda(item.preco)} cada`;
            const subtotalItem = document.createElement("strong");
            subtotalItem.textContent = moeda(item.preco * item.quantidade);
            descricao.append(nome, plataforma, preco, subtotalItem);

            const controles = document.createElement("div");
            controles.className = "controles-carrinho";
            const quantidadeLabel = document.createElement("label");
            quantidadeLabel.textContent = "Quantidade";
            const quantidade = document.createElement("input");
            quantidade.type = "number";
            quantidade.min = "0";
            quantidade.max = String(item.estoque);
            quantidade.value = String(item.quantidade);
            quantidade.setAttribute("aria-label", `Quantidade de ${item.nome}`);
            quantidade.addEventListener("change", () => {
                alterarQuantidade(item.id, Number(quantidade.value));
            });

            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "botao-remover-carrinho";
            remover.textContent = "Remover";
            remover.addEventListener("click", () => alterarQuantidade(item.id, 0));
            controles.append(quantidadeLabel, quantidade, remover);
            artigo.append(imagem, descricao, controles);
            lista.append(artigo);
        });
    }

    async function carregarCarrinho() {
        mensagem.textContent = "Carregando seu carrinho...";
        try {
            const dados = await requisicao("/api/carrinho", {
                cache: "no-store"
            });
            if (dados === null) return;

            itensCarrinho = dados;
            renderizarCarrinho();
            mensagem.textContent = itensCarrinho.length
                ? `${itensCarrinho.length} jogo(s) no carrinho.`
                : "Nenhum jogo adicionado ainda.";
        } catch (erro) {
            console.error("Erro ao carregar carrinho:", erro);
            mensagem.textContent = erro.message;
            mensagem.classList.add("mensagem-erro");
        }
    }

    async function alterarQuantidade(id, quantidade) {
        try {
            await requisicao(`/api/carrinho/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantidade })
            });
            mensagem.classList.remove("mensagem-erro");
            await carregarCarrinho();
        } catch (erro) {
            console.error("Erro ao atualizar carrinho:", erro);
            mensagem.textContent = erro.message;
            mensagem.classList.add("mensagem-erro");
            await carregarCarrinho();
        }
    }

    botaoEsvaziar.addEventListener("click", async () => {
        try {
            await requisicao("/api/carrinho", { method: "DELETE" });
            await carregarCarrinho();
        } catch (erro) {
            console.error("Erro ao esvaziar carrinho:", erro);
            mensagem.textContent = erro.message;
            mensagem.classList.add("mensagem-erro");
        }
    });

    formCompra.addEventListener("submit", async evento => {
        evento.preventDefault();
        botaoFinalizar.disabled = true;
        mensagem.textContent = "Registrando seu pedido...";
        mensagem.classList.remove("mensagem-erro");

        try {
            const resultado = await requisicao("/api/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    formaPagamento: document.getElementById("formaPagamento").value
                })
            });
            if (resultado === null) return;

            formCompra.reset();
            await carregarCarrinho();
            mensagem.classList.remove("mensagem-erro");
            mensagem.textContent =
                `Pedido #${resultado.pedido.id} registrado com sucesso. Obrigado pela compra!`;
        } catch (erro) {
            console.error("Erro ao finalizar pedido:", erro);
            mensagem.textContent = erro.message;
            mensagem.classList.add("mensagem-erro");
            botaoFinalizar.disabled = itensCarrinho.length === 0;
        }
    });

    carregarCarrinho();
});
