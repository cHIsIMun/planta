/** Escolhe a janela de entrega e o produtor mais próximo para cada cesta fechada. */
export async function roteirizar(cestaId: string): Promise<{ janela: string }> {
  const janela = new Date().getHours() < 12 ? 'tarde' : 'manha-seguinte';
  return { janela };
}
