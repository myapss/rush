(function () {
  'use strict';

  const STORE_KEY = 'rush-diet-planner-v1';
  const DIET_RANK = { vegan: 0, vegetarian: 1, pescatarian: 2, omnivore: 3 };
  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
  const MEAL_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };
  const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MEALS_BY_ID = Object.fromEntries(window.MEALS.map((m) => [m.id, m]));

  const $ = (sel) => document.querySelector(sel);
  const form = $('#profile-form');

  // ---------- Storage (browser only, may be unavailable) ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  const state = Object.assign({ profile: null, plan: null, checked: {} }, load());

  // ---------- Calculations ----------
  function readProfile() {
    const fd = new FormData(form);
    const units = fd.get('units');
    const num = (name) => parseFloat(fd.get(name));
    const heightCm = units === 'metric' ? num('heightCm') : ((num('heightFt') || 0) * 12 + (num('heightIn') || 0)) * 2.54;
    const weightKg = units === 'metric' ? num('weightKg') : num('weightLb') * 0.453592;
    return {
      units,
      sex: fd.get('sex'),
      age: num('age'),
      heightCm,
      weightKg,
      activity: num('activity'),
      goal: fd.get('goal'),
      diet: fd.get('diet'),
      exclude: fd.getAll('exclude'),
      raw: Object.fromEntries([...fd.entries()].filter(([k]) => k !== 'exclude'))
    };
  }

  function validate(p) {
    if (!(p.age >= 18 && p.age <= 100)) return 'Please enter an age between 18 and 100. This calculator is designed for adults.';
    if (!(p.heightCm >= 120 && p.heightCm <= 230)) return 'Please enter a height between 120 and 230 cm (about 3 ft 11 in to 7 ft 6 in).';
    if (!(p.weightKg >= 35 && p.weightKg <= 250)) return 'Please enter a weight between 35 and 250 kg (about 77 to 550 lb).';
    return null;
  }

  function computeTargets(p) {
    const h = p.heightCm / 100;
    const bmi = p.weightKg / (h * h);
    // Mifflin-St Jeor equation
    const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
    const tdee = bmr * p.activity;
    const adjust = { lose: -500, maintain: 0, gain: 300 }[p.goal];
    const floor = p.sex === 'male' ? 1500 : 1200;
    let target = Math.round((tdee + adjust) / 10) * 10;
    const floored = target < floor;
    if (floored) target = floor;

    const proteinPerKg = { lose: 1.8, maintain: 1.4, gain: 1.8 }[p.goal];
    let protein = Math.min(p.weightKg * proteinPerKg, (target * 0.35) / 4);
    const fat = (target * 0.28) / 9;
    const carbs = (target - protein * 4 - fat * 9) / 4;

    return {
      bmi,
      bmiCategory: bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese',
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target,
      floored,
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbs: Math.round(carbs),
      waterL: Math.round(p.weightKg * 0.035 * 10) / 10
    };
  }

  // ---------- Meal plan ----------
  function pool(type, p) {
    return window.MEALS.filter((m) =>
      m.type === type &&
      DIET_RANK[m.diet] <= DIET_RANK[p.diet] &&
      !m.tags.some((t) => p.exclude.includes(t))
    );
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generatePlan(p) {
    const pools = Object.fromEntries(MEAL_TYPES.map((t) => [t, shuffle(pool(t, p))]));
    return DAYS.map((_, i) => Object.fromEntries(MEAL_TYPES.map((t) => {
      const list = pools[t];
      return [t, list.length ? list[i % list.length].id : null];
    })));
  }

  function servingsFor(meal, type, target) {
    const s = Math.round(((target * MEAL_SHARE[type]) / meal.kcal) * 4) / 4;
    return Math.min(2.5, Math.max(0.5, s));
  }

  function swapMeal(dayIndex, type) {
    const list = pool(type, state.profile);
    const current = state.plan[dayIndex][type];
    const options = list.filter((m) => m.id !== current);
    if (!options.length) return;
    state.plan[dayIndex][type] = options[Math.floor(Math.random() * options.length)].id;
    save();
    renderPlan();
    renderShopping();
  }

  // ---------- Rendering ----------
  const fmt = (n) => Math.round(n).toLocaleString();

  function renderResults(t) {
    const el = $('#results');
    el.hidden = false;
    el.innerHTML = `
      <div class="stat highlight"><span class="stat-label">Daily calories</span><span class="stat-value">${fmt(t.target)}</span><span class="stat-unit">kcal</span></div>
      <div class="stat"><span class="stat-label">Protein</span><span class="stat-value">${t.protein}</span><span class="stat-unit">g / day</span></div>
      <div class="stat"><span class="stat-label">Carbs</span><span class="stat-value">${t.carbs}</span><span class="stat-unit">g / day</span></div>
      <div class="stat"><span class="stat-label">Fat</span><span class="stat-value">${t.fat}</span><span class="stat-unit">g / day</span></div>
      <div class="stat"><span class="stat-label">BMI</span><span class="stat-value">${t.bmi.toFixed(1)}</span><span class="stat-unit">${t.bmiCategory}</span></div>
      <div class="stat"><span class="stat-label">Water</span><span class="stat-value">${t.waterL}</span><span class="stat-unit">litres / day</span></div>
      <p class="muted full">Your body burns about ${fmt(t.bmr)} kcal a day at rest and about ${fmt(t.tdee)} kcal a day with your activity level.
      ${t.floored ? '<br><strong>We raised your target to a safe minimum.</strong> Eating less than this is not recommended without medical supervision.' : ''}</p>`;
  }

  function renderPlan() {
    const grid = $('#plan-grid');
    const has = !!(state.plan && state.profile);
    $('#plan-empty').hidden = has;
    $('#regenerate').disabled = !has;
    $('#print').disabled = !has;
    if (!has) { grid.innerHTML = ''; return; }

    const target = computeTargets(state.profile).target;
    grid.innerHTML = state.plan.map((day, d) => {
      let totals = { kcal: 0, p: 0, c: 0, f: 0 };
      const meals = MEAL_TYPES.map((type) => {
        const meal = MEALS_BY_ID[day[type]];
        if (!meal) {
          return `<li class="meal empty"><span class="meal-type">${MEAL_LABEL[type]}</span><span>No matching meal. Try fewer restrictions.</span></li>`;
        }
        const s = servingsFor(meal, type, target);
        totals.kcal += meal.kcal * s; totals.p += meal.p * s; totals.c += meal.c * s; totals.f += meal.f * s;
        return `<li class="meal">
          <div class="meal-top">
            <span class="meal-type">${MEAL_LABEL[type]}</span>
            <button type="button" class="swap" data-day="${d}" data-type="${type}" title="Swap this meal" aria-label="Swap ${MEAL_LABEL[type]} on ${DAYS[d]}">↻</button>
          </div>
          <span class="meal-name">${meal.name}</span>
          <span class="meal-meta">${meal.cuisine} · ${s} serving${s === 1 ? '' : 's'} · ${fmt(meal.kcal * s)} kcal</span>
        </li>`;
      }).join('');
      return `<article class="day card">
        <h3>${DAYS[d]}</h3>
        <ul class="meals">${meals}</ul>
        <p class="day-total"><strong>${fmt(totals.kcal)} kcal</strong> · P ${fmt(totals.p)}g · C ${fmt(totals.c)}g · F ${fmt(totals.f)}g</p>
      </article>`;
    }).join('');
  }

  function renderShopping() {
    const list = $('#shopping-list');
    const has = !!state.plan;
    $('#shopping-empty').hidden = has;
    $('#clear-checked').disabled = !has;
    if (!has) { list.innerHTML = ''; return; }

    const counts = {};
    state.plan.forEach((day) => MEAL_TYPES.forEach((t) => {
      const meal = MEALS_BY_ID[day[t]];
      if (meal) meal.ingredients.forEach((ing) => { counts[ing] = (counts[ing] || 0) + 1; });
    }));
    list.innerHTML = Object.keys(counts).sort((a, b) => a.localeCompare(b)).map((ing) => `
      <li><label><input type="checkbox" data-item="${ing}" ${state.checked[ing] ? 'checked' : ''}>
        <span>${ing}</span><small>for ${counts[ing]} meal${counts[ing] === 1 ? '' : 's'}</small></label></li>`).join('');
  }

  // ---------- Form helpers ----------
  function toggleUnits() {
    const imperial = form.elements.units.value === 'imperial';
    form.querySelectorAll('.metric-only').forEach((el) => { el.hidden = imperial; });
    form.querySelectorAll('.imperial-only').forEach((el) => { el.hidden = !imperial; });
  }

  function restoreForm(p) {
    if (!p || !p.raw) return;
    Object.entries(p.raw).forEach(([name, value]) => {
      const field = form.elements[name];
      if (!field) return;
      if (field instanceof RadioNodeList) {
        field.forEach((r) => { r.checked = r.value === value; });
      } else {
        field.value = value;
      }
    });
    form.querySelectorAll('input[name="exclude"]').forEach((cb) => { cb.checked = p.exclude.includes(cb.value); });
  }

  // ---------- Events ----------
  form.addEventListener('change', (e) => { if (e.target.name === 'units') toggleUnits(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = readProfile();
    const error = validate(p);
    const errEl = $('#form-error');
    errEl.hidden = !error;
    errEl.textContent = error || '';
    if (error) return;

    state.profile = p;
    state.plan = generatePlan(p);
    state.checked = {};
    save();
    renderResults(computeTargets(p));
    renderPlan();
    renderShopping();
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#regenerate').addEventListener('click', () => {
    state.plan = generatePlan(state.profile);
    state.checked = {};
    save();
    renderPlan();
    renderShopping();
  });

  $('#print').addEventListener('click', () => window.print());

  $('#plan-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.swap');
    if (btn) swapMeal(Number(btn.dataset.day), btn.dataset.type);
  });

  $('#shopping-list').addEventListener('change', (e) => {
    const item = e.target.dataset.item;
    if (!item) return;
    state.checked[item] = e.target.checked;
    save();
  });

  $('#clear-checked').addEventListener('click', () => {
    state.checked = {};
    save();
    renderShopping();
  });

  // ---------- Init ----------
  if (state.profile) {
    restoreForm(state.profile);
    if (!validate(state.profile)) renderResults(computeTargets(state.profile));
  }
  toggleUnits();
  renderPlan();
  renderShopping();
})();
