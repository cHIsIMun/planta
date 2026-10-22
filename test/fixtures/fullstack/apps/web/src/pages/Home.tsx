import { useDestaques } from '../api/catalogo';
import { VitrineProdutos } from '../components/VitrineProdutos';

export function Home() {
  const { data } = useDestaques();
  return (
    <main>
      <VitrineProdutos produtos={data ?? []} />
    </main>
  );
}
