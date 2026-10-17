
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORTA = 3000;

const arquivoJogos = path.join(
    __dirname,
    "..",
    "dados",
    "jogos.json"
);

// Permite receber dados JSON nas requisições.
app.use(express.json());

// Disponibiliza os arquivos do projeto no navegador.
app.use(express.static(path.join(__dirname, "..")));

// ========================================
// LER E GRAVAR JOGOS
// ========================================

async function lerJogos() {
    const conteudo = await fs.readFile(arquivoJogos, "utf8");
    return JSON.parse(conteudo);
}

async function gravarJogos(jogos) {
    await fs.writeFile(
        arquivoJogos,
        JSON.stringify(jogos, null, 2),
        "utf8"
    );
}

// ========================================
// VALIDAR DADOS DO JOGO
// ========================================

function validarJogo(dados) {
    if (!dados || typeof dados !== "object") {
        return false;
    }

    const {
        nome,
        plataforma,
        genero,
        preco,
        estoque,
        imagem
    } = dados;

    return (
        typeof nome === "string" &&
        nome.trim() !== "" &&
        typeof plataforma === "string" &&
        plataforma.trim() !== "" &&
        typeof genero === "string" &&
        genero.trim() !== "" &&
        typeof preco === "number" &&
        Number.isFinite(preco) &&
        preco >= 0 &&
        typeof estoque === "number" &&
        Number.isInteger(estoque) &&
        estoque >= 0 &&
        (imagem === undefined || typeof imagem === "string")
    );
}

// ========================================
// 1. CONSULTAR TODOS OS JOGOS
// ========================================

app.get("/api/jogos", async (req, res) => {
    try {
        const jogos = await lerJogos();
        res.json(jogos);
    } catch (erro) {
        console.error("Erro ao consultar jogos:", erro);

        res.status(500).json({
            erro: "Não foi possível ler os jogos."
        });
    }
});

// ========================================
// 2. RESETAR A APLICAÇÃO
// Esta rota fica antes da rota dinâmica.
// ========================================

app.delete("/api/jogos/resetar", async (req, res) => {
    console.log("ROTA DE RESET ACIONADA");

    try {
        await gravarJogos([]);

        console.log("Catálogo GameVerse resetado.");

        res.json({
            mensagem: "A lista de jogos foi zerada com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao resetar os jogos:", erro);

        res.status(500).json({
            erro: "Não foi possível resetar os jogos."
        });
    }
});

// ========================================
// 3. CADASTRAR UM JOGO
// ========================================

app.post("/api/jogos", async (req, res) => {
    try {
        const dados = req.body;

        if (!validarJogo(dados)) {
            return res.status(400).json({
                erro: "Confira os dados enviados."
            });
        }

        const jogos = await lerJogos();

        const proximoId = jogos.length > 0
            ? Math.max(...jogos.map(jogo => Number(jogo.id) || 0)) + 1
            : 1;

        const novoJogo = {
            id: proximoId,
            nome: dados.nome.trim(),
            plataforma: dados.plataforma.trim(),
            genero: dados.genero.trim(),
            preco: dados.preco,
            estoque: dados.estoque,
            imagem: dados.imagem || ""
        };

        jogos.push(novoJogo);

        await gravarJogos(jogos);

        res.status(201).json(novoJogo);
    } catch (erro) {
        console.error("Erro ao cadastrar jogo:", erro);

        res.status(500).json({
            erro: "Não foi possível cadastrar o jogo."
        });
    }
});

// ========================================
// 4. ATUALIZAR UM JOGO
// ========================================

app.put("/api/jogos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const dados = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "O ID do jogo é inválido."
            });
        }

        if (!validarJogo(dados)) {
            return res.status(400).json({
                erro: "Confira os dados enviados."
            });
        }

        const jogos = await lerJogos();

        const indice = jogos.findIndex(
            jogo => Number(jogo.id) === id
        );

        if (indice === -1) {
            return res.status(404).json({
                erro: "Jogo não encontrado para atualização."
            });
        }

        const jogoAtualizado = {
            id,
            nome: dados.nome.trim(),
            plataforma: dados.plataforma.trim(),
            genero: dados.genero.trim(),
            preco: dados.preco,
            estoque: dados.estoque,
            imagem: dados.imagem || ""
        };

        jogos[indice] = jogoAtualizado;

        await gravarJogos(jogos);

        res.json({
            mensagem: "Jogo atualizado com sucesso.",
            jogo: jogoAtualizado
        });
    } catch (erro) {
        console.error("Erro ao atualizar jogo:", erro);

        res.status(500).json({
            erro: "Não foi possível atualizar o jogo."
        });
    }
});

// ========================================
// 5. EXCLUIR UM JOGO PELO ID
// ========================================

app.delete("/api/jogos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "O ID do jogo é inválido."
            });
        }

        const jogos = await lerJogos();

        const jogoExiste = jogos.some(
            jogo => Number(jogo.id) === id
        );

        if (!jogoExiste) {
            return res.status(404).json({
                erro: "Jogo não encontrado para exclusão."
            });
        }

        const filtrados = jogos.filter(
            jogo => Number(jogo.id) !== id
        );

        await gravarJogos(filtrados);

        res.json({
            mensagem: "Jogo excluído com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao excluir jogo:", erro);

        res.status(500).json({
            erro: "Não foi possível excluir o jogo."
        });
    }
});

// ========================================
// 6. INICIAR SERVIDOR
// ========================================

app.listen(PORTA, () => {
    console.log(
        `GameVerse disponível em http://localhost:${PORTA}`
    );
});
