import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js/dist/esm/chess.js"; // vite-friendly

// --- piece palette (unicode labels only for tooltips) ---
const WHITE = ["K", "Q", "R", "B", "N", "P"];
const BLACK = ["k", "q", "r", "b", "n", "p"];

const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = [8,7,6,5,4,3,2,1];

// ---------- helpers: fen <-> board map ----------
function buildFen({ pieces, side, castling, ep }) {
  // pieces: { "e4": "K" | "p" ... }
  const board = Array(64).fill(".");
  for (const [pos, piece] of Object.entries(pieces)) {
    const file = pos.charCodeAt(0) - 97; // 0..7
    const rank = parseInt(pos[1], 10);   // 1..8
    const idx = (8 - rank) * 8 + file;   // a8..h1
    board[idx] = piece;
  }

  // ranks -> fen rows
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let row = "";
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const v = board[r*8 + c];
      if (v === ".") empty++;
      else { if (empty) { row += empty; empty = 0; } row += v; }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  const legal = inferCastlingRights(board);
  const castlingChosen = sanitizeOrInferCastling(legal, castling);
  const epSq = ep && /^[a-h][36]$/.test(ep) ? ep : "-";
  return `${rows.join("/") } ${side} ${castlingChosen} ${epSq} 0 1`;
}

function parseFenToState(fen) {
  // returns { pieces, side, castling, ep }
  const [placement, side="w", castle="-", ep="-"] = fen.trim().split(/\s+/);
  const rows = placement.split("/");
  const pieces = {};
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) c += parseInt(ch,10);
      else {
        const file = FILES[c];
        const rank = 8 - r;
        pieces[`${file}${rank}`] = ch;
        c += 1;
      }
    }
  }
  const cs = { K:false,Q:false,k:false,q:false };
  for (const k of ["K","Q","k","q"]) if (castle.includes(k)) cs[k] = true;
  return { pieces, side, castling: cs, ep: ep === "-" ? "" : ep };
}

function inferCastlingRights(board64 /* '.' or piece, a8..h1*/){
  const at = (f,r) => board64[r*8 + f];
  const rights = [];
  // white
  const wk  = at(4,7)==="K"; // e1
  const wra = at(0,7)==="R"; // a1
  const wrh = at(7,7)==="R"; // h1
  if (wk && wrh) rights.push("K");
  if (wk && wra) rights.push("Q");
  // black
  const bk  = at(4,0)==="k"; // e8
  const bra = at(0,0)==="r"; // a8
  const brh = at(7,0)==="r"; // h8
  if (bk && brh) rights.push("k");
  if (bk && bra) rights.push("q");
  return rights.length ? rights.join("") : "-";
}
function sanitizeOrInferCastling(legal, chosen){
  if (!chosen) return legal;
  const any = Object.values(chosen).some(Boolean);
  if (!any) return legal;
  if (legal === "-") return "-";
  const keep = ["K","Q","k","q"].filter(k => chosen[k] && legal.includes(k)).join("");
  return keep || "-";
}
function validateFen(fen){
  try { new Chess(fen); return {valid:true}; }
  catch(e){ return {valid:false, reason:e?.message || "Invalid FEN"}; }
}

// ---------- main editor ----------
/**
 * Props:
 *  - initialFen?: string   (optional; default = startpos)
 *  - onDone({fen, pieces, side, castling, ep}): void
 *  - onCancel(): void
 */
export default function BoardEditor({ initialFen, onDone, onCancel }) {
  // init
  const startFen = initialFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const seed = parseFenToState(startFen);

  const [pieces, setPieces] = useState(seed.pieces);
  const [side, setSide] = useState(seed.side);
  const [castling, setCastling] = useState(seed.castling);
  const [ep, setEp] = useState(seed.ep);
  const [flipped, setFlipped] = useState(false);

  const [dragPiece, setDragPiece] = useState(null);   // 'K','p',...
  const [dragFrom, setDragFrom] = useState(null);     // 'e2'
  const dragImg = useRef(null);

  // computed fen + validity
  const fen = useMemo(() => buildFen({ pieces, side, castling, ep }), [pieces, side, castling, ep]);
  const fenStatus = useMemo(() => validateFen(fen), [fen]);

  // --- actions ---
  function clearBoard(){
    setPieces({});
    setCastling({K:false,Q:false,k:false,q:false});
    setEp("");
  }
  function fillStart(){
    const s = parseFenToState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    setPieces(s.pieces); setSide("w"); setCastling(s.castling); setEp("");
  }
  function flipBoard(){ setFlipped(f => !f); }
  function rotateBoard(){ setFlipped(f => !f); } // 180° same as flip here

  function placePiece(square, piece){ setPieces(prev => ({...prev, [square]: piece})); }
  function removePiece(square){ setPieces(prev => { const n={...prev}; delete n[square]; return n; }); }
  function movePiece(from, to){
    setPieces(prev => {
      const n = {...prev};
      const p = n[from];
      delete n[from];
      n[to] = p;
      return n;
    });
  }

  // drag handlers (free placement, not legality-checked)
  function onDragStart(e, square){
    const p = pieces[square];
    if (!p) return;
    setDragPiece(p); setDragFrom(square);
    // nicer ghost image
    const img = new Image(); img.src = pieceSprite(p);
    dragImg.current = img;
    e.dataTransfer.setDragImage(img, 24, 24);
  }
  function onDropSquare(e, square){
    e.preventDefault();
    if (!dragPiece) return;
    if (e.shiftKey) { // copy-piece
      placePiece(square, dragPiece);
    } else {
      // move or replace
      movePiece(dragFrom, square);
    }
    setDragPiece(null); setDragFrom(null);
  }
  function onDragOver(e){ e.preventDefault(); }

  // palette click (click to place; right-click to remove on board)
  function onSquareClick(square, e){
    if (e && e.type === "contextmenu") {
      e.preventDefault(); removePiece(square); return;
    }
    // place currently selected from palette? We use last-clicked palette via dragPiece==="_PALETTE_" trick
  }

  // simple sprite (SVG data-URI) so it works without assets
  function pieceSprite(p){
    // minimal unicode glyph as fallback “icon”
    const glyph = {
      K:"♔", Q:"♕", R:"♖", B:"♗", N:"♘", P:"♙",
      k:"♚", q:"♛", r:"♜", b:"♝", n:"♞", p:"♟"
    }[p] || "?";
    const fg = p === p.toUpperCase() ? "#fff" : "#111";
    const bg = p === p.toUpperCase() ? "#111" : "#fff";
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>
         <rect width='100%' height='100%' rx='8' ry='8' fill='${bg}'/>
         <text x='50%' y='56%' text-anchor='middle' font-size='34' font-family='Segoe UI Symbol' fill='${fg}'>${glyph}</text>
       </svg>`
    );
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  }

  // flip-aware iterator
  const squaresRender = [];
  for (const rank of (flipped ? RANKS.slice().reverse() : RANKS)) {
    for (const file of (flipped ? FILES.slice().reverse() : FILES)) {
      squaresRender.push(`${file}${rank}`);
    }
  }

  // FEN load dialog
  const [fenInput, setFenInput] = useState("");
  function loadFen() {
    const txt = fenInput.trim();
    const chk = validateFen(txt);
    if (!chk.valid) { alert(`Invalid FEN:\n${chk.reason}`); return; }
    const st = parseFenToState(txt);
    setPieces(st.pieces); setSide(st.side); setCastling(st.castling); setEp(st.ep);
  }

  // (optional) best move later: call your backend / web-worker
  async function requestBestMove() {
    // Example: if you expose /api/engine/bestmove?fen=
    // const r = await fetch(`/api/engine/bestmove?fen=${encodeURIComponent(fen)}`);
    // const j = await r.json(); alert(`Best move: ${j.move} (score ${j.score})`);
    alert("Hook up Stockfish later: send current FEN to your engine and display the returned best move.");
  }

  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      {/* Top actions like your reference screenshot */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 18 }}>Edit board</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ToolbarBtn onClick={flipBoard}>↻ Flip</ToolbarBtn>
          <ToolbarBtn onClick={rotateBoard}>⟳ Rotate</ToolbarBtn>
          <ToolbarBtn onClick={fillStart}>⟲ Reset</ToolbarBtn>
          <ToolbarBtn onClick={clearBoard}>✖ Clear</ToolbarBtn>
          <div style={{ display:"inline-flex", gap:8, alignItems:"center", padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff" }}>
            <span style={{ opacity:.75 }}>Castling</span>
            {["K","Q","k","q"].map(k => (
              <label key={k} style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                <input type="checkbox" checked={!!castling[k]} onChange={e => setCastling(prev=>({...prev,[k]:e.target.checked}))}/>
                {k}
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display:"flex", gap:8 }}>
          <ToolbarBtn onClick={() => navigator.clipboard.writeText(fen)}>📋 Copy FEN</ToolbarBtn>
          <ToolbarBtn onClick={requestBestMove}>🧠 Best move</ToolbarBtn>
          <ToolbarBtn onClick={() => onCancel?.()}>Cancel</ToolbarBtn>
          <ToolbarBtn
            onClick={() => onDone?.({ fen, pieces, side, castling, ep })}
            disabled={!fenStatus.valid}
            style={{ background:"#10b981", color:"#fff" }}
          >
            Done
          </ToolbarBtn>
        </div>
      </div>

      {/* Board + palettes */}
      <div style={{ display: "grid", gridTemplateColumns: "64px minmax(420px, 640px) 64px", gap: 10 }}>
        {/* left palette (white) */}
        <PieceStrip
          title="White"
          items={WHITE}
          onPick={(p) => { setDragPiece(p); setDragFrom("_PALETTE_"); }}
          pieceSprite={pieceSprite}
        />

        {/* board */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            overflow: "hidden",
            aspectRatio: "1/1",
            maxWidth: 640
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gridAutoRows: "1fr",
              width: "100%",
              height: "100%"
            }}
          >
            {squaresRender.map((sq) => {
              // color
              const file = sq.charCodeAt(0) - 97;
              const rankIdx = 8 - parseInt(sq[1],10);
              const isLight = (file + rankIdx) % 2 === 0;
              const bg = isLight ? "#f0d9b5" : "#b58863";
              const piece = pieces[sq];

              return (
                <div
                  key={sq}
                  onDragOver={onDragOver}
                  onDrop={(e)=>onDropSquare(e, sq)}
                  onClick={(e)=>onSquareClick(sq, e)}
                  onContextMenu={(e)=>onSquareClick(sq, e)}
                  style={{ position:"relative", background:bg, userSelect:"none" }}
                >
                  {/* coordinate labels (outer corners only) */}
                  {(sq[0]===(flipped?"h":"a") && sq[1]===(flipped?"1":"8")) && (
                    <div style={{
                      position:"absolute", top:2, left:4, fontSize:12, fontWeight:700,
                      color: isLight ? "#b58863" : "#f0d9b5", textShadow:"0 1px 1px rgba(0,0,0,.3)"
                    }}>
                      {flipped ? "h8" : "a8"}
                    </div>
                  )}

                  {/* piece */}
                  {piece && (
                    <img
                      draggable
                      onDragStart={(e)=>onDragStart(e, sq)}
                      src={pieceSprite(piece)}
                      alt={piece}
                      style={{ width:"100%", height:"100%", objectFit:"contain", padding:"8%" }}
                    />
                  )}

                  {/* if dragging from palette, click to place */}
                  {!piece && dragPiece && dragFrom==="_PALETTE_" && (
                    <button
                      onClick={()=>placePiece(sq, dragPiece)}
                      style={{
                        position:"absolute", inset:0, opacity:0, cursor:"copy",
                        border:"none", background:"transparent"
                      }}
                      title={`Place ${dragPiece} on ${sq}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* right palette (black) */}
        <PieceStrip
          title="Black"
          items={BLACK}
          onPick={(p) => { setDragPiece(p); setDragFrom("_PALETTE_"); }}
          pieceSprite={pieceSprite}
        />
      </div>

      {/* turn + ep + FEN load */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"inline-flex", gap:8, alignItems:"center", padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff" }}>
          <span style={{ opacity:.75 }}>Select turn</span>
          <label style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
            <input type="radio" name="turn" checked={side==="w"} onChange={()=>setSide("w")} /> ♘ White
          </label>
          <label style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
            <input type="radio" name="turn" checked={side==="b"} onChange={()=>setSide("b")} /> ♞ Black
          </label>
        </div>

        <div style={{ display:"inline-flex", gap:8, alignItems:"center", padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff" }}>
          <span style={{ opacity:.75 }}>EP</span>
          <input
            value={ep}
            onChange={(e)=>setEp(e.target.value.trim())}
            placeholder="e3 or empty"
            style={{ width:80 }}
          />
        </div>

        <div style={{ display:"grid", gap:6, flex:1, minWidth:280 }}>
          <div style={{
            fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            padding:8, border:"1px solid #e5e7eb", borderRadius:8,
            background: fenStatus.valid ? "rgba(16,185,129,.07)" : "rgba(239,68,68,.08)",
            color: fenStatus.valid ? "#065f46" : "#7f1d1d"
          }}>
            {fen}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <input
              value={fenInput}
              onChange={(e)=>setFenInput(e.target.value)}
              placeholder="Paste FEN to load..."
              style={{ flex:1 }}
            />
            <ToolbarBtn onClick={loadFen}>Load FEN</ToolbarBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- small presentational helpers ---
function ToolbarBtn({ children, disabled, onClick, style }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding:"8px 12px",
        border:"1px solid #e5e7eb",
        borderRadius:8,
        background:"#f8fafc",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style
      }}
    >
      {children}
    </button>
  );
}

function PieceStrip({ title, items, onPick, pieceSprite }) {
  return (
    <div style={{ display:"grid", gridTemplateRows:"repeat(8, 1fr)", gap:8, alignContent:"start" }}>
      {items.map((p, i) => (
        <button
          key={p}
          title={`${title} ${p.toUpperCase()}`}
          onClick={() => onPick(p)}
          draggable
          onDragStart={(e) => {
            const img = new Image(); img.src = pieceSprite(p);
            e.dataTransfer.setDragImage(img, 24, 24);
          }}
          style={{
            width:56, height:56, border:"1px solid #e5e7eb", borderRadius:10,
            background:"#fff", display:"grid", placeItems:"center"
          }}
        >
          <img alt={p} src={pieceSprite(p)} style={{ width:40, height:40 }} />
        </button>
      ))}
    </div>
  );
}
