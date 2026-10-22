export function VitrineProdutos({ produtos }: { produtos: { nome: string }[] }) {
  return (
    <ul>
      {produtos.map((p) => (
        <li key={p.nome}>{p.nome}</li>
      ))}
    </ul>
  );
}
