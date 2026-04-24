export default async function ProductTryOnPage({ params }) {
  const { id } = await params;
  return (
    <div>
      <h1>Product Try On - {id}</h1>
    </div>
  );
}
