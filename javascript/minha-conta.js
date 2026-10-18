document.addEventListener("DOMContentLoaded", async () => {
    const nomeConta = document.getElementById("nomeConta");
    const usuarioConta = document.getElementById("usuarioConta");
    const formSenha = document.getElementById("formSenha");
    const mensagem = document.getElementById("mensagemConta");

    try {
        const resposta = await fetch("/api/conta", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (resposta.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível carregar sua conta.");
        }

        nomeConta.textContent = dados.nome;
        usuarioConta.textContent = dados.usuario;
    } catch (erro) {
        console.error("Erro ao carregar conta:", erro);
        mensagem.textContent = erro.message;
        mensagem.classList.add("mensagem-erro");
        return;
    }

    formSenha.addEventListener("submit", async evento => {
        evento.preventDefault();
        mensagem.textContent = "Atualizando senha...";
        mensagem.classList.remove("mensagem-erro");

        const campos = new FormData(formSenha);
        try {
            const resposta = await fetch("/api/conta/senha", {
                method: "PATCH",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    senhaAtual: campos.get("senhaAtual"),
                    novaSenha: campos.get("novaSenha"),
                    confirmarSenha: campos.get("confirmarSenha")
                })
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível alterar a senha.");
            }

            formSenha.reset();
            mensagem.textContent = dados.mensagem;
        } catch (erro) {
            console.error("Erro ao alterar senha:", erro);
            mensagem.textContent = erro.message;
            mensagem.classList.add("mensagem-erro");
        }
    });
});
