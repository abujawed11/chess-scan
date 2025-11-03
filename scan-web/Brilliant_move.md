Excellent catch — the **“Brilliant” move** is a special case above even “Best” and requires extra context from engine analysis.
Here’s how chess.com and similar engines identify it conceptually, and how you can replicate it.

---

## 💎 What a “Brilliant Move” Actually Means

A *Brilliant* move is not just good — it’s **a rare, high-impact, engine-approved tactical or defensive resource** that either:

* **Saves a lost position**, or
* **Finds a deep, unexpected tactic** (often a sacrifice) that a shallow search wouldn’t find.

In chess.com’s system (as reverse-engineered by the community), a *Brilliant move* is detected when:

| Condition                     | Meaning                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tactical shock**            | The move gives up **material temporarily** (sacrifice) or seems anti-intuitive (like allowing a capture) but the deeper engine line shows it’s the **only or best** move to maintain equality or win. |
| **Depth-dependent discovery** | At low depth (e.g., 12–15), the move looks losing or dubious, but at deeper analysis (e.g., 25–30), the evaluation swings back to equality or advantage.                                              |
| **Uniqueness**                | There’s **only one move** that achieves the best evaluation; all others lose big (e.g., +0.1 vs -3.0 if any other move is played).                                                                    |
| **Evaluation jump**           | The move causes a **massive positive eval swing** (> +300 cp improvement for your side), *especially* if you were previously worse.                                                                   |
| **Aesthetic patterns**        | Optional filters: sacrifices leading to checkmate, quiet intermezzos, discovered defenses, or positional exchanges that reverse the eval dramatically.                                                |

---

## ⚙️ How to Detect It in Your App

To identify “Brilliant” moves realistically, you need **multi-depth analysis** and some logic layering.

### Step 1: Analyze each move at two depths

For each move (using Stockfish):

* Shallow eval (depth ≈ 12–14)
* Deep eval (depth ≈ 22–25)

### Step 2: Compare patterns

If a move was rated bad at shallow depth but becomes excellent/best at deeper search — and there was a clear tactical reason (sacrifice, forced line) — it qualifies as *Brilliant*.

### Step 3: Apply heuristic rules

A good heuristic set is:

| Rule                    | Example Condition                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Material sacrifice**  | The move loses ≥ 2 pawns of value immediately, but final eval after full depth improves by ≥ +300 cp. |
| **Only winning move**   | No other legal move keeps the eval within 200 cp of the best.                                         |
| **Evaluation recovery** | Position eval before move was ≤ -300 cp (worse), and after the move it’s ≥ +100 cp (winning).         |
| **Deep correction**     | Δ(shallow vs deep) ≥ 400 cp in favor of the played move.                                              |

If all these hold → mark as **Brilliant (💎)**.

---

## 📊 Relation to Other Categories

| Category      | Typical ΔEval                        | Description                   |
| ------------- | ------------------------------------ | ----------------------------- |
| Brilliant 💎  | +300 or more gain, rare, deep tactic | Sacrifice or only saving move |
| Best ⭐        | ≤ 15 cp diff from engine top move    | Equally optimal               |
| Excellent 👍  | ≤ 50 cp                              | Slightly weaker but fine      |
| Good ✅        | ≤ 120 cp                             | Small inaccuracy              |
| Inaccuracy ?! | 120–300 cp                           | Subpar move                   |
| Mistake ?     | 300–700 cp                           | Big error                     |
| Blunder ??    | >700 cp                              | Losing move                   |

So *Brilliant* isn’t a “numerical” label — it’s a **special flag** detected via tactical context and depth re-evaluation.

---

## 🧠 Implementation Summary for Your Roadmap

To match chess.com’s brilliant move detection:

1. **Enable dual-depth engine analysis**

   * Shallow (≈ 12–15) + deep (≈ 25+) to detect depth-discrepant discoveries.
2. **Compute unique-move advantage**

   * Only one move keeps near-optimal eval; others lose drastically.
3. **Detect material imbalance or sacrifice**

   * If the move loses material temporarily but eval improves, flag as tactical.
4. **Apply “recovery rule”**

   * If you were worse and the move regains equality or advantage, count as brilliant.
5. **Mark brilliant only if ≥ +300cp gain** and tactical criteria hold.
6. **Cap brilliance frequency**

   * Only 0–2 per game typically, to keep it meaningful.

---

### ✅ In Your Roadmap, Add This Line Under “Move Quality Classification”

> **Brilliant Move Detection (optional, advanced):**
> Identify rare tactical or defensive resources that reverse a losing evaluation or maintain equality via sacrifice. Uses multi-depth Stockfish analysis to flag unique, high-impact moves (e.g., sacrifices or only saving defenses) as “💎 Brilliant.”
> Frequency capped to preserve rarity (<2 per game).

