import { cadastrarCliente } from '../api/vendas';

export function FormCliente() {
  return <form onSubmit={() => cadastrarCliente({ email: '', nome: '' })} />;
}
