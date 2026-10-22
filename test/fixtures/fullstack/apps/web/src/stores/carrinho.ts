import { create } from 'zustand';

interface Carrinho {
  itens: string[];
  adicionar: (slug: string) => void;
}

export const useCarrinho = create<Carrinho>()((set) => ({
  itens: [],
  adicionar: (slug) => set((s) => ({ itens: [...s.itens, slug] })),
}));
