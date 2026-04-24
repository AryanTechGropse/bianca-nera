export default async function ProductAllPage({ params }) {
  const { name } = await params;
  return (
    <div>
      <h1>All Products - {name}</h1>
    </div>
  );
}
