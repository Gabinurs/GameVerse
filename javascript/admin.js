
const API_ADMIN = "/api/jogos";

let jogosAdmin = [];

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
                <p>Estoque: ${jogo.estoque}</p>

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

    // Carrega os jogos existentes.
    try {
        await carregarJogosAdmin();
    } catch (erro) {
        console.error("Erro ao carregar jogos:", erro);
        alert("Erro ao carregar os jogos. Verifique se o servidor está funcionando.");
    }

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

        alert("Jogo excluído com sucesso!");
    } catch (erro) {
        console.error("Erro ao excluir jogo:", erro);
        alert(erro.message);
    }
}
