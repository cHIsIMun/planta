import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export function useDestaques() {
  return useQuery({ queryKey: ['destaques'], queryFn: () => api.get('/produtos/destaques').then((r) => r.data) });
}

export async function buscarProduto(slug: string) {
  const resposta = await api.get(`/produtos/${slug}`);
  return resposta.data;
}
