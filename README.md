# Rush Diet Planner

A free, static diet planner website for a worldwide audience.

- **Calorie & macro calculator**: uses the Mifflin-St Jeor equation, metric or imperial units, and goals to lose, maintain or gain weight.
- **7-day meal plan**: dishes from many cuisines, filtered by eating style (everything, pescatarian, vegetarian, vegan) and things to avoid (gluten, dairy, nuts, pork, beef). Portions scale to your calorie target, and you can swap any meal.
- **Shopping list** built from the week's plan, with items you can tick off.
- Works on phones, supports dark mode, and has a print-friendly plan. Data is stored only in the visitor's browser.

## Run locally

No build step is needed. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Publish with GitHub Pages

In the repository, go to **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`. The site will be live at `https://myapss.github.io/rush/`.

## Files

- `index.html`: page structure
- `styles.css`: styling (light/dark, print)
- `meals.js`: meal library with nutrition data
- `app.js`: calculator, plan generator, shopping list

## Disclaimer

The estimates are general guidance for healthy adults and are not medical advice.
