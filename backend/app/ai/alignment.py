"""Word-level sequence alignment for read-aloud analysis.

Phase 8 Step 2: this is the ONE place that decides what counts as a
correct word, an omission, a substitution, an insertion, or a repetition —
used by BOTH MockAIAnalysisService and RealAIAnalysisService so the two
never disagree about how errors are classified. The Phase 7 mock did a
naive positional comparison (index i of expected vs. index i of
recognized), which can't detect insertions and misclassifies everything
after a single dropped/added word. This uses a standard Needleman-Wunsch
word-level alignment (same family of algorithm real reading-assessment
tools use) so a single omission or insertion doesn't cascade into false
substitutions for every word that follows it.

This module is pure text comparison — it has no opinion about where the
recognized text came from (typed, mock STT, or real STT) and makes no
audio/acoustic claims.
"""
import re

_PUNCT_RE = re.compile(r"^[.,!?;:'\"()\[\]]+|[.,!?;:'\"()\[\]]+$")


def _normalize(word: str) -> str:
    return _PUNCT_RE.sub("", word).lower()


def _words(text: str) -> list[str]:
    return text.strip().split() if text and text.strip() else []


def align_words(expected: list[str], recognized: list[str]) -> list[dict]:
    """Global (Needleman-Wunsch) alignment at word granularity.

    Returns an ordered list of ops, each a dict:
      {"op": "correct" | "substitution" | "omission" | "insertion",
       "expected": str | None, "recognized": str | None}

    Cost model: match = 0, substitution = 1, omission/insertion = 1 each.
    This is a minimum-edit-distance alignment, not a guess — the same
    expected/recognized pair always produces the same alignment.
    """
    n, m = len(expected), len(recognized)
    # dp[i][j] = min edit cost aligning expected[:i] with recognized[:j]
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = i
    for j in range(1, m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            match_cost = 0 if _normalize(expected[i - 1]) == _normalize(recognized[j - 1]) else 1
            dp[i][j] = min(
                dp[i - 1][j - 1] + match_cost,  # correct or substitution
                dp[i - 1][j] + 1,               # omission (expected word not recognized)
                dp[i][j - 1] + 1,               # insertion (extra recognized word)
            )

    ops: list[dict] = []
    i, j = n, m
    while i > 0 or j > 0:
        if i > 0 and j > 0:
            match_cost = 0 if _normalize(expected[i - 1]) == _normalize(recognized[j - 1]) else 1
            if dp[i][j] == dp[i - 1][j - 1] + match_cost:
                ops.append({
                    "op": "correct" if match_cost == 0 else "substitution",
                    "expected": expected[i - 1],
                    "recognized": recognized[j - 1],
                })
                i, j = i - 1, j - 1
                continue
        if i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            ops.append({"op": "omission", "expected": expected[i - 1], "recognized": None})
            i -= 1
            continue
        # j > 0 (only remaining option)
        ops.append({"op": "insertion", "expected": None, "recognized": recognized[j - 1]})
        j -= 1

    ops.reverse()

    # Reclassify insertions that sit immediately next to a matching
    # recognized word as repetitions, not "extra" words — a child
    # re-saying a word they just said is a distinct, common reading
    # pattern from an unrelated inserted word.
    #
    # Checked in BOTH directions deliberately: when the expected/recognized
    # text contains a repeated word, there are two equally cost-minimal
    # alignments (matching the 1st vs. the 2nd occurrence to the expected
    # word), and standard backtracking can resolve the tie either way —
    # e.g. for expected "The cat sat" / recognized "The the cat sat", this
    # aligner's backtrack matches expected "The" to recognized[1] ("the"),
    # leaving recognized[0] ("The") as an insertion that comes BEFORE its
    # duplicate rather than after. A previous-only check misses that; a
    # previous-OR-next check catches it regardless of which occurrence the
    # alignment formally calls the "insertion". (Bug found and fixed during
    # verification — was previously silently under-detecting repetitions.)
    for idx, op in enumerate(ops):
        if op["op"] != "insertion":
            continue
        prev_word = ops[idx - 1]["recognized"] if idx > 0 else None
        next_word = ops[idx + 1]["recognized"] if idx + 1 < len(ops) else None
        if (prev_word and _normalize(op["recognized"]) == _normalize(prev_word)) or \
           (next_word and _normalize(op["recognized"]) == _normalize(next_word)):
            op["op"] = "repetition"

    return ops


def analyze_reading(expected_text: str, recognized_text: str) -> dict:
    """Full educational reading-error analysis. Pure function, no I/O.

    Returns counts plus the per-word `error_words` detail (used both for
    the API response and to create ReadingObservation rows), and a
    best-effort, clearly-scoped `word_order_mismatch` flag: True only when
    expected and recognized contain the exact same set of words (so
    nothing was actually omitted/inserted/substituted) but in a different
    order — a narrow, explainable signal, not a general claim about
    syntax or comprehension.
    """
    expected_words = _words(expected_text)
    recognized_words = _words(recognized_text)
    ops = align_words(expected_words, recognized_words)

    correct = sum(1 for o in ops if o["op"] == "correct")
    substitutions = sum(1 for o in ops if o["op"] == "substitution")
    omissions = sum(1 for o in ops if o["op"] == "omission")
    insertions = sum(1 for o in ops if o["op"] == "insertion")
    repetitions = sum(1 for o in ops if o["op"] == "repetition")

    error_words = [o for o in ops if o["op"] != "correct"]

    expected_multiset = sorted(_normalize(w) for w in expected_words)
    recognized_multiset = sorted(_normalize(w) for w in recognized_words)
    word_order_mismatch = (
        expected_multiset == recognized_multiset
        and [_normalize(w) for w in expected_words] != [_normalize(w) for w in recognized_words]
    )

    words_attempted = len(expected_words)
    accuracy = round((correct / words_attempted) * 100, 1) if words_attempted else 0.0

    return {
        "words_attempted": words_attempted,
        "words_recognized": len(recognized_words),
        "words_correct": correct,
        "omissions": omissions,
        "substitutions": substitutions,
        "insertions": insertions,
        "repetitions": repetitions,
        "accuracy": accuracy,
        "word_order_mismatch": word_order_mismatch,
        "error_words": error_words,
    }
