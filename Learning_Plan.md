# Assignment 11 — Guided Learning Plan

We will use `CSE4095_Class5_Starter_v3.ipynb` as our working notebook. The assignment is titled Class 5; it lives in Assignment 11 to match your course folders. The original assignment text is saved in `Assignment_Instructions.txt`.

## Current progress

- Learning steps 1–6 are complete: data inspection, fixed split, baselines, four engineered features, their CV comparison, and both importance methods.
- Learning step 7 is complete: you chose the original six features for simplicity given the negligible observed advantage of nine features. This representation is frozen for tuning.
- The student-designed ablation has a hypothesis recorded before the primary comparison in section 9. Section 10 repeats the comparison as a sensitivity experiment: its hypothesis was written after seeing the initial five-fold result, before running the additional folds. The notebook now states that timing explicitly.
- Learning step 9 is complete: five hyperparameters were explained and the planned 25-combination search ran on the original six features using the fixed primary five-fold CV.
- Learning step 10 is complete: you concluded the bounded search did not justify more broad tuning and chose the untuned original-six forest before final testing. Both models had CV MAE around 2 MPG; the notebook generates the exact comparison from the current run.
- The best sampled model uses 200 trees, unrestricted depth, all inputs considered per split, minimum split size 2, and minimum leaf size 1. No additional search has run.
- Learning step 11 is complete: final metrics, plots, and largest-error tables are saved for the chosen untuned forest and assignment-required search winner. Your final-performance interpretation and two error-case discussions are recorded. No test-guided model changes have been made.
- Final test MAE was about 1.67 MPG for the chosen untuned forest, 1.71 for the search winner, and 5.96 for the mean baseline. The notebook computes its numerical summaries, fold counts, and error-case facts on each run.
- Learning step 12 is complete: you reread the AI reflection, workflow reflection, and remaining hyperparameter explanations. Your earlier `min_samples_leaf` explanation remains in Section 11. AI help is acknowledged in the reflection and the AI-feedback labels. The required submission chat link must still be included separately.
- Submission cleanup removes teaching labels, draft labels, and the closing checklist. Supporting checks include training-only Spearman correlations, paired comparison SDs, predicted-MPG error bands, and a bootstrap interval using fixed predictions. The 0.05-MPG practical yardstick is explicitly retrospective. Library versions are printed first.
- The final audit reviews all 25 assignment parts and every source cell, verifies all four figures visually, and runs all 23 code cells plus extra invariant checks in a fresh kernel. The split, six-feature choice, forest settings, search, and prediction-generation code are preserved. Section 10 now reports the ten additional folds separately from the reused five-fold pilot.
- The saved pre-audit outputs used scikit-learn 1.8.0; the audit uses 1.9.1. Small numerical and error-order changes occur, but choices, importance ranks, search settings, model ordering, and conclusions agree. Current outputs and generated summaries belong to the audit environment. See `Submission_Audit.md` for the full requirement-by-requirement review.

## How we will work together

For each step:
1. I explain the idea and the purpose of the next experiment.
2. We discuss the choices before adding a small amount of code.
3. We run the relevant cells and read the actual output together.
4. You review the result and explain what you think it means.
5. We add a Markdown interpretation in your own words before continuing.

We will not fill in the whole notebook in advance. Results and conclusions will come from what we actually observe. Keep a short AI decision log as we work: what you asked, what I suggested, what you accepted/rejected/modified, how you tested it, and the evidence behind your decision.

## Step 1 — Understand the data

**Starter section:** 1. **Assignment part:** 1.

**Learn:** What a row, feature, target, and regression problem mean in this dataset.

**Do together:** Load the supplied Auto MPG CSV with Pandas. Inspect shape, rows, columns, data types, missing values, and descriptive statistics. Check for nonnumeric missing-value markers as well as ordinary nulls. Create a useful MPG distribution plot. Identify original numerical predictors and decide how to handle identifiers or descriptive text.

**Review:** What does one row represent? Why is MPG a regression target? Which columns might help predict it? Which values need cleaning?

**Finish with:** Inspection output, an MPG plot, and a short data description. This first overview is required by the assignment; later modeling decisions will use training data only.

## Step 2 — Reserve the final test set

**Starter section:** 2. **Assignment part:** 2.

**Learn:** How repeated use of a test score can influence decisions and make the final assessment misleading.

**Do together:** Define X and y. Make one 80/20 train/test split with `random_state=42`. Keep that split fixed. Set aside test data until Step 11. Any learned preprocessing, such as imputation, must be fitted using the training portion of each CV fold, typically through a pipeline.

**Review:** Why split before experimenting? Why is checking test MAE after every change a problem?

**Finish with:** Fixed training/test variables and a Markdown explanation of the test-set rule.

## Step 3 — Establish fair baselines

**Starter section:** 3. **Assignment part:** 3.

**Learn:** Mean prediction, Random Forest regression, MAE, RMSE, R², and five-fold cross-validation.

**Do together:** Define one reproducible five-fold CV procedure and reuse it for comparisons. Evaluate a mean predictor and an untuned Random Forest using the original numerical features on training data. For CV, the mean predictor learns the mean from each fold's training portion. Report mean-baseline metrics and Random Forest mean CV MAE with its standard deviation. Translate scikit-learn's negative MAE scores back to positive errors for reporting.

**Review:** What does an MAE of 3 mean in MPG units? Why do we need both a simple baseline and an untuned model? What does variation between folds tell us?

**Finish with:** Baseline results and a reusable evaluation approach. No final test metrics yet.

## Step 4 — Propose and justify engineered features

**Starter section:** 4. **Assignment parts:** 4–5.

**Learn:** How a meaningful transformation can express a relationship more directly.

**Do together:** Discuss candidate features before writing code. Choose at least three. For each, record its name, formula, and a reason it might relate to MPG. Implement them consistently, considering missing values and zero denominators. Any transformation that learns values from data belongs inside fold-specific preprocessing.

**Review:** What does each feature represent? Why might it help? Does it use information available when predicting a vehicle's MPG?

**Finish with:** At least three engineered features and explanations written before evaluating them.

**Requirement note:** The starter says choose 2–4; the assignment requires at least three, so choose three or four.

## Step 5 — Test whether engineering helped

**Starter section:** 5. **Assignment part:** 6.

**Learn:** A controlled comparison changes one main factor at a time.

**Do together:** Compare original features against original plus engineered features. Keep Random Forest settings and CV folds identical. Build a table of mean CV MAE and CV MAE standard deviation.

**Review:** Which representation performed better? Is the difference substantial relative to fold variability? Can this comparison tell us whether every individual engineered feature helped? What did we learn if performance worsened?

**Finish with:** Comparison table and an evidence-based interpretation, even if the engineered set does not improve performance.

## Step 6 — Investigate feature importance

**Starter sections:** 6–8. **Assignment parts:** 7–10.

**Learn:** The difference between built-in Random Forest importance and permutation importance; why correlated features complicate rankings; why importance does not establish causation.

**Do together:** Fit the engineered representation on development data and create a sorted built-in importance table and bar chart. Calculate permutation importance using validation data drawn only from the training set, preferably validation folds. Keep preprocessing and feature names aligned. Compare the rankings and look for shared information among raw and engineered predictors.

**Review:** What happens when we shuffle a useful feature? Why could two importance methods disagree? Can a useful feature receive a low importance score?

**Finish with:** Importance results, visualizations, and hypotheses about possible feature removal. Do not delete features solely because they fall below a threshold.

## Step 7 — Test feature subsets and choose one

**Starter section:** 9; add a Markdown decision afterward. **Assignment parts:** 11–13.

**Learn:** Importance suggests an experiment; cross-validation supplies evidence for a decision.

**Do together:** Use the importance results to propose several subsets, including all features and approximately three alternatives. Evaluate each using the same five-fold CV and untuned model settings. Report feature count, mean CV MAE, and CV standard deviation. Select a set using performance, variability, feature count, and simplicity.

**Review:** Can we remove features without noticeably hurting performance? Is the smallest set best? Why engineer before selecting? Use one of our engineered features to explain what could be lost by removing a raw input too early.

**Finish with:** Subset comparison table and a written selection decision. Treat these as development comparisons; repeated choices based on CV can also make the selected CV score optimistic.

## Step 8 — Design and run your own experiment

**Starter section:** 10. **Assignment part:** 23.

**Learn:** How to turn a prediction into a controlled experiment.

**Do together:** You choose one specific question, such as testing one additional meaningful feature or removing a particular predictor. Before running it, write: “Hypothesis: I expect ___ because ___.” Keep other settings fixed, use training-data CV, report the result, and decide whether the evidence supports the hypothesis. If it changes our selected representation, document and freeze that choice before tuning.

**Review:** What exactly changed? What stayed fixed? Did the evidence support the prediction?

**Finish with:** A hypothesis written before execution, results, and an interpretation.

**Requirement note:** The starter labels this section optional, but the assignment requires one student-designed experiment. Doing it here keeps it before the final test evaluation.

## Step 9 — Understand and run randomized search

**Starter section:** 11. **Assignment parts:** 14–16.

**Learn:** Hyperparameters versus learned parameters; randomized search versus grid search and manual tuning.

**Do together:** Explain reasonable ranges before implementing them. Search at least four Random Forest hyperparameters, potentially all five: `n_estimators`, `max_depth`, `max_features`, `min_samples_split`, and `min_samples_leaf`. Use roughly 20–30 sampled combinations, five-fold CV, MAE scoring, and `random_state=42`. Use only training data and the frozen feature representation.

**Review:** What does each setting control? How could it change model complexity or computation? Why sample combinations instead of trying every combination?

**Finish with:** A completed search and your own explanations of every searched hyperparameter.

## Step 10 — Interpret the search and compare stages

**Starter section:** 12; add a stage-summary section before section 13. **Assignment parts:** 17–18.

**Learn:** How to judge whether tuning added enough benefit to matter.

**Do together:** Report the best parameters and positive mean CV MAE. Show several top configurations with ranks and parameter values. Discuss similar scores and any best values at a search boundary without automatically launching another search. Build a summary table for original RF, engineered RF, selected-feature RF, and tuned RF.

**Review:** Which stage improved performance most? Was every added step helpful? What would a boundary value motivate us to investigate later? Is a tiny improvement convincing evidence?

**Finish with:** Search-results table, modeling-stage summary, and the final frozen workflow.

## Step 11 — Evaluate once and inspect errors

**Starter section:** 13; expand with error-analysis cells. **Assignment parts:** 19–22.

**Learn:** Generalization, residuals, and how to distinguish an observation from a hypothesis.

**Do together:** Use the search's best model fitted on all training data. Apply the same fixed transformations to the held-out test set. Generate the final test predictions once and reuse them for all metrics and plots. Report MAE, RMSE, and R² for the final model and the training-mean baseline. Create actual-versus-predicted and residual plots, with residual = actual − predicted. Display the 10 largest absolute errors with relevant features, and discuss at least two cases.

**Review:** Are test and CV errors reasonably consistent? What does a positive residual mean? Where are errors largest? What is directly observed, and what is only a possible explanation? A CV/test difference alone does not prove overfitting.

**Finish with:** Final metrics, both plots, largest-error table, and interpretations. Do not revise the workflow in response to these test results.

## Step 12 — Reflect and prepare the submission

**Starter section:** 14. **Assignment parts:** 24–25 and submission requirements.

**Learn:** How to explain the whole workflow and your own decisions.

**Do together:** Use the AI decision log to describe at least one suggestion you tested and one suggestion you rejected or modified. Explain why the workflow order matters and which modeling decisions excluded the test rows; distinguish those decisions from the initial full-data inspection. Review Markdown explanations throughout. Restart and run the notebook from beginning to end to verify reproducibility; this checks the frozen workflow and does not authorize further test-guided tuning.

**Review:** Can you explain the main choices without reading the code? Which decisions were supported by evidence? What did AI help with, and where did your judgment change the recommendation?

**Finish with:** One complete `.ipynb` containing code, outputs, plots, tables, and reflections, plus a link to the AI chat for submission.

## Completion checklist

- [x] Data inspection, missing-value checks, MPG visualization, and description.
- [x] Fixed 80/20 split with `random_state=42`.
- [x] Mean baseline and untuned Random Forest baseline.
- [x] At least three engineered features with names, formulas, and reasoning.
- [x] Original versus engineered CV comparison with mean MAE and standard deviation.
- [x] Built-in importance table/bar chart and permutation importance.
- [x] Discussion of correlated predictors and importance limitations.
- [x] Several feature-subset experiments and a justified selected set.
- [x] Explanation of why engineering precedes selection.
- [x] Student-designed experiment with a hypothesis written before the additional folds, disclosing the pilot result.
- [x] Randomized search over at least four hyperparameters, with explanations.
- [x] Best parameters, best CV MAE, and top search configurations.
- [x] Modeling-stage comparison table.
- [x] Final test MAE, RMSE, R², and mean-baseline comparison.
- [x] Actual-versus-predicted plot and residual analysis.
- [x] Ten largest errors and discussion of at least two cases.
- [x] AI reflection including one rejected or modified suggestion.
- [x] Final workflow reflection and a successful top-to-bottom run.
- [ ] Notebook and AI chat link ready to submit.
