import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { buscarProduto } from '../api/catalogo';
import { useCarrinho } from '../stores/carrinho';

export function DetalheProduto() {
  const { slug } = useParams();
  const [produto, setProduto] = useState<{ nome: string } | null>(null);
  const adicionar = useCarrinho((s) => s.adicionar);
  useEffect(() => {
    buscarProduto(slug!).then(setProduto);
  }, [slug]);
  return <button onClick={() => adicionar(slug!)}>{produto?.nome}</button>;
}
