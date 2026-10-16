
document.addEventListener("DOMContentLoaded", async () => {
    const contador = document.getElementById("contadorJogos");
    const container = document.getElementById("listaJogos");

    try {
        await carregarJogos();
        exibirJogos();

        const busca = document.getElementById("busca");
        const plataforma = document.getElementById("filtroPlataforma");
        const genero = document.getElementById("filtroGenero");

        function aplicarFiltros() {
            const termo = busca?.value.toLowerCase().trim() || "";
            const filtroPlataforma = plataforma?.value || "";
            const filtroGenero = genero?.value.toLowerCase().trim() || "";

            const resultado = jogosDemonstracao.filter(jogo =>
                jogo.nome.toLowerCase().includes(termo) &&
                (!filtroPlataforma || jogo.plataforma === filtroPlataforma) &&
                (!filtroGenero || jogo.genero.toLowerCase().includes(filtroGenero))
            );

            exibirJogos(resultado);
        }

        busca?.addEventListener("input", aplicarFiltros);
        plataforma?.addEventListener("change", aplicarFiltros);
        genero?.addEventListener("input", aplicarFiltros);

    } catch (erro) {
        console.error("Erro no catálogo:", erro);

        if (contador) contador.textContent = "Erro ao carregar";

        if (container) {
            container.textContent = erro.message;
        }
    }
});
