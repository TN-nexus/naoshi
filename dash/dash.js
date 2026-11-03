// てみぷろ 親ページの UI（apps/dash/schema.md §8・§9）。公開 Pages に置く。データは私用デプロイの殻から渡る。
// 殻（GAS Dash.html／ローカル dash/index.html）が window.renderParent(jsonString) か window.renderError(err) を呼ぶ。
// 読むだけ。依存なし。
(function () {
  "use strict";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = iso => { const m = /^\d{4}-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${+m[1]}/${+m[2]}` : esc(iso); };
  const SUBJ = { "算数": "算", "国語": "国", "理科": "理", "社会": "社", "計算": "計", "漢字": "漢" };
  const short = s => SUBJ[s] || s;
  const scol = s => { const k = short(s); return ["算", "国", "理", "社", "計", "漢"].includes(k) ? `var(--s-${k})` : "var(--s-計)"; };
  const subjChip = s => s ? `<span class="dz-subj" style="background:${scol(s)}" title="${esc(s)}">${esc(short(s)).slice(0, 1)}</span>` : "";
  const TABS = [["kyou", "きょう"], ["seiseki", "成績"], ["issue", "イシュー"], ["kyozai", "教材"], ["tashika", "手を確かめる"]];
  let D = null, TAB = (location.hash || "").replace("#", "") || "kyou";
  const $ = () => document.getElementById("app");

  // 表: cols = [[見出し, 値を返す関数(row), クラス]]
  function table(rows, cols, rowCls) {
    if (!rows || !rows.length) return `<p class="dz-empty">なし</p>`;
    return `<div class="dz-tbl"><table class="dads-u-dns-16N-130"><thead><tr>${cols.map(c => `<th class="${c[2] || ""}">${esc(c[0])}</th>`).join("")}</tr></thead><tbody>`
      + rows.map(r => `<tr class="${rowCls ? rowCls(r) : ""}">${cols.map(c => `<td class="${c[2] || ""}">${c[1](r)}</td>`).join("")}</tr>`).join("")
      + `</tbody></table></div>`;
  }
  const card = (title, inner) => `<section class="dz-card">${title ? `<h2 class="dz-h">${esc(title)}</h2>` : ""}${inner}</section>`;
  const btn = (url, label, type) => url ? `<a class="dads-button" data-type="${type || "outline"}" data-size="sm" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>` : "";
  const DISC_ICON = `<svg class="dads-disclosure__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentcolor"/><circle class="dads-disclosure__icon-circle" cx="12" cy="12" r="8" fill="currentcolor"/><path class="dads-disclosure__icon-triangle" d="M17 10H7L12 15L17 10Z" fill="Canvas"/></svg>`;

  // ---------------------------------------------------------------- きょう
  function planItems(items) {
    return `<ul class="dz-plan">${(items || []).map(it => {
      const fixed = it.mark === "固定";
      const st = it.done === "済" ? "☑" : it.done === "途中" ? "◐" : (fixed ? "" : "☐");
      const tag = it.mark && !fixed ? `<span class="dz-tag${it.mark === "必ず" ? " must" : ""}">${esc(it.mark)}</span>` : "";
      const ev = [it.word ? `→ ${esc(it.word)}` : "", it.evidence ? `証拠 ${esc(it.evidence)}` : (fixed ? "" : "証拠なし")].filter(Boolean).join("　");
      return `<li class="${fixed ? "fixed" : ""}"><span class="st${it.done === "済" ? " ok" : ""}">${st}</span><span class="tm">${esc(it.time || it.slot || "")}</span>`
        + `<span>${esc(it.text)}${tag}</span>${ev ? `<span class="ev">${ev}</span>` : ""}</li>`;
    }).join("")}</ul>`;
  }
  function planDays() {
    const days = ((D.plan || {}).days) || [];
    if (!days.length) return `<p class="dz-empty">日割りなし</p>`;
    return days.map(d => {
      const its = d.items || [];
      const cnt = its.filter(i => i.mark !== "固定");
      const nDone = cnt.filter(i => i.done === "済").length;
      const head = `${md(d.date)}（${esc(d.wd)}）<span class="dz-small" style="font-weight:400;margin-left:8px">済 ${nDone}／${cnt.length}</span>`;
      return `<details class="dads-disclosure"${d.date === D.today ? " open" : ""}><summary class="dads-disclosure__summary">${DISC_ICON}<span>${head}${d.date === D.today ? "　きょう" : ""}</span></summary>`
        + `<div class="dads-disclosure__content">${planItems(its)}</div></details>`;
    }).join("");
  }
  function workerLine() {
    const w = D.worker || {};
    const pend = w.pending == null ? "relay に届かない" : `未処理 ${esc(w.pending)}`;
    return `<div class="dz-state"><span><span class="dz-dot ${w.alive ? "ok" : "ng"}"></span>worker ${w.alive ? "動いている" : "止まっている"}</span>`
      + `<span class="dz-small">最終 ${esc(w.last_log || "—")}</span><span class="dz-small">${pend}</span></div>`
      + ((w.errors || []).length ? `<ul class="dz-errs">${w.errors.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : "");
  }
  function bars(rows) {
    if (!rows || !rows.length) return `<p class="dz-empty">なし</p>`;
    return rows.map(r => {
      const pct = r.total ? Math.min(100, Math.round(100 * r.done / r.total)) : 0;
      return `<div class="dz-bar"><span>${esc(r.label || r.title)}</span><span class="b" role="img" aria-label="${esc(r.done)}／${esc(r.total)}"><i style="width:${pct}%"></i></span>`
        + `<span class="n">${esc(r.done)}／${esc(r.total)}　<span class="dz-muted">${esc(r.last || "")}</span></span></div>`;
    }).join("");
  }
  function tabKyou() {
    const n = D.nendai || {};
    return card("worker", workerLine())
      + card("日割りと実行", planDays())
      + `<div class="dz-grid">`
      + card("LINE 提出（直近3日）", table(D.submits, [
          ["時刻", r => esc(r.time)], ["教科", r => esc(r.subject)], ["直し", r => esc(r.naoshi)],
          ["結果", r => esc(r.result), "wrap"], ["戻り", r => r.took_min == null ? "" : `${esc(r.took_min)}分`, "num"],
          ["寸評", r => esc(r.pdf)]], r => r.fail ? "fail" : ""))
      + card("未了の直し", table(D.naoshi_open, [
          ["題", r => esc(r.title), "wrap"], ["日", r => esc(r.date)], ["直した", r => `${esc(r.fixed)}／${esc(r.ng)}`, "num"],
          ["触った", r => esc(r.touched), "num"], ["s", r => `<span class="dz-small">${esc(r.s8)}</span>`]]))
      + card("周回", bars(D.te_lap))
      + card("ねんだい・塾", `<p style="margin:0 0 8px">ねんだい きょう <b>${esc(n.today ?? 0)}</b> 回答</p>`
          + table(D.juku, [["日", r => esc(r.date)], ["予定", r => esc(r.what), "wrap"], ["メモ", r => esc(r.memo)]]))
      + `</div>`;
  }

  // ---------------------------------------------------------------- 成績
  let Y0 = 40, Y1 = 70;
  const REF = 58;
  function setDomain(by) {   // 既定 40〜70。外れる値があれば全教科そろえて 10 刻みで広げる（はみ出しを丸めない）
    const v = Object.values(by).flat().map(r => r.dev).filter(x => typeof x === "number");
    Y0 = Math.min(40, Math.floor(Math.min(...v, 40) / 10) * 10);
    Y1 = Math.max(70, Math.ceil(Math.max(...v, 70) / 10) * 10);
  }
  function lineChart(subject, rows) {
    // small multiple: 1教科1本（凡例は見出しが兼ねる）。x はテストの順（等間隔）、y は 40〜70 共通、58 に点線
    const W = 300, H = 150, L = 28, R = 34, T = 10, B = 22;
    const pts = (rows || []).filter(r => typeof r.dev === "number").sort((a, b) => (a.date < b.date ? -1 : 1));
    const xs = i => pts.length <= 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (pts.length - 1);
    const ys = v => T + (H - T - B) * (1 - (Math.max(Y0, Math.min(Y1, v)) - Y0) / (Y1 - Y0));
    const col = scol(subject);
    let g = "";
    for (let v = Y0; v <= Y1; v += 10) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}"/><text class="ax" x="${L - 4}" y="${ys(v) + 4}" text-anchor="end">${v}</text>`;
    g += `<line class="ref" x1="${L}" x2="${W - R}" y1="${ys(REF)}" y2="${ys(REF)}"/><text class="ax" x="${W - R + 4}" y="${ys(REF) + 4}">58</text>`;
    // x の目盛りは最初と最後だけ（テストが多いと重なる。間はツールチップと表で読む）
    pts.forEach((p, i) => { if (i === 0 || i === pts.length - 1) g += `<text class="ax" x="${xs(i)}" y="${H - 6}" text-anchor="${pts.length > 1 ? (i === 0 ? "start" : "end") : "middle"}">${md(p.date)}</text>`; });
    if (pts.length > 1) g += `<polyline fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pts.map((p, i) => `${xs(i)},${ys(p.dev)}`).join(" ")}"/>`;
    // 点は 12 回までは全部、それより多いと最後だけ（線が点で埋まる）
    pts.forEach((p, i) => { if (pts.length <= 12 || i === pts.length - 1) g += `<circle cx="${xs(i)}" cy="${ys(p.dev)}" r="4" fill="${col}" stroke="#fff" stroke-width="2"/>`; });
    if (pts.length) {   // 最後の値だけ直接ラベル。58 の点線のすぐ下なら点の下に置く（右端の「58」と重ねない）
      const i = pts.length - 1, y = ys(pts[i].dev), below = pts[i].dev < REF && y - ys(REF) < 22;
      g += `<text class="lbl" x="${xs(i)}" y="${below ? y + 17 : y - 9}" text-anchor="middle">${esc(pts[i].dev)}</text>`;
    }
    pts.forEach((p, i) => { g += `<circle class="hit" cx="${xs(i)}" cy="${ys(p.dev)}" r="14" data-tip="${esc(`${p.test}　${md(p.date)}\n偏差値 ${p.dev}　得点 ${p.score ?? "—"}（平均 ${p.avg ?? "—"}）`)}"/>`; });
    return `<div class="dz-chart"><h3><span class="sw" style="background:${col}"></span>${esc(subject)}</h3>`
      + `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(subject)}の偏差値の推移">${g}</svg><div class="dz-tip"></div></div>`;
  }
  function tabSeiseki() {
    const s = D.scores || {}, by = s.by_subject || {};
    const subs = ["算数", "国語", "理科", "社会"].filter(k => by[k]).concat(Object.keys(by).filter(k => !["算数", "国語", "理科", "社会"].includes(k)));
    const tests = (s.tests || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));   // 表は新しい順
    setDomain(by);
    const cell = (sub, t, k) => { const r = (by[sub] || []).find(x => x.test === t.name); return r && r[k] != null ? esc(r[k]) : ""; };
    const tcols = [["テスト", t => `${esc(t.name)}<br><span class="dz-small">${md(t.date)} ${esc(t.course || "")}</span>`]]
      .concat(subs.map(sub => [sub, t => { const d = cell(sub, t, "dev"), sc = cell(sub, t, "score"), av = cell(sub, t, "avg");
        return d || sc ? `<b>${d}</b><br><span class="dz-small">${sc}${av ? `／平均${av}` : ""}</span>` : ""; }, "num"]));
    return card(`偏差値の推移（${Y0}〜${Y1}・点線 58）`, subs.length ? `<div class="dz-charts">${subs.map(k => lineChart(k, by[k])).join("")}</div>` : `<p class="dz-empty">なし</p>`)
      + card("表（偏差値／得点・平均）", table(tests, tcols))
      + card("直近テストの取るべき×", table(s.latest_misses, [
          ["テスト", r => esc(r.test)], ["教科", r => esc(r.subject)], ["問", r => esc(r.no)],
          ["正答率", r => r.rate == null ? "" : `${esc(r.rate)}%`, "num"], ["", r => esc(r.should)], ["論点", r => esc(r.topic), "wrap"]]));
  }

  // ---------------------------------------------------------------- イシュー
  function tabIssue() {
    const is = D.issues || {}, sm = is.summary || {};
    const chips = Object.keys(sm).map(k => `<span class="dz-chip">${esc(k)}<b>${esc(sm[k])}</b></span>`).join("");
    return card("要約", `<div class="dz-chips">${chips || `<span class="dz-empty">なし</span>`}</div>`)
      + card("イシュー", table(is.rows, [
          ["状態", r => esc(r.status)], ["", r => subjChip(r.subject)], ["ID", r => esc(r.id)], ["原理", r => esc(r.what), "wide"],
          ["単元", r => esc(r.unit)], ["×の日", r => esc(r.days_x), "wrap"], ["更新", r => esc(r.updated)]]))
      + `<div class="dz-grid">`
      + card("崩れ（安定度）", table(is.kuzure, [
          ["ID", r => esc(r.id)], ["原理", r => esc(r.name), "wrap"], ["いま", r => esc(r.now)], ["崩れ", r => esc(r.kuzure), "num"], ["跡", r => esc(r.trail)]]))
      + card("入れた記録", table(is.ireta, [["日", r => esc(r.date)], ["ID", r => esc(r.id)], ["どうやって", r => esc(r.how), "wrap"]]))
      + `</div>`;
  }

  // ---------------------------------------------------------------- 教材
  function kobetsubaGrid(rows) {
    if (!rows || !rows.length) return `<p class="dz-empty">なし</p>`;
    const rounds = [...new Set(rows.map(r => r.round))].sort();
    const order = ["算数", "国語", "理科", "社会"];
    const subs = [...new Set(rows.map(r => r.subject))].sort((a, b) => (order.indexOf(a) + 99 * (order.indexOf(a) < 0)) - (order.indexOf(b) + 99 * (order.indexOf(b) < 0)));
    const n = (rd, sb) => (rows.find(r => r.round === rd && r.subject === sb) || {}).n || 0;
    return `<div class="dz-tbl dz-kgrid"><table class="dads-u-dns-16N-130"><thead><tr><th>回</th>${subs.map(s => `<th class="num">${esc(s)}</th>`).join("")}</tr></thead><tbody>`
      + rounds.map(rd => `<tr><td>${esc(rd)}</td>${subs.map(s => { const v = n(rd, s); return `<td class="num${v ? "" : " z"}">${v || "·"}</td>`; }).join("")}</tr>`).join("")
      + `</tbody></table></div>`;
  }
  function tabKyozai() {
    const m = D.materials || {};
    return card("52 設問白紙（直近14日）", table(m.recent52, [
        ["ファイル", r => esc(r.file), "wrap"], ["日", r => md(r.date)], ["教科", r => esc(r.subject)],
        ["戻り", r => r.returned ? esc(r.returned) : `<span class="dz-muted">—</span>`]]))
      + `<div class="dz-grid">`
      + card("コベツバ（回×教科の本数）", kobetsubaGrid(m.kobetsuba))
      + card("教材の欠け", table(m.missing, [["教科", r => esc(r.subject)], ["何", r => esc(r.what), "wrap"], ["次", r => esc(r.next), "wrap"]]))
      + `</div>`;
  }

  // ---------------------------------------------------------------- 手を確かめる
  const two = r => `<div class="dz-btns">${btn(r.url, "ひらく")}${btn(r.try_url, "試す（記録しない）", "solid-fill")}</div>`;
  function tabTashika() {
    const s = D.sessions || {}, nd = s.nendai || {};
    return card("手の器", table(s.te, [
        ["題", r => `${esc(r.label || r.title)}<br><span class="dz-small">${esc(r.title)}</span>`, "wrap"],
        ["put", r => esc(r.put)], ["送った", r => r.sent ? esc(r.sent) : `<span class="dz-muted">未送信</span>`],
        ["実施", r => `${esc(r.done)}／${esc(r.total)}`, "num"], ["最終", r => esc(r.last)], ["", two]]))
      + card("直しページ", table(s.naoshi, [
        ["題", r => esc(r.title), "wrap"], ["日", r => esc(r.date)], ["送った", r => r.sent ? esc(r.sent) : `<span class="dz-muted">未送信</span>`],
        ["直した", r => `${esc(r.fixed)}／${esc(r.ng)}`, "num"], ["", two]]))
      + card("ねんだい", nd.url || nd.try_url ? two(nd) : `<p class="dz-empty">なし</p>`)
      + card("開発中（put 前）をローカルで", D.preview_cmd
          ? `<div class="dz-code"><code id="dz-cmd">${esc(D.preview_cmd)}</code><button type="button" class="dads-button" data-type="outline" data-size="sm" data-copy="dz-cmd">コピー</button></div>`
          : `<p class="dz-empty">なし</p>`);
  }

  // ---------------------------------------------------------------- 骨格
  function render() {
    if (!TABS.some(t => t[0] === TAB)) TAB = "kyou";
    const body = { kyou: tabKyou, seiseki: tabSeiseki, issue: tabIssue, kyozai: tabKyozai, tashika: tabTashika }[TAB]();
    $().innerHTML = `<div class="dz-head"><h1>てみぷろ</h1><span class="dz-small">${md(D.today)}　更新 ${esc((D.updated || "").replace("T", " "))}</span></div>`
      + `<nav aria-label="ページ内の切り替え"><ul class="dads-menu-list dz-tabs">${TABS.map(([k, l]) =>
          `<li><button type="button" class="dads-menu-list__item" data-type="standard" data-size="regular" data-tab="${k}"${k === TAB ? ` data-current aria-current="page"` : ""}>${l}</button></li>`).join("")}</ul></nav>`
      + body;
  }
  function onClick(e) {
    const t = e.target.closest("[data-tab]");
    if (t) { TAB = t.dataset.tab; try { history.replaceState(null, "", "#" + TAB); } catch (_) {} render(); return; }
    const c = e.target.closest("[data-copy]");
    if (c) {
      const txt = (document.getElementById(c.dataset.copy) || {}).textContent || "";
      const done = () => { c.textContent = "コピーした"; setTimeout(() => { c.textContent = "コピー"; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => selectCode(c.dataset.copy));
      else selectCode(c.dataset.copy);
    }
  }
  function selectCode(id) { const el = document.getElementById(id); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  function onMove(e) {
    const tipOf = el => el && el.closest(".dz-chart") && el.closest(".dz-chart").querySelector(".dz-tip");
    const h = e.target.closest && e.target.closest(".hit");
    document.querySelectorAll(".dz-tip").forEach(t => { if (!h || t !== tipOf(h)) t.style.display = "none"; });
    if (!h) return;
    const box = h.closest(".dz-chart"), tip = tipOf(h), br = box.getBoundingClientRect(), cr = h.getBoundingClientRect();
    tip.textContent = h.getAttribute("data-tip"); tip.style.whiteSpace = "pre"; tip.style.display = "block";
    let x = cr.left + cr.width / 2 - br.left - tip.offsetWidth / 2;
    x = Math.max(0, Math.min(br.width - tip.offsetWidth, x));
    tip.style.left = x + "px"; tip.style.top = (cr.top - br.top - tip.offsetHeight - 2) + "px";
  }

  window.renderParent = function (json) {
    const el = $();
    if (json === "" || json == null) { el.innerHTML = `<p class="dz-err">このページは持ち主だけが見られます</p>`; return; }   // 殻は持ち主でなければ '' を渡す
    try {
      D = typeof json === "string" ? (json ? JSON.parse(json) : null) : json;
      if (!D || typeof D !== "object") throw new Error("空（ログインしているアカウントが違うか、まだ put されていない）");
    } catch (err) { window.renderError(err); return; }
    if (!el.dataset.bound) { el.addEventListener("click", onClick); el.addEventListener("pointermove", onMove); el.addEventListener("pointerdown", onMove); el.dataset.bound = "1"; }
    render();
  };
  window.renderError = function (err) {
    $().innerHTML = `<p class="dz-err">読めなかった: ${esc((err && err.message) || err || "")}</p>`;
  };
})();
