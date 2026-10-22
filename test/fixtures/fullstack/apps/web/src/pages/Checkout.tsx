import { finalizarCompra } from '../api/vendas';
import { FormEndereco } from '../components/checkout/FormEndereco';
import { FormPagamento } from '../components/checkout/FormPagamento';
import { useCarrinho } from '../stores/carrinho';
import { useSessao } from '../stores/sessao';

export function Checkout() {
  const itens = useCarrinho((s) => s.itens);
  const usuario = useSessao((s) => s.usuario);
  return (
    <form onSubmit={() => finalizarCompra(itens)}>
      <p>{usuario}</p>
      <FormEndereco />
      <FormPagamento />
    </form>
  );
}
