
const API_ADMIN = "/api/jogos";

let jogosAdmin = [];

async function carregarJogosAdmin() {
    const resposta = await fetch(API_ADMIN);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar os jogos.");
    }

    jogosAdmin = await resposta.json();
    renderizarAdministracao();
}

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
                <button type="button" onclick="editarJogo(${jogo.id})">
                    Editar
                </button>
                <button type="button" onclick="excluirJogo(${jogo.id})">
                    Excluir
                </button>
            </div>
        </article>
    `).join("");
}

function limparFormulario() {
    document.getElementById("formJogo").reset();
    document.getElementById("jogoId").value = "";
    document.getElementById("btnSalvar").textContent = "Cadastrar jogo";
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("formJogo");

    try {
        await carregarJogosAdmin();
    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar os jogos. Verifique o servidor.");
    }

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
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(jogo)
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Não foi possível salvar o jogo.");
            }

            await carregarJogosAdmin();
            limparFormulario();
            alert(id ? "Jogo atualizado!" : "Jogo cadastrado!");

        } catch (erro) {
            console.error(erro);
            alert(erro.message);
        }
    });

    form.addEventListener("reset", () => {
        document.getElementById("jogoId").value = "";
        document.getElementById("btnSalvar").textContent = "Cadastrar jogo";
    });
});

function editarJogo(id) {
    const jogo = jogosAdmin.find(item => item.id === id);

    if (!jogo) return;

    document.getElementById("jogoId").value = jogo.id;
    document.getElementById("nome").value = jogo.nome;
    document.getElementById("plataforma").value = jogo.plataforma;
    document.getElementById("genero").value = jogo.genero;
    document.getElementById("preco").value = jogo.preco;
    document.getElementById("estoque").value = jogo.estoque;
    document.getElementById("imagem").value = jogo.imagem || "";
    document.getElementById("btnSalvar").textContent = "Salvar alterações";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirJogo(id) {
    const jogo = jogosAdmin.find(item => item.id === id);

    if (!jogo || !confirm(`Deseja excluir "${jogo.nome}"?`)) return;

    try {
        const resposta = await fetch(`${API_ADMIN}/${id}`, {
            method: "DELETE"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível excluir o jogo.");
        }

        await carregarJogosAdmin();
        alert("Jogo excluído com sucesso!");

    } catch (erro) {
        console.error(erro);
        alert(erro.message);
    }
}
// Reseta a aplicação e apaga todos os jogos.
document.getElementById("btnResetar").addEventListener("click", async () => {
    const confirmar = confirm(
        "ATENÇÃO!\n\nDeseja realmente apagar TODOS os jogos cadastrados?\nEssa ação não pode ser desfeita."
    );

    if (!confirmar) {
        return;
    }

    try {
        const resposta = await fetch("/api/jogos/resetar", {
            method: "DELETE"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Erro ao resetar a aplicação.");
        }

        await carregarJogosAdmin();

        limparFormulario();

        alert("Aplicação resetada! Todos os jogos foram removidos.");
    } catch (erro) {
        console.error("Erro ao resetar:", erro);
        alert("Não foi possível resetar a aplicação. Verifique o servidor.");
    }
});