
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

app.use(express.json());

// Disponibiliza os arquivos do projeto no navegador.
app.use(express.static(path.join(__dirname, "..")));

// Lê os jogos do arquivo JSON.
async function lerJogos() {
    const conteudo = await fs.readFile(arquivoJogos, "utf8");
    return JSON.parse(conteudo);
}

// Grava os jogos no arquivo JSON.
async function gravarJogos(jogos) {
    await fs.writeFile(
        arquivoJogos,
        JSON.stringify(jogos, null, 2),
        "utf8"
    );
}

// Consulta todos os jogos.
app.get("/api/jogos", async (req, res) => {
    try {
        res.json(await lerJogos());
    } catch (erro) {
        res.status(500).json({
            erro: "Não foi possível ler os jogos."
        });
    }
});

// Cadastra um jogo.
app.post("/api/jogos", async (req, res) => {
    try {
        const { nome, plataforma, genero, preco, estoque, imagem } = req.body;

        if (
            typeof nome !== "string" || !nome.trim() ||
            typeof plataforma !== "string" || !plataforma.trim() ||
            typeof genero !== "string" || !genero.trim() ||
            !Number.isFinite(preco) || preco < 0 ||
            !Number.isInteger(estoque) || estoque < 0 ||
            (imagem !== undefined && typeof imagem !== "string")
        ) {
            return res.status(400).json({
                erro: "Confira os dados enviados."
            });
        }

        const jogos = await lerJogos();
        const proximoId = jogos.length
            ? Math.max(...jogos.map(jogo => jogo.id)) + 1
            : 1;

        const novoJogo = {
            id: proximoId,
            nome: nome.trim(),
            plataforma: plataforma.trim(),
            genero: genero.trim(),
            preco,
            estoque,
            imagem: imagem || ""
        };

        jogos.push(novoJogo);
        await gravarJogos(jogos);

        res.status(201).json(novoJogo);
    } catch (erro) {
        res.status(500).json({
            erro: "Não foi possível cadastrar o jogo."
        });
    }
});

// Atualiza um jogo existente.
app.put("/api/jogos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, plataforma, genero, preco, estoque, imagem } = req.body;

        if (
            !Number.isInteger(id) || id <= 0 ||
            typeof nome !== "string" || !nome.trim() ||
            typeof plataforma !== "string" || !plataforma.trim() ||
            typeof genero !== "string" || !genero.trim() ||
            !Number.isFinite(preco) || preco < 0 ||
            !Number.isInteger(estoque) || estoque < 0 ||
            (imagem !== undefined && typeof imagem !== "string")
        ) {
            return res.status(400).json({
                erro: "Confira os dados enviados."
            });
        }

        const jogos = await lerJogos();
        const indice = jogos.findIndex(jogo => jogo.id === id);

        if (indice === -1) {
            return res.status(404).json({
                erro: "Jogo não encontrado."
            });
        }

        jogos[indice] = {
            id,
            nome: nome.trim(),
            plataforma: plataforma.trim(),
            genero: genero.trim(),
            preco,
            estoque,
            imagem: imagem || ""
        };

        await gravarJogos(jogos);
        res.json(jogos[indice]);
    } catch (erro) {
        res.status(500).json({
            erro: "Não foi possível atualizar o jogo."
        });
    }
});

// Exclui um jogo.
app.delete("/api/jogos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const jogos = await lerJogos();
        const filtrados = jogos.filter(jogo => jogo.id !== id);

        if (filtrados.length === jogos.length) {
            return res.status(404).json({
                erro: "Jogo não encontrado."
            });
        }

        await gravarJogos(filtrados);
        res.json({ mensagem: "Jogo excluído com sucesso." });
    } catch (erro) {
        res.status(500).json({
            erro: "Não foi possível excluir o jogo."
        });
    }
});

// Reseta a aplicação e zera o arquivo JSON.
app.delete("/api/jogos/resetar", async (req, res) => {
    try {
        await gravarJogos([]);

        res.json({
            mensagem: "A lista de jogos foi zerada com sucesso."
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Não foi possível resetar os jogos."
        });
    }
});

// Inicializa o servidor.
app.listen(PORTA, () => {
    console.log(`GameVerse disponível em http://localhost:${PORTA}`);
});
