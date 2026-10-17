
const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
const PORTA = 3000;

const pastaProjeto = path.join(__dirname, "..");
const arquivoJogos = path.join(pastaProjeto, "dados", "jogos.json");
const arquivoUsuarios = path.join(pastaProjeto, "dados", "usuarios.json");

app.use(express.json());

app.use(session({
    name: "gameverse.sid",
    secret: process.env.SESSION_SECRET || "gameverse-chave-local-desenvolvimento",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// ========================================
// AUTENTICACAO E CONTROLE DE ACESSO
// ========================================

async function lerUsuarios() {
    try {
        const conteudo = await fs.readFile(arquivoUsuarios, "utf8");
        const usuarios = JSON.parse(conteudo);

        if (!Array.isArray(usuarios)) {
            throw new Error("O arquivo usuarios.json deve conter uma lista.");
        }

        return usuarios;
    } catch (erro) {
        if (erro.code === "ENOENT") {
            await gravarUsuarios([]);
            return [];
        }

        throw erro;
    }
}

async function gravarUsuarios(usuarios) {
    await fs.writeFile(
        arquivoUsuarios,
        JSON.stringify(usuarios, null, 2),
        "utf8"
    );
}

function exigirLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Faça login para continuar."
        });
    }

    next();
}

function exigirAdmin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Faça login para continuar."
        });
    }

    if (req.session.usuario.tipo !== "admin") {
        return res.status(403).json({
            erro: "Acesso permitido somente ao administrador."
        });
    }

    next();
}

// Impede acesso direto ao painel sem login de administrador.
app.get("/admin.html", (req, res) => {
    if (!req.session.usuario) {
        return res.redirect("/login.html");
    }

    if (req.session.usuario.tipo !== "admin") {
        return res.status(403).send(
            "Acesso negado. Esta página é exclusiva do administrador."
        );
    }

    res.sendFile(path.join(pastaProjeto, "admin.html"));
});

// Disponibiliza os arquivos do projeto.
app.use(express.static(pastaProjeto));

// ========================================
// CADASTRO DE USUARIO
// ========================================

app.post("/api/auth/cadastro", async (req, res) => {
    try {
        const { nome, usuario, senha, confirmarSenha } = req.body;

        if (
            typeof nome !== "string" ||
            typeof usuario !== "string" ||
            typeof senha !== "string" ||
            typeof confirmarSenha !== "string" ||
            !nome.trim() ||
            !usuario.trim() ||
            !senha
        ) {
            return res.status(400).json({
                erro: "Preencha todos os campos."
            });
        }

        if (nome.trim().length > 100 || usuario.trim().length > 30) {
            return res.status(400).json({
                erro: "O nome ou usuário ultrapassa o tamanho permitido."
            });
        }

        if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(usuario.trim())) {
            return res.status(400).json({
                erro: "O usuário deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto, hífen ou sublinhado."
            });
        }

        if (senha.length < 6 || senha.length > 72) {
            return res.status(400).json({
                erro: "A senha deve ter entre 6 e 72 caracteres."
            });
        }

        if (senha !== confirmarSenha) {
            return res.status(400).json({
                erro: "As senhas não coincidem."
            });
        }


        // Reservar o nome admin.
        if (usuario.trim().toLowerCase() === "admin") {
            return res.status(409).json({
                erro: "Esse nome de usuário não está disponível."
            });
        }

        const usuarios = await lerUsuarios();

        // Verificar se o usuário já existe.
        const usuarioExiste = usuarios.some(
            item =>
                item.usuario.toLowerCase() ===
                usuario.trim().toLowerCase()
        );

        if (usuarioExiste) {
            return res.status(409).json({
                erro: "Esse nome de usuário já está cadastrado."
            });
        }

        // Criar a conta com senha criptografada.
        const novoUsuario = {
            id: Date.now().toString(),
            nome: nome.trim(),
            usuario: usuario.trim(),
            senhaHash: await bcrypt.hash(senha, 10),
            tipo: "usuario",
            favoritos: []
        };

        usuarios.push(novoUsuario);
        await gravarUsuarios(usuarios);

        return res.status(201).json({
            mensagem: "Cadastro realizado com sucesso! Agora faça login."
        });

    } catch (erro) {
        console.error("Erro no cadastro:", erro);

        return res.status(500).json({
            erro: "Não foi possível realizar o cadastro."
        });
    }
});


// ========================================
// LOGIN
// ========================================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        if (
            typeof usuario !== "string" ||
            typeof senha !== "string" ||
            !usuario.trim() ||
            !senha
        ) {
            return res.status(400).json({
                erro: "Informe seu usuário e senha."
            });
        }

        const usuarios = await lerUsuarios();
        const conta = usuarios.find(
            item => item.usuario.toLowerCase() === usuario.trim().toLowerCase()
        );

        if (!conta || !(await bcrypt.compare(senha, conta.senhaHash))) {
            return res.status(401).json({
                erro: "Usuário ou senha inválidos."
            });
        }

        req.session.usuario = {
            id: conta.id,
            nome: conta.nome,
            usuario: conta.usuario,
            tipo: conta.tipo
        };

        return res.json({
            mensagem: "Login realizado com sucesso.",
            destino: conta.tipo === "admin" ? "/admin.html" : "/index.html"
        });
    } catch (erro) {
        console.error("Erro no login:", erro);

        return res.status(500).json({
            erro: "Não foi possível realizar o login."
        });
    }
});


// ========================================
// CONSULTAR USUARIO LOGADO
// ========================================

app.get("/api/auth/me", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Nenhum usuário está conectado."
        });
    }

    res.json({
        usuario: req.session.usuario
    });
});

// ========================================
// SAIR DA CONTA
// ========================================

app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar sessão:", erro);

            return res.status(500).json({
                erro: "Não foi possível sair da conta."
            });
        }

        res.clearCookie("gameverse.sid");

        res.json({
            mensagem: "Você saiu da sua conta."
        });
    });
});

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
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        return false;
    }

    const { nome, plataforma, genero, preco, estoque, imagem } = dados;

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
// CONSULTAR JOGOS - PUBLICO
// ========================================

app.get("/api/jogos", async (req, res) => {
    try {
        res.json(await lerJogos());
    } catch (erro) {
        console.error("Erro ao consultar jogos:", erro);

        res.status(500).json({
            erro: "Não foi possível ler os jogos."
        });
    }
});

// ========================================
// RESETAR - SOMENTE ADMIN
// ========================================

app.delete("/api/jogos/resetar", exigirAdmin, async (req, res) => {
    try {
        await gravarJogos([]);

        res.json({
            mensagem: "A lista de jogos foi zerada com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao resetar jogos:", erro);

        res.status(500).json({
            erro: "Não foi possível resetar os jogos."
        });
    }
});

// ========================================
// CADASTRAR JOGO - SOMENTE ADMIN
// ========================================

app.post("/api/jogos", exigirAdmin, async (req, res) => {
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
// ATUALIZAR JOGO - SOMENTE ADMIN
// ========================================

app.put("/api/jogos/:id", exigirAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const dados = req.body;

        if (!Number.isInteger(id) || id <= 0 || !validarJogo(dados)) {
            return res.status(400).json({
                erro: "Confira o ID e os dados enviados."
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
// EXCLUIR JOGO - SOMENTE ADMIN
// ========================================

app.delete("/api/jogos/:id", exigirAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "O ID do jogo é inválido."
            });
        }

        const jogos = await lerJogos();

        if (!jogos.some(jogo => Number(jogo.id) === id)) {
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
// FAVORITOS DA CONTA CONECTADA
// ========================================

// Consultar os favoritos do usuário.
app.get("/api/favoritos", exigirLogin, async (req, res) => {
    try {
        if (req.session.usuario.tipo === "admin") {
            return res.json([]);
        }

        const usuarios = await lerUsuarios();

        const usuario = usuarios.find(
            item => item.id === req.session.usuario.id
        );

        if (!usuario) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        if (!Array.isArray(usuario.favoritos)) {
            usuario.favoritos = [];
        }

        res.json(usuario.favoritos);

    } catch (erro) {
        console.error("Erro ao consultar favoritos:", erro);

        res.status(500).json({
            erro: "Não foi possível consultar os favoritos."
        });
    }
});

// Adicionar jogo aos favoritos.
app.post("/api/favoritos/:id", exigirLogin, async (req, res) => {
    try {
        if (req.session.usuario.tipo === "admin") {
            return res.status(403).json({
                erro: "Entre com uma conta de cliente para favoritar jogos."
            });
        }

        const idJogo = Number(req.params.id);

        if (!Number.isInteger(idJogo) || idJogo <= 0) {
            return res.status(400).json({
                erro: "ID do jogo inválido."
            });
        }

        const jogos = await lerJogos();

        const existe = jogos.some(
            jogo => Number(jogo.id) === idJogo
        );

        if (!existe) {
            return res.status(404).json({
                erro: "Jogo não encontrado."
            });
        }

        const usuarios = await lerUsuarios();

        const indice = usuarios.findIndex(
            item => item.id === req.session.usuario.id
        );

        if (indice === -1) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        const usuario = usuarios[indice];

        if (!Array.isArray(usuario.favoritos)) {
            usuario.favoritos = [];
        }

        if (!usuario.favoritos.includes(idJogo)) {
            usuario.favoritos.push(idJogo);
        }

        await gravarUsuarios(usuarios);

        res.json({
            mensagem: "Jogo adicionado aos favoritos!",
            favoritos: usuario.favoritos
        });

    } catch (erro) {
        console.error("Erro ao adicionar favorito:", erro);

        res.status(500).json({
            erro: "Não foi possível adicionar aos favoritos."
        });
    }
});

// Remover jogo dos favoritos.
app.delete("/api/favoritos/:id", exigirLogin, async (req, res) => {
    try {
        if (req.session.usuario.tipo === "admin") {
            return res.status(403).json({
                erro: "Entre com uma conta de cliente para gerenciar favoritos."
            });
        }

        const idJogo = Number(req.params.id);

        if (!Number.isInteger(idJogo) || idJogo <= 0) {
            return res.status(400).json({
                erro: "ID do jogo inválido."
            });
        }

        const usuarios = await lerUsuarios();

        const indice = usuarios.findIndex(
            item => item.id === req.session.usuario.id
        );

        if (indice === -1) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        const usuario = usuarios[indice];

        usuario.favoritos = (usuario.favoritos || []).filter(
            id => Number(id) !== idJogo
        );

        await gravarUsuarios(usuarios);

        res.json({
            mensagem: "Jogo removido dos favoritos!",
            favoritos: usuario.favoritos
        });

    } catch (erro) {
        console.error("Erro ao remover favorito:", erro);

        res.status(500).json({
            erro: "Não foi possível remover dos favoritos."
        });
    }
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORTA, () => {
    console.log(`GameVerse disponível em http://localhost:${PORTA}`);
});
