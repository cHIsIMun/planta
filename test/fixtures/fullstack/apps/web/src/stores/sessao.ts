import { create } from 'zustand';

export const useSessao = create<{ usuario?: string }>()(() => ({}));
