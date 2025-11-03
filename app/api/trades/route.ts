import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireApiKey } from "@/lib/security";

export async function GET(req: Request) {
  try { requireApiKey(req.headers); } catch (e: any) { return new NextResponse(e.message, { status: e.status || 401 }); }
  return NextResponse.json({ enabled: store.getEnabled(), trades: store.listTrades() });
}
