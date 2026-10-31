# How NutriPlan AI calculates targets

All calculations are deterministic code in `src/lib/nutrition/` and are covered by unit tests in `src/lib/nutrition/targets.test.ts`. The AI never produces these numbers.

## 1. Basal metabolic rate (BMR)

The **Mifflin-St Jeor equation** (Mifflin et al., 1990, *Am J Clin Nutr* 51:241–7):

```
BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age(years) + s
s = +5 (male), −161 (female), −78 (prefer not to say: midpoint)
```

## 2. Total daily energy expenditure (TDEE)

`TDEE = BMR × activity factor`

| Level | Factor | Description |
|---|---|---|
| sedentary | 1.2 | little or no exercise |
| light | 1.375 | exercise 1–3 days/week |
| moderate | 1.55 | exercise 3–5 days/week |
| very_active | 1.725 | exercise 6–7 days/week |
| athlete | 1.9 | hard training or physical job |

## 3. Calorie range by goal

| Goal | Range |
|---|---|
| lose | `TDEE − deficit` to `TDEE − deficit/2`, where `deficit = min(20% of TDEE, 500 kcal)` |
| maintain / healthier | TDEE ± 5% |
| gain | TDEE + 5% to TDEE + 10% |

The target is the midpoint of the range, rounded to the nearest 10 kcal.

## 4. Safety rules (applied in this order)

1. **Age under 18:** no targets (`not_applicable: under_18`).
2. **Pregnant or breastfeeding:** no targets (`not_applicable: pregnancy`).
3. **Eating-disorder history:** no targets (`not_applicable: eating_disorder_history`).
4. **BMI < 18.5 with a weight-loss goal:** switched to maintenance (`underweight_no_loss`).
5. **Calorie floor:** never below 1,200 kcal (female / unspecified) or 1,500 kcal (male) (`calorie_floor_applied`).
6. **Deficit too small:** if TDEE is within 100 kcal of the floor, weight loss falls back to maintenance (`deficit_too_small`).

Validation (in the forms and the onboarding schema) limits inputs to adults aged 18–100, height 120–230 cm and weight 35–250 kg.

## 5. Macronutrients

- **Protein** (g per kg of reference weight):

  | Goal | Target | Range |
  |---|---|---|
  | lose | 1.6 | 1.2–2.0 |
  | maintain / healthier | 1.2 | 0.8–1.6 |
  | gain | 1.8 | 1.6–2.2 |
  | any goal + reported medical condition | 1.0 | 0.8–1.2 |

  The reference weight is actual weight, or the weight at BMI 25 for the user's height when BMI > 30 (`high_bmi_reference_weight`). Protein is capped at 35% of calories.
- **Fat:** 30% of calories (range 25–35%).
- **Carbohydrate:** the remainder, `(kcal − 4×protein − 9×fat) / 4`.

## 6. BMI

`BMI = weight(kg) / height(m)²`, with WHO adult categories: < 18.5 underweight, 18.5–24.9 healthy, 25–29.9 overweight, ≥ 30 obesity.

## Limitations

These equations estimate population averages. Individual needs commonly differ by 10–20%. The product tells users this alongside every estimate and suggests adjusting gradually based on their trend over 2–4 weeks.
