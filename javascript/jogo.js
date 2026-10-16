
class Jogo {
    constructor(id, nome, plataforma, genero, preco, estoque, imagem) {
        this.id = id;
        this.nome = nome;
        this.plataforma = plataforma;
        this.genero = genero;
        this.preco = Number(preco);
        this.estoque = Number(estoque);
        this.imagem = imagem;
    }
}
