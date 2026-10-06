import { NextResponse } from "next/server";

/** Enlaces anteriores (/p/<token>): llevan a la nota del pedido en /pedido/<token> */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return new NextResponse("Este enlace no es válido", { status: 404 });
  return NextResponse.redirect(new URL(`/pedido/${token}`, request.url), 307);
}
