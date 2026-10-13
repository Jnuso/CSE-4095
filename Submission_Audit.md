# Assignment 11 submission audit

Reviewed October 12, 2026. The audit covered every source cell, saved tables and figures, all 25 assignment parts, and a fresh-kernel execution with extra invariant checks. This report is a review aid; the assignment requests the notebook and AI-chat link for submission.

**Conclusion:** The technical checks below pass after the outside-audit corrections. The earlier blanket submission-ready statement missed misleading correlation wording and a misplaced final cell; those issues are corrected. The assignment asks for explanations in the student's own words, which requires the student's judgment and cannot be certified by runtime checks. The additional experiment is a valid descriptive training-CV sensitivity experiment with its chronology and limitations disclosed. This is not a guarantee of a particular grade.

## Corrections made

- Removed the remaining draft label after student review and polished the missing-horsepower explanation without changing its meaning.
- Corrected “did not improve” to “did not meaningfully improve”; a tiny numerical reduction is present.
- Fixed the reference to the cylinders ranking and the remaining second-person candidate-table wording.
- Made the minimum-leaf explanation conditional rather than implying guaranteed tree sizes or monotonic error changes.
- Added generated interpretations for data, importance, leading search configurations and modeling stages.
- Separated the ten additional validation-fold results from the five reused pilot scores in the student-designed experiment.

## Outside-audit follow-up

- Corrected the power-to-weight explanation and printed its acceleration correlation alongside horsepower and weight. Correlation supports hypotheses about overlap, not proof of redundancy.
- Added a clearly retrospective, training-only check of the original directional predictions. It does not change any frozen modeling decision.
- Added paired four-versus-six means, SDs and fold counts. Both four and six are acknowledged as defensible; the 0.05 MPG yardstick is a reporting guide rather than an automatic selection rule.
- Disclosed the fixed forest seed and distinguished average effects from individual-fold changes.
- Explained natural search limits, a possible training-only diagnostic of the boundary result, and the slightly worse search score. No additional search or seed experiment was performed.
- Added training cardinalities as a possible contributor to the importance rank gap, without claiming to isolate a cause.
- Moved all hyperparameter explanations beside the search, added assignment-part labels, and placed Part 25 last with explicit workflow dependencies and test protection.
- Clarified that all four ratios were omitted and that AI helped draft or edit explanations. The notebook does not present the outside auditor's nine-seed experiment as the student's work.

## Final submission review

The final pass reviewed all **62 cells and 1,252 source lines**, including **876 lines of code**, against the assignment questions. It also checked every saved output and visually inspected the four embedded figures. **No remaining technical or assignment-coverage issue requiring a notebook change was found.** The chat link was excluded from this final readiness check, as requested.

A separate fresh-kernel execution completed all 24 notebook code cells and the private runtime assertions. Every saved table, figure, generated interpretation, and printed result matched the fresh execution. The submission notebook was not modified during this pass. The current notebook SHA-256 is `e231934977e99646ff1a8ab64b8c615d00877d55bf47227748a0bdf535cd26f9`.

**Readability update after the execution audit:** Student explanations and AI feedback were combined into one continuous explanation per topic. Repeated wording was removed, while the statistical qualifications, original hypotheses, model choices, and observation-versus-hypothesis distinction were retained. The AI reflection still acknowledges drafting and editing help. All 24 code cells and their saved outputs are exactly unchanged from the audited run, so another modeling run was unnecessary. The revised Markdown was checked for consistency and stale role labels.

**Final-answer wording update:** Responses now use the original student reasoning as their base with the necessary corrections integrated directly. Role labels, blockquotes, and commentary about revising answers were removed outside the AI reflection. Necessary experiment chronology and hypothesis limitations remain. The AI reflection, all code cells, all saved outputs, and the model choices are unchanged.

Cell numbers below are zero-based, matching the outside audit's convention.

| Cells | Final source and output review |
|---|---|
| 0–9 | Dataset inspection, missing values, descriptive statistics, regression target, and histogram agree with the data. |
| 10–12 | Fixed 80/20 split, seed 42, aligned inputs/targets, and explanation of test-guided selection are correct. |
| 13–18 | Both baselines use matched training CV; imputation stays inside the pipeline; MAE, RMSE, R², and score signs are correct. |
| 19–23 | Four interpretable formulas, missing-value handling, original directional guesses, and the explicitly retrospective training-only correlation check are consistent. |
| 24–26 | Original versus engineered comparison changes the representation under matched controls; paired summaries and negligible-effect wording agree. |
| 27–30 | Built-in and validation permutation importance use the stated fits, units, signs, rankings, and readable charts. |
| 31–35 | Matching-fit rank comparison, distinct-value hypothesis, correlation table, acceleration association, and limits on redundancy/causation claims are supported. |
| 36–38 | Five feature subsets, primary CV results, and the explicitly hypothetical raw-ingredient example answer Parts 11–12. |
| 39–42 | The follow-up hypothesis is distinguished from its pilot, reused scores are separated from ten additional folds, and the six-versus-four tradeoff and fixed seed are disclosed before tuning. |
| 43–45 | All five searched hyperparameters are explained beside a bounded 25-combination, five-fold, MAE-based randomized search. |
| 46–50 | Leading settings, natural boundaries, stage comparison, slightly worse search score, optional future diagnostic, and pre-test model preference agree. |
| 51–52 | Both frozen forests and the training-mean baseline are evaluated at the final stage; each generates test predictions once per execution. |
| 53–56 | Scatter axes, reference diagonals, residual signs, predicted-MPG bands, sample sizes, and conditional bootstrap interpretation are correct. |
| 57–59 | Both top-ten error tables are sorted correctly; rows 389 and 394 have the stated observations, with speculative mechanisms labeled as hypotheses. |
| 60 | AI help with code and drafting is acknowledged; accepted, rejected, and modified suggestions are connected to the experiments. |
| 61 | Part 25 is the final cell and explains workflow dependencies, the initial full-data inspection, development-only CV, and final-test protection. |

The additional experiment is valid for its stated descriptive question. It does not claim independent confirmation, statistical equivalence, or robustness across forest seeds. Retaining six instead of four features is presented as a defensible judgment rather than a uniquely established optimum. These disclosed limits do not require another experiment for submission.

## Requirement-by-requirement findings

| Part | Requirement | Notebook section | Finding |
|---|---|---|---|
| 1 | Load and understand data | 1 | Present: Shape, rows, columns, types, missing values, statistics, MPG histogram, and generated interpretation. |
| 2 | Final train/test split | 2 | Present: 80/20 split, seed 42, disjoint aligned rows, and explanation of test-guided selection risk. |
| 3 | Mean and untuned forest baselines | 3 | Present: Fold-trained mean and default forest; MAE, RMSE, R²; matched five-fold CV. |
| 4 | Understand feature engineering | 4 | Present: Ratios express interpretable relationships; no promised accuracy or causal effects. |
| 5 | At least three features with rationale | 4 | Present: Four ratios, formulas and interpretations; deterministic row calculations; safe denominators. |
| 6 | Evaluate engineering | 5 | Present: Original versus engineered mean/std, identical folds/model settings, paired differences and qualified conclusion. |
| 7 | Feature importance | 6–8 | Present: Both built-in and held-out training-CV permutation importance. |
| 8 | Built-in importance interpretation | 6, 8 | Present: Sorted table/bar chart and generated highest/lowest/engineered ranking; training credit is not causation. |
| 9 | Permutation importance interpretation | 7–8 | Present: Validation folds only; correct error-increase sign; ranking comparison; high/low features reported. |
| 10 | Correlated features and importance | 8 | Present: Training-only Spearman table; shared information, weak marginal importance, and noncausal interpretation. |
| 11 | Candidate feature-selection sets | 9 | Present: Five candidates, same pipeline and folds, counts and MAE mean/std; no automatic importance cutoff. |
| 12 | Engineering before selection | 9 | Present: Displacement/cylinders example explicitly hypothetical; cylinders ranking is not described as low. |
| 13 | Choose features before tuning | 10 | Present: Original six frozen before search; small paired differences and simplicity explained. |
| 14 | Explain randomized search | 11 | Present: Hyperparameters versus fitted quantities; sampled combinations versus full grid/manual bookkeeping. |
| 15 | Build randomized search | 11 | Present: Five parameters, 25 sampled combinations, five-fold neg-MAE scoring, seed 42, training data only. |
| 16 | Explain each searched setting | 11 | Present: All five explained, with behavior/complexity tradeoffs; split-size and leaf-size distinction retained. |
| 17 | Interpret search results | 12 | Present: Best settings/MAE, ten leaders, top-three score spread, boundary review, and a bounded hypothetical next question. |
| 18 | Compare modeling stages | 12 | Present: Stage table plus generated largest observed reduction; no practically meaningful gain claimed. |
| 19 | Final test metrics and mean baseline | 13 | Present: Best search model and preselected untuned model both reported; MAE/RMSE/R²; CV/test limits explained. |
| 20 | Actual versus predicted plot | 13 | Present: Both forests, correct axes and diagonal, and qualified discussion of larger errors. |
| 21 | Residual analysis | 13 | Present: Actual minus predicted; zero line; descriptive bands, changing spread, and no strong overall directional claim. |
| 22 | Ten largest errors and two cases | 13 | Present: Sorted tables for both forests; rows 389 and 394; dynamic facts separated from speculative mechanisms. |
| 23 | Additional controlled experiment | 10 | Present: Hypothesis before ten additional folds; initial five explicitly identified as pilot; new-fold results separated. |
| 24 | AI decision-making reflection | 14 | Present: Requests, suggestions, testing, acceptance, rejection/modification and evidence match the recorded discussion. |
| 25 | Workflow reflection and test protection | 14 | Present as the final cell: Complete workflow, explicit dependencies, Parts 3–18 test protection, and initial all-data inspection distinguished from modeling decisions. |

## Experiment validity

The additional question is whether the ablation conclusion is sensitive to the CV partitions. Candidate models are paired on the same folds. Original training rows, preprocessing strategy, forest settings, forest seed, and MAE remain fixed. Every imputer is fitted inside the relevant training fold. The initial five-fold result informed the follow-up hypothesis, which was written before the ten additional folds were run; the notebook does not present that follow-up as blind or preregistered.

In the audit environment, removing power-to-weight across the ten additional folds changed mean MAE by -0.0110 MPG, with paired SD 0.0441 MPG, improving 7/10 folds. Adding the ratio alone changed mean MAE by +0.0067 MPG, with paired SD 0.0474 MPG, improving 5/10 folds.

These results are consistent with a small average incremental effect in this workflow. Individual folds can change more, and all comparisons use a single forest seed (42). They do not prove equivalence, universal uselessness, a redundancy mechanism, or causation. Repeated folds overlap, the data were already used for development, and the 0.05-MPG reporting yardstick was adopted retrospectively. The experiment is useful controlled development evidence, not an independent final performance estimate. No new model or feature choice was made from these audit results.

## Execution and reproducibility

- All 24 submission code cells executed sequentially in a fresh kernel with no saved errors or warnings. All four figures are embedded and their image data are valid.
- Additional runtime assertions passed for data alignment, disjoint train/test rows, complete validation coverage, ratio formulas, reuse of the first five folds, ten new folds, feature-set sizes, search settings, training-only imputation medians, metric arithmetic, residual signs, error sorting and band-weighted MAE.
- An AST comparison confirmed the original model construction, splitting, fitting, CV, and prediction operations are unchanged. Code changes add training-only descriptive correlations and expand comparison summaries. No additional fitting or prediction follows the final evaluation cell.
- Each fixed model generates test predictions once per complete execution; later diagnostics reuse the stored arrays. Re-execution validates the fixed workflow and has not driven model selection.

The pre-audit saved outputs used Python 3.13.2, scikit-learn 1.8.0, NumPy 2.2.4, and pandas 2.2.3. The fresh audit uses Python 3.12.14, scikit-learn 1.9.1, NumPy 2.5.4, and pandas 3.0.1. Small score and error-order differences occur across these environments; the comparison does not isolate which dependency caused them. The best search parameters, both importance rankings, selected features, model preference, test-performance ordering and top two error records agree. Current saved outputs and generated prose belong to the fresh audit environment.

| Model | Test MAE | Test RMSE | Test R² |
|---|---:|---:|---:|
| Chosen untuned forest | 1.6742 | 2.2464 | 0.9061 |
| Best search forest | 1.7056 | 2.3074 | 0.9010 |
| Training-mean baseline | 5.9554 | 7.3473 | -0.0040 |

## Submission item outside the notebook

The assignment also requires a link to the AI chat. No share link is present in the notebook, and this audit cannot confirm whether it has already been attached separately in the submission system. Include that link with the notebook. This audit did not publish the conversation.

## Method references

The leakage and preprocessing checks follow [scikit-learn’s guidance on pipelines and data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage). The distinction between development CV scores and an assessment of the full selection procedure is consistent with the [nested versus non-nested CV explanation](https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html). Repeated partitioning follows the documented [Repeated K-fold procedure](https://scikit-learn.org/stable/modules/cross_validation.html#repeated-k-fold).
