export default async function OrderDetailsPage({ params }) {
  const { productId, orderId } = await params;
  return (
    <div>
      <h1>Order Details - {productId} / {orderId}</h1>
    </div>
  );
}
