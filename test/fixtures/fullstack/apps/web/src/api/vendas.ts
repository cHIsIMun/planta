import { api } from './client';

export async function cadastrarCliente(dados: { email: string; nome: string }) {
  const resposta = await fetch('/api/v1/clientes', { method: 'POST', body: JSON.stringify(dados) });
  return resposta.json();
}

export async function finalizarCompra(itens: string[]) {
  return (await api.post('/pedidos', { itens })).data;
}
