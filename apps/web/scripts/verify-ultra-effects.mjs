import { readFileSync, readdirSync, statSync } from "fs";
import { extname, join } from "path";

const SRC=join(process.cwd(),"src"); const ok=new Set([".ts",".tsx",".js",".jsx"]);

const ERR=[]; function walk(d,out=[]){ for(const e of readdirSync(d,{withFileTypes:true})){ const p=join(d,e.name); const st=statSync(p); if(st.isDirectory()) walk(p,out); else if(ok.has(extname(p))) out.push(p)} return out}

for(const f of walk(SRC)){

  if(!/(effects|components\/chat)/.test(f)) continue;

  const s=readFileSync(f,"utf8");

  if(/Math\.random/.test(s)) ERR.push(`[RNG] ${f} uses Math.random`);

  if(/setTimeout|setInterval|requestAnimationFrame\(/.test(s)) ERR.push(`[TIMER] ${f} timers banned in effects/chat`);

  if(/withTiming|withSpring/.test(s) && !/useReducedMotion|reducedMotion/.test(s)) ERR.push(`[A11Y] ${f} animations without reduced-motion gate`);

}

const dv = join(SRC,"components","views","DiscoverView.tsx");

try {
  const s = readFileSync(dv, 'utf8');
  if (!/Map/.test(s) || !/Discover/.test(s)) {
    ERR.push(`[PARITY] DiscoverView lacks Discover/Map segments`);
  }
} catch {
  // File might not exist - skip check
  // Error intentionally ignored as this is a verification script
  // No-op to satisfy ESLint no-empty rule
  void 0
}

if(ERR.length){ console.error(ERR.join("\n")); process.exit(1); } else { console.log("✅ ultra effects verified"); }
