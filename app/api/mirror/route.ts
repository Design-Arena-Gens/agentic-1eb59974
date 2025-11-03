import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getBroker } from "@/lib/broker";
import { requireApiKey } from "@/lib/security";
import type { TradePayload } from "@/lib/types";

export async function POST(req: Request) {
  try { requireApiKey(req.headers); } catch (e: any) { return new NextResponse(e.message, { status: e.status || 401 }); }
  const body = (await req.json()) as TradePayload;

  const trade = store.addTrade("manual", body);
  const id = trade.id;

  if (!store.getEnabled()) {
    store.updateTrade(id, (t) => {
      t.status = "queued";
      t.log.push(`[${new Date().toISOString()}] mirroring disabled, queued only`);
    });
    return NextResponse.json({ ok: true, id, status: "queued" });
  }

  const broker = getBroker();
  const res = await broker.placeOrder(body);

  store.updateTrade(id, (t) => {
    if (res.ok) {
      t.status = "mirrored";
      t.log.push(`[${new Date().toISOString()}] mirrored successfully`);
    } else {
      t.status = "failed";
      t.log.push(`[${new Date().toISOString()}] mirror failed: ${res.message ?? "unknown"}`);
    }
  });

  return NextResponse.json({ ok: res.ok, id, message: res.message });
}
