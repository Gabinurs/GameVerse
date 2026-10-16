
let jogosDemonstracao = [];

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
    jogosDemonstracao[0] instanceof Jogo
);

return jogosDemonstracao;
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function exibirJogos(lista = jogosDemonstracao) {
    const container = document.getElementById("listaJogos");

    if (!container) {
        throw new Error("Elemento listaJogos não encontrado no HTML.");
    }

    container.innerHTML = "";

    lista.forEach(jogo => {
        const imagem = jogo.imagem ||
            "https://placehold.co/600x400/172342/FFFFFF?text=GameVerse";

        container.innerHTML += `
            <article class="card-jogo">
                <img src="${imagem}" alt="${jogo.nome}"
                     onerror="this.onerror=null;this.src='https://placehold.co/600x400/172342/FFFFFF?text=GameVerse'">

                <div class="info-jogo">
                    <p>${jogo.plataforma} · ${jogo.genero}</p>
                    <h3>${jogo.nome}</h3>
                    <p class="preco-jogo">${formatarPreco(jogo.preco)}</p>
                    <p>${jogo.estoque} unidades em estoque</p>
                    <button onclick="verDetalhes(${jogo.id})">
                        Ver detalhes
                    </button>
                </div>
            </article>
        `;
    });

    const contador = document.getElementById("contadorJogos");

    if (contador) {
        contador.textContent = `${lista.length} jogos encontrados`;
    }
}

function verDetalhes(id) {
    const jogo = jogosDemonstracao.find(item => item.id === Number(id));

    if (!jogo) {
        alert("Jogo não encontrado.");
        return;
    }

    alert(
        `Jogo: ${jogo.nome}\n` +
        `Plataforma: ${jogo.plataforma}\n` +
        `Gênero: ${jogo.genero}\n` +
        `Preço: ${formatarPreco(jogo.preco)}\n` +
        `Estoque: ${jogo.estoque} unidades`
    );
}
