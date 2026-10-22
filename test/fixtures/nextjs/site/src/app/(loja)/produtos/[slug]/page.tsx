export default async function DetalheProduto({ params }: { params: { slug: string } }) {
  const resposta = await fetch(`/api/produtos/${params.slug}`);
  const produto = await resposta.json();
  return <h1>{produto.nome}</h1>;
}
