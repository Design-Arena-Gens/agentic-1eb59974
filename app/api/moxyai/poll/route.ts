import { NextResponse } from "next/server";
import { pollMoxyAIAndEnqueue } from "@/lib/moxyai";
import { store } from "@/lib/store";
import { getBroker } from "@/lib/broker";
import { requireApiKey } from "@/lib/security";

export async function GET(req: Request) {
  try { requireApiKey(req.headers); } catch (e: any) { return new NextResponse(e.message, { status: e.status || 401 }); }
  return handlePoll();
}

export async function POST(req: Request) {
  try { requireApiKey(req.headers); } catch (e: any) { return new NextResponse(e.message, { status: e.status || 401 }); }
  return handlePoll();
}

async function handlePoll() {
  const ids = await pollMoxyAIAndEnqueue();
  const broker = getBroker();
  const mirrored: string[] = [];
  const failed: string[] = [];

  for (const id of ids) {
    const trade = store.listTrades().find(t => t.id === id);
    if (!trade) continue;
    if (!store.getEnabled()) {
      store.updateTrade(id, (t) => t.log.push(`[${new Date().toISOString()}] mirroring disabled, queued`));
      continue;
    }
    const { id: _id, source, createdAt, status, log, ...payload } = trade;

    // simple retry: up to 2 times
    let attempt = 0; let ok = false; let message = "";
    while (attempt < 2 && !ok) {
      attempt++;
      const res = await broker.placeOrder(payload);
      ok = res.ok; message = res.message ?? "";
      if (!ok) await new Promise(r => setTimeout(r, 250 * attempt));
    }

    store.updateTrade(id, (t) => {
      if (ok) {
        t.status = "mirrored";
        t.log.push(`[${new Date().toISOString()}] mirrored after ${attempt} attempt(s)`);
      } else {
        t.status = "failed";
        t.log.push(`[${new Date().toISOString()}] mirror failed after retries: ${message}`);
      }
    });

    if (ok) mirrored.push(id); else failed.push(id);
  }

  return NextResponse.json({ detected: ids.length, mirrored, failed });
}
