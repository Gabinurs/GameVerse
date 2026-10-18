
const API_ADMIN = "/api/jogos";

let jogosAdmin = [];
let unidadesVendidasPorJogo = new Map();

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function criarCartaoResumo(rotulo, valor) {
    const artigo = document.createElement("article");
    artigo.className = "card-resumo-vendas";
    const titulo = document.createElement("h3");
    titulo.textContent = rotulo;
    const texto = document.createElement("p");
    texto.textContent = valor;
    artigo.append(titulo, texto);
    return artigo;
}

async function carregarPedidosAdmin() {
    const resumoContainer = document.getElementById("resumoVendas");
    const listaPedidos = document.getElementById("listaPedidos");
    const badge = document.getElementById("badgePedidos");
    const resposta = await fetch("/api/admin/pedidos", {
        credentials: "same-origin",
        cache: "no-store"
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar os pedidos.");
    }

    const resumo = dados.resumo;
    unidadesVendidasPorJogo = new Map(
        dados.estoquePorJogo.map(item => [
            Number(item.id),
            Number(item.unidadesVendidas)
        ])
    );
    renderizarAdministracao();
    resumoContainer.replaceChildren(
        criarCartaoResumo("Unidades disponíveis no estoque", resumo.unidadesEstoque),
        criarCartaoResumo("Pedidos neste mês", resumo.vendasMes),
        criarCartaoResumo("Unidades vendidas neste mês", resumo.unidadesVendidasMes),
        criarCartaoResumo("Faturamento registrado neste mês", formatarMoeda(resumo.faturamentoMes))
    );

    badge.textContent = String(resumo.pedidosNaoVisualizados);
    badge.hidden = resumo.pedidosNaoVisualizados === 0;

    listaPedidos.replaceChildren();
    if (dados.pedidos.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "estado-carrinho";
        vazio.textContent = "Ainda não há pedidos registrados.";
        listaPedidos.append(vazio);
        return;
    }

    dados.pedidos.forEach(pedido => {
        const artigo = document.createElement("article");
        artigo.className = "card-pedido";

        const topo = document.createElement("div");
        topo.className = "topo-pedido";
        const identificacao = document.createElement("div");
        const titulo = document.createElement("h3");
        titulo.textContent = `Pedido #${pedido.id}`;
        const cliente = document.createElement("p");
        cliente.textContent = `${pedido.nomeUsuario} (@${pedido.usuario})`;
        const data = document.createElement("p");
        data.textContent = new Date(pedido.criadoEm).toLocaleString("pt-BR");
        identificacao.append(titulo, cliente, data);
        topo.append(identificacao);

        if (!pedido.visualizado) {
            const novo = document.createElement("span");
            novo.className = "etiqueta-pedido-novo";
            novo.textContent = "Novo";
            topo.append(novo);
        }

        const formaPagamento = {
            debito: "Cartão de débito",
            credito: "Cartão de crédito",
            pix: "Pix"
        }[pedido.formaPagamento] || pedido.formaPagamento;
        const pagamento = document.createElement("p");
        pagamento.className = "pagamento-pedido";
        pagamento.textContent =
            `Pagamento: ${formaPagamento} · Total: ${formatarMoeda(pedido.total)}`;

        const itens = document.createElement("ul");
        itens.className = "itens-pedido";
        pedido.itens.forEach(item => {
            const linha = document.createElement("li");
            linha.textContent =
                `${item.quantidade} × ${item.nome} — ${formatarMoeda(item.subtotal)}`;
            itens.append(linha);
        });

        artigo.append(topo, pagamento, itens);
        if (!pedido.visualizado) {
            const marcar = document.createElement("button");
            marcar.type = "button";
            marcar.className = "botao-secundario";
            marcar.textContent = "Marcar como lida";
            marcar.addEventListener("click", async () => {
                marcar.disabled = true;
                try {
                    const resultado = await fetch(
                        `/api/admin/pedidos/${encodeURIComponent(pedido.id)}/visualizado`,
                        { method: "PATCH", credentials: "same-origin" }
                    );
                    const respostaJson = await resultado.json();
                    if (!resultado.ok) {
                        throw new Error(respostaJson.erro || "Não foi possível atualizar.");
                    }
                    await carregarPedidosAdmin();
                } catch (erro) {
                    console.error("Erro ao marcar pedido como lido:", erro);
                    alert(erro.message);
                    marcar.disabled = false;
                }
            });
            artigo.append(marcar);
        }

        listaPedidos.append(artigo);
    });
}

// ========================================
// CARREGAR JOGOS
// ========================================

async function carregarJogosAdmin() {
    const resposta = await fetch(API_ADMIN);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar os jogos.");
    }

    jogosAdmin = await resposta.json();
    renderizarAdministracao();
}

// ========================================
// RENDERIZAR LISTA ADMINISTRATIVA
// ========================================

function renderizarAdministracao() {
    const lista = document.getElementById("listaAdministrativa");

    if (!lista) return;

    if (jogosAdmin.length === 0) {
        lista.innerHTML = "<p>Nenhum jogo cadastrado.</p>";
        return;
    }

    lista.innerHTML = jogosAdmin.map(jogo => `
        <article class="card-jogo">
            <div class="info-jogo">
                <h3>${jogo.nome}</h3>
                <p>${jogo.plataforma} · ${jogo.genero}</p>
                <p>R$ ${Number(jogo.preco).toFixed(2).replace(".", ",")}</p>
                <p>Disponíveis: ${jogo.estoque} · Vendidos: ${
                    unidadesVendidasPorJogo.get(Number(jogo.id)) || 0
                }</p>

                <button
                    type="button"
                    onclick="editarJogo(${Number(jogo.id)})"
                >
                    Editar
                </button>

                <button
                    type="button"
                    onclick="excluirJogo(${Number(jogo.id)})"
                >
                    Excluir
                </button>
            </div>
        </article>
    `).join("");
}

// ========================================
// LIMPAR FORMULÁRIO
// ========================================

function limparFormulario() {
    const form = document.getElementById("formJogo");

    if (form) {
        form.reset();
    }

    document.getElementById("jogoId").value = "";
    document.getElementById("btnSalvar").textContent = "Cadastrar jogo";

    const titulo = document.getElementById("tituloFormulario");

    if (titulo) {
        titulo.textContent = "Cadastrar novo jogo";
    }
}

// ========================================
// INICIALIZAÇÃO DOS EVENTOS
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("formJogo");
    const btnResetar = document.getElementById("btnResetar");
    const btnAtualizarPedidos = document.getElementById("btnAtualizarPedidos");

    // Carrega os jogos existentes.
    try {
        await Promise.all([
            carregarJogosAdmin(),
            carregarPedidosAdmin()
        ]);
    } catch (erro) {
        console.error("Erro ao carregar painel administrativo:", erro);
        alert("Erro ao carregar os dados administrativos. Verifique se o servidor está funcionando.");
    }

    btnAtualizarPedidos.addEventListener("click", async () => {
        btnAtualizarPedidos.disabled = true;
        try {
            await Promise.all([
                carregarJogosAdmin(),
                carregarPedidosAdmin()
            ]);
        } catch (erro) {
            console.error("Erro ao atualizar painel:", erro);
            alert(erro.message);
        } finally {
            btnAtualizarPedidos.disabled = false;
        }
    });

    window.setInterval(async () => {
        try {
            await carregarPedidosAdmin();
        } catch (erro) {
            console.error("Erro ao atualizar notificações de pedidos:", erro);
        }
    }, 30000);

    // ========================================
    // CADASTRO E EDIÇÃO
    // ========================================

    if (form) {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            const id = document.getElementById("jogoId").value;

            const jogo = {
                nome: document.getElementById("nome").value.trim(),
                plataforma: document.getElementById("plataforma").value,
                genero: document.getElementById("genero").value.trim(),
                preco: Number(document.getElementById("preco").value),
                estoque: Number(document.getElementById("estoque").value),
                imagem: document.getElementById("imagem").value.trim()
            };

            if (
                !jogo.nome ||
                !jogo.plataforma ||
                !jogo.genero ||
                !Number.isFinite(jogo.preco) ||
                jogo.preco < 0 ||
                !Number.isInteger(jogo.estoque) ||
                jogo.estoque < 0
            ) {
                alert("Preencha os campos corretamente.");
                return;
            }

            try {
                const resposta = await fetch(
                    id ? `${API_ADMIN}/${id}` : API_ADMIN,
                    {
                        method: id ? "PUT" : "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(jogo)
                    }
                );

                const resultado = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        resultado.erro || "Não foi possível salvar o jogo."
                    );
                }

                await carregarJogosAdmin();
                await carregarPedidosAdmin();
                limparFormulario();

                alert(id ? "Jogo atualizado!" : "Jogo cadastrado!");
            } catch (erro) {
                console.error("Erro ao salvar jogo:", erro);
                alert(erro.message);
            }
        });

        form.addEventListener("reset", () => {
            document.getElementById("jogoId").value = "";
            document.getElementById("btnSalvar").textContent = "Cadastrar jogo";

            const titulo = document.getElementById("tituloFormulario");

            if (titulo) {
                titulo.textContent = "Cadastrar novo jogo";
            }
        });
    }

    // ========================================
    // RESETAR APLICAÇÃO
    // ========================================

    if (btnResetar) {
        btnResetar.addEventListener("click", async () => {
            const confirmar = confirm(
                "ATENÇÃO!\n\n" +
                "Deseja realmente apagar TODOS os jogos cadastrados?\n\n" +
                "Essa ação não pode ser desfeita."
            );

            if (!confirmar) return;

            btnResetar.disabled = true;

            try {
                // Chama especificamente a rota de reset.
                const resposta = await fetch("/api/jogos/resetar", {
                    method: "DELETE"
                });

                const resultado = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        resultado.erro || "Não foi possível resetar a aplicação."
                    );
                }

                await carregarJogosAdmin();
                await carregarPedidosAdmin();
                limparFormulario();

                alert("Aplicação resetada com sucesso!");
            } catch (erro) {
                console.error("Erro ao resetar a aplicação:", erro);
                alert(erro.message || "Erro ao resetar a aplicação.");
            } finally {
                btnResetar.disabled = false;
            }
        });
    }
});

// ========================================
// EDITAR JOGO
// ========================================

function editarJogo(id) {
    const jogo = jogosAdmin.find(
        item => Number(item.id) === Number(id)
    );

    if (!jogo) {
        alert("Não foi possível localizar esse jogo para edição.");
        return;
    }

    document.getElementById("jogoId").value = jogo.id;
    document.getElementById("nome").value = jogo.nome;
    document.getElementById("plataforma").value = jogo.plataforma;
    document.getElementById("genero").value = jogo.genero;
    document.getElementById("preco").value = jogo.preco;
    document.getElementById("estoque").value = jogo.estoque;
    document.getElementById("imagem").value = jogo.imagem || "";
    document.getElementById("btnSalvar").textContent = "Salvar alterações";

    const titulo = document.getElementById("tituloFormulario");

    if (titulo) {
        titulo.textContent = "Editar jogo";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ========================================
// EXCLUIR JOGO
// ========================================

async function excluirJogo(id) {
    const jogo = jogosAdmin.find(
        item => Number(item.id) === Number(id)
    );

    if (!jogo) {
        alert("Não foi possível localizar esse jogo para exclusão.");
        return;
    }

    if (!confirm(`Deseja excluir o jogo "${jogo.nome}"?`)) {
        return;
    }

    try {
        const resposta = await fetch(
            `${API_ADMIN}/${Number(id)}`,
            {
                method: "DELETE"
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível excluir o jogo."
            );
        }

        await carregarJogosAdmin();
        await carregarPedidosAdmin();

        alert("Jogo excluído com sucesso!");
    } catch (erro) {
        console.error("Erro ao excluir jogo:", erro);
        alert(erro.message);
    }
}
