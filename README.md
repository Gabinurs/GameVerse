# 🎮 GameVerse — Loja de Jogos Digitais

O GameVerse é um projeto acadêmico de desenvolvimento web que simula uma loja de jogos digitais. O sistema apresenta um catálogo de jogos e uma área administrativa para gerenciar os registros.

## ✨ Funcionalidades

- Catálogo de jogos com capas, preços e informações.
- Pesquisa de jogos por nome.
- Filtros por gênero e plataforma.
- Cadastro, edição e exclusão de jogos.
- Armazenamento de dados em arquivo JSON.
- Área de relatórios.
- Funcionalidade de reset da aplicação.
- Conta do cliente com consulta de usuário e troca segura de senha.
- Carrinho persistido por conta, cálculo do pedido, validação de estoque e pagamento demonstrativo por débito, crédito ou Pix.
- Notificações de pedidos no painel administrativo, com cliente, itens, forma de pagamento, estoque disponível e vendas do mês.

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- JSON
- Git e GitHub

## 📁 Estrutura do projeto

- `css/` — estilos da aplicação.
- `dados/` — arquivo JSON com os jogos.
- `html/` — página de relatórios.
- `imagens/` — capas dos jogos.
- `javascript/` — lógica e funcionalidades.
- `servidor/` — servidor e API.
- `index.html` — catálogo principal.
- `admin.html` — área administrativa.

## ▶️ Como executar

**Pré-requisito:** Node.js instalado.

1. Clone o repositório:

   ```bash
   git clone https://github.com/Gabinurs/GameVerse.git
   ```

2. Entre na pasta:

   ```bash
   cd GameVerse
   ```

3. Instale as dependências:

   ```bash
   npm install
   ```

4. Inicie o servidor:

   ```bash
   npm start
   ```

5. Acesse `http://localhost:3000` no navegador.

### Configurar a conta administrativa

Na primeira inicialização, configure as credenciais do administrador em variáveis de ambiente. A senha deve ter de 12 a 72 caracteres. O servidor grava somente o hash da senha em `dados/usuarios.json`; as variáveis podem ser removidas após a conta ser criada.

No PowerShell:

```powershell
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "uma-senha-forte-com-12-caracteres"
$env:SESSION_SECRET = "uma-chave-aleatoria-para-as-sessoes"
npm start
```

O painel administrativo fica disponível em `admin.html` após entrar com essa conta. Os métodos de pagamento são registrados apenas para demonstração; esta aplicação não processa cobranças reais.

## 🎯 Objetivo acadêmico

Aplicar conhecimentos de desenvolvimento web, manipulação de JSON, operações CRUD, organização de arquivos e integração com um servidor.

## 👩‍💻 Autoria

Gabriela Ramos — Análise e Desenvolvimento de Sistemas.

## 🤖 Uso de inteligência artificial

A inteligência artificial foi utilizada como ferramenta de apoio para esclarecer dúvidas, auxiliar na organização do projeto, sugerir melhorias no código e orientar a resolução de problemas. As funcionalidades devem ser revisadas e testadas pela autora.