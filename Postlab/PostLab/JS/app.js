// ============================================================
// CONFIGURAÇÃO GERAL
// ============================================================

// URL base da API pública usada para buscar posts, usuários e tarefas fictícias
const API_BASE = "https://jsonplaceholder.typicode.com";

// Referências para os elementos do DOM que serão manipulados.
// Centralizar tudo aqui facilita manutenção: se um ID mudar no HTML,
// só precisa atualizar em um lugar.
// ATENÇÃO: confira se os IDs abaixo batem exatamente com os do seu HTML
// (ex.: "campoBusca" vs "campo-busca" — só um dos dois pode existir).
const elementos = {
  // Posts
  listaPosts: document.querySelector("#lista-posts"),               // container onde os cartões de post são inseridos
  contadorPosts: document.querySelector("#contador-posts"),         // mostra quantos posts foram encontrados
  campoBusca: document.querySelector("#campoBusca"),                // input de busca por título de post
  filtroUsuario: document.querySelector("#filtro-usuario"),         // select para filtrar posts por autor

  // Usuários
  listaUsuarios: document.querySelector("#lista-usuarios"),         // container onde os cartões de usuário são inseridos
  contadorUsuarios: document.querySelector("#contador-usuarios"),   // mostra quantos usuários foram encontrados
  campoBuscaUsuario: document.querySelector("#campo-busca-usuario"),// input de busca por nome/email de usuário

  // Tarefas
  listaTarefas: document.querySelector("#lista-tarefas"),           // container onde os cartões de tarefa são inseridos
  contadorTarefas: document.querySelector("#contador-tarefas"),     // mostra quantas tarefas foram encontradas
  campoBuscaTarefa: document.querySelector("#campo-busca-tarefa"),  // input de busca por título de tarefa
  filtroStatusTarefa: document.querySelector("#filtro-status-tarefa"), // select para filtrar por completa/pendente

  // Compartilhado entre as três seções
  estadoInterface: document.querySelector("#estado-interface"),     // exibe mensagens de status/erro para o usuário
};

// Estado da aplicação (dados vindos da API + filtros aplicados pelo usuário)
const estado = {
  posts: [],       // lista completa de posts carregados da API
  usuarios: [],    // lista completa de usuários carregados da API
  tarefas: [],     // lista completa de tarefas carregadas da API

  termoBuscaPosts: "",     // texto digitado no campo de busca de posts
  usuarioId: "",           // id do usuário selecionado no filtro de posts (string vazia = "todos")

  termoBuscaUsuarios: "",  // texto digitado no campo de busca de usuários

  termoBuscaTarefas: "",   // texto digitado no campo de busca de tarefas
  statusTarefa: "",        // filtro de status da tarefa: "" = todas, "true" = completas, "false" = pendentes
};

// ============================================================
// COMUNICAÇÃO COM A API
// ============================================================

/**
 * Faz uma requisição GET para a API e retorna o JSON já convertido.
 * Lança um erro se a resposta HTTP não for "ok" (status fora do range 200-299).
 * @param {string} caminho - Endpoint relativo, ex: "/posts", "/users" ou "/todos"
 * @returns {Promise<any>} dados da resposta em JSON
 */
async function buscarJson(caminho) {
  const resposta = await fetch(`${API_BASE}${caminho}`);

  if (!resposta.ok) {
    // Se o status HTTP indicar erro (404, 500, etc.), interrompe o fluxo
    throw new Error(`Falha HTTP: ${resposta.status}`);
  }

  return resposta.json();
}

/**
 * Orquestra o carregamento inicial dos dados:
 * 1. Mostra mensagem de "carregando"
 * 2. Busca posts, usuários e tarefas em paralelo (Promise.all)
 * 3. Atualiza o estado global
 * 4. Popula o filtro de usuários (select da seção de posts)
 * 5. Aplica os filtros atuais de cada seção (renderiza as três listas)
 * Em caso de erro, mostra mensagem amigável e loga o erro no console.
 */
async function carregarDados() {
  mostrarEstado("Carregando publicações, autores e tarefas...");

  try {
    // Promise.all dispara as três requisições ao mesmo tempo,
    // em vez de esperar uma terminar para começar a outra (mais rápido)
    const [posts, usuarios, tarefas] = await Promise.all([
      buscarJson("/posts"),
      buscarJson("/users"),
      buscarJson("/todos"),
    ]);

    estado.posts = posts;
    estado.usuarios = usuarios;
    estado.tarefas = tarefas;

    preencherFiltroDeUsuarios(); // popula o <select> com os nomes dos autores

    // Reaplica os filtros já digitados (se houver) em vez de sempre mostrar
    // a lista completa — importante ao clicar em "Recarregar dados"
    aplicarFiltros();
    aplicarFiltrosUsuarios();
    aplicarFiltrosTarefas();
  } catch (erro) {
    // Qualquer falha na busca (rede, HTTP, parsing) cai aqui
    console.error("Falha ao carregar a API:", erro);
    mostrarEstado("Não foi possível carregar os dados.", true);
  }
}

// ============================================================
// CRIAÇÃO DE CARTÕES (elementos visuais, ainda não inseridos no DOM)
// ============================================================

/**
 * Cria (mas NÃO insere no DOM) o elemento visual de um único post.
 * Quem chama essa função é responsável por anexar o retorno em algum lugar
 * da página (ex: via renderizarPosts).
 * @param {{title: string, body: string}} post
 * @returns {HTMLElement} elemento <article> pronto para ser inserido
 */
function criarCartaoPost(post) {
  const artigo = document.createElement("article");
  artigo.className = "post";

  const titulo = document.createElement("h3");
  titulo.textContent = post.title;

  const corpo = document.createElement("p");
  corpo.textContent = post.body;

  artigo.append(titulo, corpo);
  return artigo;
}

/**
 * Cria o cartão visual de um único usuário: nome, email e empresa.
 * @param {{name: string, email: string, company: {name: string}}} usuario
 * @returns {HTMLElement} elemento <article> pronto para ser inserido
 */
function criarCartaoUsuario(usuario) {
  const artigo = document.createElement("article");
  artigo.className = "usuario";

  const nome = document.createElement("h3");
  nome.textContent = usuario.name;

  const email = document.createElement("p");
  email.textContent = usuario.email;

  const empresa = document.createElement("p");
  empresa.textContent = usuario.company.name;

  artigo.append(nome, email, empresa);
  return artigo;
}

/**
 * Cria o cartão visual de uma única tarefa: autor (userId), id, título e status.
 * @param {{userId: number, id: number, title: string, completed: boolean}} tarefa
 * @returns {HTMLElement} elemento <article> pronto para ser inserido
 */
function criarCartaoTarefa(tarefa) {
  const artigo = document.createElement("article");
  artigo.className = "tarefa";

  const UserId = document.createElement("h3");
  UserId.textContent = tarefa.userId;

  const Id = document.createElement("p");
  Id.textContent = tarefa.id;

  const titulo = document.createElement("p");
  titulo.textContent = tarefa.title;

  const status = document.createElement("p");
  status.textContent = tarefa.completed ? "Completa" : "Pendente";

  artigo.append(UserId, Id, titulo, status);
  return artigo;
}

// ============================================================
// RENDERIZAÇÃO (insere os cartões no DOM)
// ============================================================

/**
 * Limpa a lista atual na tela e insere os cartões correspondentes
 * ao array de posts recebido (já filtrado).
 * Usa DocumentFragment para inserir todos os elementos de uma vez só,
 * evitando múltiplos reflows/repaints no navegador.
 * @param {Array<object>} posts - posts já filtrados, prontos para exibir
 */
function renderizarPosts(posts) {
  elementos.listaPosts.innerHTML = ""; // remove os cartões antigos

  if (posts.length === 0) {
    // Nenhum resultado bate com os filtros atuais
    mostrarEstado("Nenhum post encontrado.");
    elementos.contadorPosts.textContent = "";
    return;
  }

  const fragmento = document.createDocumentFragment();
  posts.forEach((post) => {
    fragmento.append(criarCartaoPost(post));
  });
  elementos.listaPosts.append(fragmento);

  elementos.contadorPosts.textContent = `${posts.length} post(s) encontrado(s)`;
  mostrarEstado(""); // limpa qualquer mensagem de status/erro anterior
}

/**
 * Limpa a lista atual e insere os cartões dos usuários recebidos (já filtrados).
 * @param {Array<object>} usuarios - usuários já filtrados, prontos para exibir
 */
function renderizarUsuarios(usuarios) {
  elementos.listaUsuarios.innerHTML = ""; // limpa a lista anterior

  if (usuarios.length === 0) {
    // Nenhum resultado bate com os filtros atuais
    mostrarEstado("Nenhum usuário encontrado.");
    elementos.contadorUsuarios.textContent = "";
    return;
  }

  const fragmento = document.createDocumentFragment();
  usuarios.forEach((usuario) => {
    fragmento.append(criarCartaoUsuario(usuario));
  });
  elementos.listaUsuarios.append(fragmento);

  elementos.contadorUsuarios.textContent = `${usuarios.length} usuario(s) encontrado(s)`;
  mostrarEstado(""); // limpa qualquer mensagem de status/erro anterior
}

/**
 * Limpa a lista atual e insere os cartões das tarefas recebidas (já filtradas).
 * @param {Array<object>} tarefas - tarefas já filtradas, prontas para exibir
 */
function renderizarTarefas(tarefas) {
  elementos.listaTarefas.innerHTML = ""; // limpa a lista anterior

  if (tarefas.length === 0) {
    // Nenhum resultado bate com os filtros atuais
    mostrarEstado("Nenhuma tarefa encontrada.");
    elementos.contadorTarefas.textContent = "";
    return;
  }

  const fragmento = document.createDocumentFragment();
  tarefas.forEach((tarefa) => {
    fragmento.append(criarCartaoTarefa(tarefa));
  });
  elementos.listaTarefas.append(fragmento);

  elementos.contadorTarefas.textContent = `${tarefas.length} tarefa(s) encontrado(s)`;
  mostrarEstado(""); // limpa qualquer mensagem de status/erro anterior
}

/**
 * Exibe uma mensagem de status para o usuário (ex: "Carregando...", erros, etc.)
 * Compartilhada pelas três seções através de #estado-interface.
 * @param {string} mensagem - texto a ser exibido
 * @param {boolean} ehErro - se true, adiciona a classe CSS "erro" para destaque visual
 */
function mostrarEstado(mensagem, ehErro = false) {
  elementos.estadoInterface.textContent = mensagem;
  elementos.estadoInterface.classList.toggle("erro", ehErro);
}

/**
 * Popula o <select> de filtro de posts com uma <option> para cada usuário carregado.
 * Usa o id do usuário como valor (para comparar com post.userId depois)
 * e o nome como texto visível.
 */
function preencherFiltroDeUsuarios() {
  estado.usuarios.forEach((usuario) => {
    const opcao = document.createElement("option");
    opcao.value = usuario.id;
    opcao.textContent = usuario.name;
    elementos.filtroUsuario.append(opcao);
  });
}

// ============================================================
// LÓGICA DE FILTRAGEM
// ============================================================

/**
 * Filtra estado.posts de acordo com o termo de busca (título) e o
 * usuário selecionado, depois manda o resultado para renderização.
 */
function aplicarFiltros() {
  const termo = estado.termoBuscaPosts.trim().toLowerCase();

  const resultado = estado.posts.filter((post) => {
    // Verifica se o título contém o termo digitado (case-insensitive)
    const tituloCorresponde = post.title.toLowerCase().includes(termo);

    // Se nenhum usuário estiver selecionado (""), aceita qualquer autor.
    // Caso contrário, compara o id do post com o id escolhido no filtro.
    const usuarioCorresponde =
      !estado.usuarioId || String(post.userId) === estado.usuarioId;

    return tituloCorresponde && usuarioCorresponde;
  });

  renderizarPosts(resultado);
}

/**
 * Filtra estado.usuarios de acordo com o termo de busca, comparando tanto
 * o nome quanto o email do usuário (OR — basta um dos dois bater).
 */
function aplicarFiltrosUsuarios() {
  const termo = estado.termoBuscaUsuarios.trim().toLowerCase();

  const resultado = estado.usuarios.filter((usuario) => {
    const nomeCorresponde = usuario.name.toLowerCase().includes(termo);
    const emailCorresponde = usuario.email.toLowerCase().includes(termo);
    return nomeCorresponde || emailCorresponde;
  });

  renderizarUsuarios(resultado);
}

/**
 * Filtra estado.tarefas de acordo com o termo de busca (título) e o
 * status selecionado (completa/pendente/todas).
 */
function aplicarFiltrosTarefas() {
  const termo = estado.termoBuscaTarefas.trim().toLowerCase();

  const resultado = estado.tarefas.filter((tarefa) => {
    const tituloCorresponde = tarefa.title.toLowerCase().includes(termo);

    // Se nenhum status estiver selecionado (""), aceita completas e pendentes.
    // Caso contrário, compara o status do select (string "true"/"false")
    // com o campo booleano tarefa.completed convertido para string.
    const statusCorresponde =
      !estado.statusTarefa || String(tarefa.completed) === estado.statusTarefa;

    return tituloCorresponde && statusCorresponde;
  });

  renderizarTarefas(resultado);
}

// ============================================================
// EVENTOS (interação do usuário)
// ============================================================

// ---------- Posts ----------

// Atualiza o termo de busca a cada tecla digitada e re-filtra a lista de posts
elementos.campoBusca.addEventListener("input", (evento) => {
  estado.termoBuscaPosts = evento.target.value;
  aplicarFiltros();
});

// Atualiza o usuário selecionado quando o <select> muda e re-filtra a lista de posts
elementos.filtroUsuario.addEventListener("change", (evento) => {
  estado.usuarioId = evento.target.value;
  aplicarFiltros();
});

// ---------- Usuários ----------

// Atualiza o termo de busca de usuários a cada tecla digitada
elementos.campoBuscaUsuario.addEventListener("input", (evento) => {
  estado.termoBuscaUsuarios = evento.target.value;
  aplicarFiltrosUsuarios();
});

// ---------- Tarefas ----------

// Atualiza o termo de busca de tarefas a cada tecla digitada
elementos.campoBuscaTarefa.addEventListener("input", (evento) => {
  estado.termoBuscaTarefas = evento.target.value;
  aplicarFiltrosTarefas();
});

// Atualiza o filtro de status (todas/completas/pendentes) quando o <select> muda
elementos.filtroStatusTarefa.addEventListener("change", (evento) => {
  estado.statusTarefa = evento.target.value;
  aplicarFiltrosTarefas();
});

// ---------- Ações gerais ----------

// Botão que permite recarregar os dados da API manualmente
const botaoRecarregar = document.querySelector("#botao-recarregar");
botaoRecarregar.addEventListener("click", carregarDados);

// ============================================================
// NAVEGAÇÃO ENTRE SEÇÕES (abas)
// ============================================================

/**
 * Alterna qual <section class="feed"> fica visível, com base no índice
 * da seção dentro da lista de elementos ".feed" (0 = Posts, 1 = Usuários, 2 = Tarefas).
 * A visibilidade é controlada pela classe CSS "ativo" (ver style.css: .feed / .feed.ativo).
 * Chamada diretamente pelos botões no HTML via onclick="AlterarPagina(n)".
 * @param {number} TrocaPagina - índice da seção que deve ficar visível
 */
function AlterarPagina(TrocaPagina) {
  const seccao = document.querySelectorAll(".feed");

  seccao.forEach((seccao, i) => {
    seccao.classList.toggle("ativo", i === TrocaPagina);
  });
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Dispara o carregamento assim que o script é executado
carregarDados();