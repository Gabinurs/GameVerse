
const API_RELATORIOS = "/api/jogos";

async function carregarRelatorios() {
    const container = document.getElementById("conteudoRelatorios");

    if (!container) {
        console.error("Elemento conteudoRelatorios não encontrado.");
        return;
    }

    try {
        const resposta = await fetch(API_RELATORIOS);

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar os jogos.");
        }

        const jogos = await resposta.json();

        const quantidadeJogos = jogos.length;

        const totalEstoque = jogos.reduce(
            (total, jogo) => total + Number(jogo.estoque || 0),
            0
        );

        const valorEstoque = jogos.reduce(
            (total, jogo) =>
                total +
                Number(jogo.preco || 0) * Number(jogo.estoque || 0),
            0
        );

        const jogosPorGenero = {};
        const jogosPorPlataforma = {};

        jogos.forEach(jogo => {
            const genero = jogo.genero || "Não informado";
            const plataforma = jogo.plataforma || "Não informada";

            jogosPorGenero[genero] =
                (jogosPorGenero[genero] || 0) + 1;

            jogosPorPlataforma[plataforma] =
                (jogosPorPlataforma[plataforma] || 0) + 1;
        });

        const moeda = valor =>
            Number(valor).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

        container.innerHTML = `
            <section class="resumo-relatorios">
                <article class="card-jogo">
                    <h3>Total de jogos</h3>
                    <p>${quantidadeJogos}</p>
                </article>

                <article class="card-jogo">
                    <h3>Unidades em estoque</h3>
                    <p>${totalEstoque}</p>
                </article>

                <article class="card-jogo">
                    <h3>Valor total do estoque</h3>
                    <p>${moeda(valorEstoque)}</p>
                </article>
            </section>

            <section class="secao-relatorio">
                <h2>Jogos por gênero</h2>
                ${criarTabela(jogosPorGenero, "Gênero")}
            </section>

            <section class="secao-relatorio">
                <h2>Jogos por plataforma</h2>
                ${criarTabela(jogosPorPlataforma, "Plataforma")}
            </section>

            <section class="secao-relatorio">
                <h2>Estoque por jogo</h2>

                <div class="tabela-responsiva">
                    <table>
                        <thead>
                            <tr>
                                <th>Jogo</th>
                                <th>Gênero</th>
                                <th>Plataforma</th>
                                <th>Preço</th>
                                <th>Estoque</th>
                                <th>Valor em estoque</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${jogos.map(jogo => `
                                <tr>
                                    <td>${escaparHTML(jogo.nome)}</td>
                                    <td>${escaparHTML(jogo.genero)}</td>
                                    <td>${escaparHTML(jogo.plataforma)}</td>
                                    <td>${moeda(jogo.preco)}</td>
                                    <td>${Number(jogo.estoque || 0)}</td>
                                    <td>
                                        ${moeda(
                                            Number(jogo.preco || 0) *
                                            Number(jogo.estoque || 0)
                                        )}
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    } catch (erro) {
        console.error("Erro nos relatórios:", erro);

        container.innerHTML = `
            <p>
                Não foi possível carregar os relatórios.
                Verifique se o servidor está funcionando.
            </p>
        `;
    }
}

function criarTabela(dados, titulo) {
    const linhas = Object.entries(dados)
        .sort((a, b) => b[1] - a[1])
        .map(([nome, quantidade]) => `
            <tr>
                <td>${escaparHTML(nome)}</td>
                <td>${quantidade}</td>
            </tr>
        `)
        .join("");

    return `
        <div class="tabela-responsiva">
            <table>
                <thead>
                    <tr>
                        <th>${titulo}</th>
                        <th>Quantidade de jogos</th>
                    </tr>
                </thead>

                <tbody>
                    ${linhas || `
                        <tr>
                            <td colspan="2">Nenhum registro encontrado.</td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

// Cria o botão para retornar ao painel administrativo.
function criarBotaoAdministracao() {
    const cabecalho = document.querySelector("header");

    if (!cabecalho) return;

    const botao = document.createElement("a");

    botao.href = "../admin.html";
    botao.className = "botao-voltar";
    botao.textContent = "← Voltar à administração";
    botao.style.display = "inline-flex";
    botao.style.alignItems = "center";
    botao.style.justifyContent = "center";
    botao.style.padding = "12px 18px";
    botao.style.margin = "10px 8px 10px 0";
    botao.style.borderRadius = "8px";
    botao.style.textDecoration = "none";

    cabecalho.appendChild(botao);
}

document.addEventListener("DOMContentLoaded", () => {
    criarBotaoAdministracao();
    carregarRelatorios();
});
