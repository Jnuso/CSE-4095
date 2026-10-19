**accuracy_a**
Defect: `accuracy_a(1, 8)` returns `12`, required `13` (the `int()` function truncates towards zero, failing to round 12.5 upward).
Correction: Use `floor(100 * correct / attempted + 0.5)`.

**accuracy_b**
No findings.

**append_c**
Defect: `append_c([{'id': '1', 'v': 1}], {'id': '1', 'v': 2})` returns `[{'id': '1', 'v': 1}, {'id': '1', 'v': 2}]`, required `[{'id': '1', 'v': 1}]` (the function checks for dictionary equality rather than ID uniqueness, failing to ignore existing IDs when other fields differ).
Correction: Change the membership check to `if any(e['id'] == attempt['id'] for e in attempts):`.

**append_d**
No findings.
