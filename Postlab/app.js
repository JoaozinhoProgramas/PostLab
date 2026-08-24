const API_BASE = "https://jsonplaceholder.typicode.com"; 
const elementos = { 
listaPosts: document.querySelector("#lista-posts"), 
estadoInterface: document.querySelector("#estado-interface"), 
contadorPosts: document.querySelector("#contador-posts"), 
campoBusca: document.querySelector("#campo-busca"), 
filtroUsuario: document.querySelector("#filtro-usuario"), 
}; 
const estado = { 
posts: [], 
usuarios: [], 
termoBusca: "", 
usuarioId: "", 
}; 
