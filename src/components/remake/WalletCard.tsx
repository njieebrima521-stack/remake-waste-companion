import { Link } from "@tanstack/react-router";
import { Gift, Hourglass } from "lucide-react";

import { coins } from "@/lib/remake/format";
import { walletSummary } from "@/lib/remake/logic";
import { useApp } from "@/lib/remake/store";

import { CoinIcon } from "./CoinIcon";

export function WalletCard() {
  const tx = useApp((s) => s.transactions);
  const name = useApp((s) => s.user.name);
  const w = walletSummary(tx);
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-ink p-5 text-ink-foreground shadow-float">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/15" />
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <CoinIcon className="size-4 text-[8px]" /> Green Coins
          </p>
          <p className="mt-1 font-display text-[40px] font-bold leading-none tabular-nums">
            {coins(w.available)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
            <Hourglass className="size-3.5" /> {coins(w.pending)} pending verification
          </p>
        </div>
        <Gift className="size-14 text-primary" strokeWidth={1.6} />
      </div>
      <p className="mt-4 text-sm tracking-widest text-ink-muted">
        {name.split(" ")[0]?.slice(0, 3)}••••••
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/rewards"
          className="grid h-12 place-items-center rounded-full bg-primary font-semibold text-primary-foreground active:scale-[0.97]"
        >
          Redeem coins
        </Link>
        <Link
          to="/wallet"
          className="grid h-12 place-items-center rounded-full border border-ink-muted/50 font-semibold active:scale-[0.97]"
        >
          History
        </Link>
      </div>
    </div>
  );
}
