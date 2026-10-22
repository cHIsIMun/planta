export class CriarCestaDto {
  clienteEmail: string;
  itens: { produtoId: string; kg: number }[];
}
