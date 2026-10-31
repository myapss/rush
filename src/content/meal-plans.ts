import type { LibraryFilter } from "@/lib/library";

export interface Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface MealPlanPage {
  slug: string;
  /** H1 */
  title: string;
  metaTitle: string;
  description: string;
  /** Short label for the hub and links. */
  label: string;
  intro: string[];
  filter: LibraryFilter;
  /** Recipe slugs to feature first in the example week. */
  prefer?: string[];
  sections: Section[];
  faq: { q: string; a: string }[];
}

/**
 * Landing-page content. Written by the NutriPlan team for general, healthy
 * adults; keep claims conservative and in line with mainstream guidance
 * (WHO, national dietary guidelines). Have a dietitian review before launch.
 */
export const MEAL_PLAN_PAGES: MealPlanPage[] = [
  {
    slug: "weight-loss",
    title: "7-day meal plan for weight loss",
    metaTitle: "7-Day Meal Plan for Weight Loss (Balanced and Realistic)",
    description:
      "A realistic 7-day weight-loss meal plan built around protein, vegetables and filling whole foods, plus how to set a safe calorie target.",
    label: "Weight loss",
    intro: [
      "Sustainable weight loss comes from eating a little less energy than you use, consistently, with meals you actually enjoy. Crash diets tend to backfire: they're hard to stick to and can cost you muscle.",
      "This example week leans on protein, vegetables, beans and whole grains, which help you feel full on fewer calories. Portions are what change from person to person, so use it as a template, not a prescription.",
    ],
    filter: {},
    prefer: [
      "shakshuka", "tofu-scramble-spinach", "greek-yogurt-parfait", "overnight-oats-berries", "masala-omelette-toast",
      "chickpea-quinoa-salad", "chicken-pho", "black-bean-soup", "tuna-nicoise", "fish-tacos", "chicken-burrito-bowl", "red-lentil-dal",
      "baked-salmon-sweet-potato", "chicken-quinoa-roast-veg", "miso-glazed-cod", "lentil-bolognese", "okra-soup-fish-yam", "efo-riro-fish-rice", "beef-broccoli-rice",
      "yogurt-honey", "edamame-snack", "boiled-eggs", "hummus-carrots", "orange-snack",
    ],
    sections: [
      {
        heading: "How to set your calorie target",
        paragraphs: [
          "Start with an estimate of your maintenance calories (your TDEE), then eat a modest amount below it. Our calculator caps the deficit at 20% of maintenance and never more than 500 kcal a day, which for most people means losing around 0.25–0.5 kg (0.5–1 lb) a week.",
          "We never suggest going below 1,200 kcal a day (1,500 for men) without medical supervision, and we don't give weight-loss targets to anyone under 18, pregnant or breastfeeding, or with a history of disordered eating.",
        ],
      },
      {
        heading: "What makes a weight-loss meal filling",
        bullets: [
          "A palm-sized portion of protein at each meal: eggs, yogurt, fish, chicken, beans, lentils or tofu.",
          "Half the plate as vegetables or salad, which add volume and fibre for few calories.",
          "Whole grains or starchy foods in sensible portions rather than none at all, so energy levels stay steady.",
          "Cooking oil measured with a spoon. It's healthy, but it's the easiest place for calories to creep in.",
        ],
      },
      {
        heading: "Tracking progress without obsessing",
        paragraphs: [
          "Body weight naturally swings by 1–2 kg (2–4 lb) from day to day because of water, salt and food in your gut. Look at the trend over 2–4 weeks, and adjust by 100–200 kcal at a time if nothing is changing. Waist measurement, energy and how your clothes fit are useful signals too.",
        ],
      },
    ],
    faq: [
      { q: "How fast should I lose weight?", a: "Around 0.5–1% of your body weight per week is a common, sustainable range. Faster loss is harder to maintain and more likely to cost muscle." },
      { q: "Do I need to cut carbs?", a: "No. Overall calories matter most. Many people find meals with protein, vegetables and some whole grains more satisfying than very low-carb eating." },
      { q: "Can I use this plan if I have diabetes?", a: "Please plan with your doctor or a registered dietitian first, especially if you take medication that affects blood sugar." },
    ],
  },
  {
    slug: "high-protein",
    title: "High-protein meal plan",
    metaTitle: "7-Day High-Protein Meal Plan (Everyday Foods)",
    description:
      "A 7-day high-protein meal plan using everyday foods like eggs, yogurt, fish, chicken, beans and tofu, with protein targets explained.",
    label: "High protein",
    intro: [
      "Eating more protein can help you stay full when cutting calories and supports muscle when you're strength training. You don't need shakes or bars: eggs, dairy, fish, meat, beans, lentils and tofu all count.",
      "This week spreads protein across breakfast, lunch, dinner and snacks, which is easier on your appetite than one huge portion at dinner.",
    ],
    filter: {},
    prefer: [
      "greek-yogurt-parfait", "masala-omelette-toast", "tofu-scramble-spinach", "salmon-rice-miso-breakfast", "shakshuka",
      "chicken-burrito-bowl", "tuna-nicoise", "chicken-pho", "tofu-bibimbap", "fish-tacos", "egg-curry-rice", "chickpea-quinoa-salad",
      "chicken-tikka-rice", "chicken-quinoa-roast-veg", "beef-bean-chili", "miso-glazed-cod", "lamb-kofta-tabbouleh", "stew-rice-chicken", "baked-salmon-sweet-potato",
      "edamame-snack", "boiled-eggs", "cottage-cheese-pineapple", "yogurt-honey",
    ],
    sections: [
      {
        heading: "How much protein do you need?",
        paragraphs: [
          "The minimum for healthy adults is about 0.8 g per kilogram of body weight a day. Many people aim higher: around 1.2–1.6 g/kg for general health and weight loss, and 1.6–2.2 g/kg when building muscle. Our protein calculator works this out for you, using a reference weight if your BMI is above 30 so the number isn't inflated.",
        ],
      },
      {
        heading: "Easy ways to add protein",
        bullets: [
          "Swap regular yogurt for Greek-style yogurt.",
          "Add eggs or tofu to breakfast instead of having toast alone.",
          "Make beans or lentils part of lunch: soups, salads, wraps.",
          "Keep high-protein snacks ready: boiled eggs, edamame, cottage cheese.",
        ],
      },
      {
        heading: "When to be careful",
        paragraphs: [
          "If you have kidney disease or reduced kidney function, protein limits should come from your doctor or dietitian, not a general plan. When you tell us about a medical condition, our targets use a conservative protein range.",
        ],
      },
    ],
    faq: [
      { q: "Is a high-protein diet safe?", a: "For healthy adults, protein intakes up to about 2 g/kg a day are widely used. People with kidney disease should follow medical advice." },
      { q: "Can vegetarians eat high-protein?", a: "Yes: eggs, dairy, beans, lentils, chickpeas and tofu make it straightforward. See our vegetarian meal plan." },
      { q: "Should I use protein powder?", a: "It's optional. Food sources also bring fibre, vitamins and minerals, so start there." },
    ],
  },
  {
    slug: "vegetarian",
    title: "Vegetarian meal plan",
    metaTitle: "7-Day Vegetarian Meal Plan (Balanced, Protein-Rich)",
    description:
      "A balanced 7-day vegetarian meal plan with plenty of protein from eggs, dairy, beans and lentils, plus nutrients to watch.",
    label: "Vegetarian",
    intro: [
      "A well-planned vegetarian diet can meet all your nutritional needs. The key is making sure protein, iron and vitamin B12 show up regularly through eggs, dairy, beans, lentils, whole grains and leafy greens.",
      "This example week draws on dishes from India, the Middle East, Mexico, Nigeria and the Mediterranean, where meat-free cooking is part of everyday food.",
    ],
    filter: { pattern: "vegetarian" },
    prefer: ["moi-moi", "shakshuka", "masala-omelette-toast", "greek-yogurt-parfait", "plantain-frittata", "chana-masala-rice", "rajma-chawal", "red-lentil-dal", "aloo-gobi-yogurt", "bean-cheese-stuffed-peppers", "mushroom-spinach-pasta", "vegetable-chickpea-tagine"],
    sections: [
      {
        heading: "Nutrients to keep an eye on",
        bullets: [
          "Protein: include eggs, dairy, beans, lentils, chickpeas or tofu at most meals.",
          "Iron: beans, lentils, leafy greens and fortified cereals. Pairing them with vitamin C (tomatoes, peppers, citrus) helps absorption.",
          "Vitamin B12: found in eggs and dairy. If you eat little of either, a supplement or fortified foods are worth considering.",
          "Omega-3 fats: walnuts, chia seeds and flax provide a plant form; some people also choose an algae-based supplement.",
        ],
      },
      {
        heading: "Building a satisfying vegetarian plate",
        paragraphs: [
          "Combine a protein (beans, eggs, dairy, tofu), a whole grain or starchy food (rice, bread, potatoes, yam), and plenty of vegetables. Spices, herbs, citrus and a little good oil do the rest. Many of the world's most loved dishes, like dal, chana masala and moi moi, are naturally vegetarian.",
        ],
      },
    ],
    faq: [
      { q: "Do I need to combine proteins at every meal?", a: "No. Eating a variety of protein foods over the day is enough for your body to get all the amino acids it needs." },
      { q: "Is a vegetarian diet good for weight loss?", a: "It can be, if portions match your needs. Our planner sizes vegetarian meals to your calorie target like any other plan." },
    ],
  },
  {
    slug: "vegan",
    title: "Vegan meal plan",
    metaTitle: "7-Day Vegan Meal Plan (With Nutrients to Watch)",
    description:
      "A 7-day vegan meal plan with tofu, beans, lentils and whole grains, and practical advice on B12, iron, calcium and omega-3.",
    label: "Vegan",
    intro: [
      "A vegan diet can be healthy at every stage of adult life with a bit of planning. Beans, lentils, chickpeas, tofu, whole grains, nuts and seeds provide the protein; a few nutrients need deliberate attention.",
      "Every recipe in this week is fully plant-based, and you can tell the planner about any allergies too, such as soy or nuts.",
    ],
    filter: { pattern: "vegan" },
    prefer: ["overnight-oats-berries", "tofu-scramble-spinach", "ful-medames", "coconut-chia-mango", "ginger-congee-tofu", "chickpea-quinoa-salad", "chana-masala-rice", "beans-and-plantain", "tofu-bibimbap", "black-bean-soup", "thai-coconut-curry-tofu", "lentil-bolognese", "black-bean-feijoada", "sweet-potato-spinach-curry"],
    sections: [
      {
        heading: "Nutrients vegans should plan for",
        bullets: [
          "Vitamin B12: there's no reliable plant source, so take a B12 supplement or eat fortified foods regularly. This is the one non-negotiable.",
          "Calcium: fortified plant milks and yogurts, calcium-set tofu, and greens like kale and collards.",
          "Iron and zinc: beans, lentils, whole grains, seeds. Add vitamin C-rich foods to meals to boost iron absorption.",
          "Iodine: seaweed in small amounts or iodised salt, depending on where you live.",
          "Omega-3: chia, flax and walnuts; an algae-based supplement is an option.",
        ],
      },
      {
        heading: "Getting enough protein",
        paragraphs: [
          "Aim for a protein food at each meal: tofu scramble at breakfast, a bean or lentil dish at lunch, and tofu or chickpeas at dinner, with edamame or hummus as snacks. Variety over the day matters more than combining foods in one meal.",
        ],
      },
    ],
    faq: [
      { q: "Is soy safe to eat regularly?", a: "For most people, yes. Tofu, edamame and soy milk are good protein sources. If you're allergic to soy, the planner will leave it out." },
      { q: "Can a vegan diet be high in protein?", a: "Yes. Lentils, chickpeas, beans, tofu and edamame make it very achievable without supplements." },
    ],
  },
  {
    slug: "budget-friendly",
    title: "Budget-friendly healthy meal plan",
    metaTitle: "Cheap Healthy Meal Plan: 7 Days on a Budget",
    description:
      "A low-cost 7-day healthy meal plan built on beans, lentils, eggs, rice, oats and seasonal vegetables, with tips that work in any country.",
    label: "Budget friendly",
    intro: [
      "Eating well doesn't need expensive ingredients. Some of the most nutritious foods are also the cheapest almost everywhere: beans, lentils, eggs, oats, rice, cabbage, carrots, onions, bananas and canned tomatoes.",
      "Every recipe in this example week is in our lowest cost tier. When you set a budget in your profile, the planner favours these recipes for you.",
    ],
    filter: { maxCostTier: 1 },
    prefer: ["overnight-oats-berries", "moi-moi", "yam-egg-sauce", "banana-peanut-butter-toast", "red-lentil-dal", "beans-and-plantain", "black-bean-soup", "egg-fried-rice", "rajma-chawal", "chana-masala-rice", "lentil-bolognese", "ugali-sukuma-beans", "black-bean-feijoada"],
    sections: [
      {
        heading: "Ways to spend less and eat better",
        bullets: [
          "Build meals around dried or canned beans and lentils; they're among the cheapest proteins anywhere.",
          "Cook once, eat twice: make a big pot of dal, chili or stew and use it for lunches.",
          "Frozen and canned vegetables are just as nutritious and cut waste.",
          "Buy what's in season and local; it's usually cheaper and tastier.",
          "Use your shopping list. Our lists combine ingredients across the week so you buy exactly what you need.",
        ],
      },
      {
        heading: "Cheap protein, compared",
        paragraphs: [
          "Per gram of protein, beans, lentils, eggs, peanuts and canned fish are usually far cheaper than fresh meat. Mixing them through the week keeps costs down without sacrificing protein.",
        ],
      },
    ],
    faq: [
      { q: "Can I set a budget in my currency?", a: "Yes. Choose your currency in your profile; the planner then favours lower-cost recipes." },
      { q: "Is canned food healthy?", a: "Canned beans, tomatoes and fish are nutritious staples. Rinse canned beans to reduce salt, and choose fish canned in water or olive oil." },
    ],
  },
  {
    slug: "mediterranean",
    title: "Mediterranean diet meal plan",
    metaTitle: "7-Day Mediterranean Diet Meal Plan",
    description:
      "A 7-day Mediterranean diet meal plan with olive oil, beans, fish, vegetables and whole grains, and what the eating pattern involves.",
    label: "Mediterranean",
    intro: [
      "The Mediterranean way of eating, based on vegetables, beans, whole grains, fish, olive oil, nuts and fruit, is one of the most studied eating patterns, and it's flexible enough to suit most tastes.",
      "This example week brings together dishes from Greece, Italy, Spain, Morocco, Egypt and the Middle East.",
    ],
    filter: {},
    prefer: ["shakshuka", "ful-medames", "greek-yogurt-parfait", "chickpea-quinoa-salad", "tuna-nicoise", "chickpea-hummus-wrap", "caprese-sandwich", "vegetable-chickpea-tagine", "lentil-bolognese", "shrimp-paella", "chicken-quinoa-roast-veg", "lamb-kofta-tabbouleh", "mushroom-spinach-pasta", "baked-salmon-sweet-potato", "hummus-carrots", "almonds-handful", "yogurt-honey", "orange-snack"],
    sections: [
      {
        heading: "The pattern in practice",
        bullets: [
          "Vegetables, fruit, beans and whole grains every day.",
          "Olive oil as the main cooking fat.",
          "Fish or seafood about twice a week; poultry, eggs and dairy in moderation.",
          "Red meat and sweets occasionally rather than daily.",
          "Herbs, garlic, lemon and spices for flavour.",
        ],
      },
      {
        heading: "It's about the whole pattern",
        paragraphs: [
          "No single food makes a diet Mediterranean. It's the combination of plenty of plants, healthy fats and less processed food, plus shared meals and regular activity, that people associate with it.",
        ],
      },
    ],
    faq: [
      { q: "Can I follow a Mediterranean diet if I don't eat fish?", a: "Yes. Beans, lentils, nuts and eggs cover protein. Choose pescatarian or vegetarian in your profile and the planner adjusts." },
      { q: "Is olive oil fattening?", a: "Olive oil is calorie-dense, so measure it, but it's a healthy fat and a core part of this pattern." },
    ],
  },
  {
    slug: "nigerian",
    title: "Healthy Nigerian meal plan",
    metaTitle: "Healthy Nigerian Meal Plan: 7 Days of Balanced Naija Food",
    description:
      "A balanced 7-day Nigerian meal plan with moi moi, beans and plantain, jollof, efo riro and okra soup, plus tips for healthier portions.",
    label: "Nigerian",
    intro: [
      "Nigerian food is full of nutritious staples: beans, leafy vegetables, peppers, fish, yam and plantain. Eating healthily doesn't mean giving it up. It usually means adjusting portions and cooking methods.",
      "This example week is all Nigerian favourites, from moi moi and yam with egg sauce to efo riro and jollof. Tell the planner you like Nigerian food and it will feature these dishes more often in your personal plan.",
    ],
    filter: { cuisines: ["Nigerian", "West African"] },
    prefer: ["moi-moi", "yam-egg-sauce", "plantain-frittata", "beans-and-plantain", "jollof-rice-chicken", "efo-riro-fish-rice", "okra-soup-fish-yam", "stew-rice-chicken", "groundnuts-banana", "orange-snack"],
    sections: [
      {
        heading: "Small changes that make a big difference",
        bullets: [
          "Go generous on soups and vegetables (efo, okra, ugwu) and moderate on swallow and rice portions.",
          "Measure the oil in stews. Palm and vegetable oil add up quickly; a few spoons go a long way.",
          "Choose fish, beans and chicken often, and grill, steam or boil more than you fry.",
          "Enjoy plantain baked, boiled or lightly pan-fried rather than deep-fried every time.",
          "Beans (ewa, moi moi, akara made with less oil) are an affordable, high-fibre protein. Make them a regular.",
        ],
      },
      {
        heading: "Portions for your goals",
        paragraphs: [
          "Because traditional dishes are often served in large portions, sizing them is where a plan helps most. When you sign up, we calculate your daily needs and scale each meal so you can keep eating jollof, stew and swallow, in amounts that fit your goals.",
        ],
      },
    ],
    faq: [
      { q: "Can I lose weight eating Nigerian food?", a: "Yes. Weight change depends on overall calories, not cuisine. Keeping soups vegetable-rich, measuring oil and sizing starchy portions makes it very achievable." },
      { q: "Is jollof rice healthy?", a: "It can be part of a healthy diet. Use a measured amount of oil, add vegetables and protein, and keep the rice portion in line with your needs." },
      { q: "Will you add more Nigerian dishes?", a: "Yes, we're expanding regional recipes. Tell us which dishes you'd like to see." },
    ],
  },
  {
    slug: "indian",
    title: "Healthy Indian meal plan",
    metaTitle: "Healthy Indian Meal Plan: 7 Days (Vegetarian-Friendly)",
    description:
      "A 7-day Indian meal plan with dal, chana masala, rajma, aloo gobi and tikka, mostly vegetarian, with tips for balanced plates.",
    label: "Indian",
    intro: [
      "Indian home cooking is built on dal, beans, vegetables, yogurt and spices, which makes it a great fit for healthy eating. Many classic dishes are naturally vegetarian and rich in fibre and plant protein.",
      "This week features dal, chana masala, rajma chawal, aloo gobi and egg curry, with one chicken tikka dinner. Choose vegetarian in your profile and the planner will keep every meal meat-free.",
    ],
    filter: { cuisines: ["Indian"] },
    prefer: ["masala-omelette-toast", "overnight-oats-berries", "red-lentil-dal", "chana-masala-rice", "rajma-chawal", "aloo-gobi-yogurt", "egg-curry-rice", "sweet-potato-spinach-curry", "chicken-tikka-rice", "roasted-chickpeas", "yogurt-honey"],
    sections: [
      {
        heading: "Building a balanced Indian plate",
        bullets: [
          "Make dal, beans or chickpeas the centre of the meal for protein and fibre.",
          "Add a vegetable sabzi, and serve rice or roti in a portion that matches your needs.",
          "Use a measured amount of oil or ghee for tadka; most of the flavour comes from the spices.",
          "Yogurt or raita adds protein and calcium.",
        ],
      },
      {
        heading: "A note on heart health",
        paragraphs: [
          "People of South Asian heritage can face higher health risks at a lower BMI. Some guidelines use lower BMI thresholds for South Asian adults, so regular check-ups with your doctor are worthwhile.",
        ],
      },
    ],
    faq: [
      { q: "Is this plan vegetarian?", a: "Mostly. One dinner includes chicken. Choose vegetarian or vegan in your profile and every meal in your plan will match." },
      { q: "Is white rice OK?", a: "Yes, in portions that fit your needs. Pairing it with dal and vegetables makes a balanced meal; brown rice adds extra fibre if you enjoy it." },
    ],
  },
  {
    slug: "american",
    title: "Healthy American meal plan",
    metaTitle: "Healthy 7-Day Meal Plan with American Favorites",
    description:
      "A balanced 7-day meal plan with American favorites like chili, stuffed peppers, burrito bowls and peanut butter toast, made healthier.",
    label: "American",
    intro: [
      "Healthy eating doesn't mean giving up familiar food. Chili, burrito bowls, stuffed peppers, oatmeal and peanut butter toast can all fit a balanced week with smart swaps: more beans and vegetables, leaner meat and whole grains.",
      "This example week mixes American classics with a few dishes from other cuisines for variety.",
    ],
    filter: { cuisines: ["American", "Mexican"] },
    prefer: ["overnight-oats-berries", "banana-peanut-butter-toast", "breakfast-tacos-black-beans", "chicken-burrito-bowl", "fish-tacos", "tuna-nicoise", "beef-bean-chili", "bean-cheese-stuffed-peppers", "baked-salmon-sweet-potato", "chicken-quinoa-roast-veg", "apple-peanut-butter", "boiled-eggs"],
    sections: [
      {
        heading: "Easy upgrades to everyday meals",
        bullets: [
          "Add beans to chili and burrito bowls for extra fiber and protein.",
          "Choose lean ground beef (90% or leaner) or swap half for beans.",
          "Use brown rice or whole-grain bread when you can.",
          "Fill half your plate with vegetables, including at breakfast.",
          "Keep portions of cheese and sauces measured rather than free-poured.",
        ],
      },
      {
        heading: "Planning helps the most",
        paragraphs: [
          "Busy weeks are when takeout creeps in. Having a plan and a shopping list ready on Sunday makes it far easier to cook. Our planner builds both, sized to your calorie needs.",
        ],
      },
    ],
    faq: [
      { q: "Can I use imperial measurements?", a: "Yes. Choose imperial in your profile and weights appear in pounds and ounces." },
      { q: "Is peanut butter healthy?", a: "In measured amounts, yes. It's rich in healthy fats and some protein, but it's calorie-dense, so a tablespoon or two is a typical portion." },
    ],
  },
];

export const MEAL_PLAN_BY_SLUG = new Map(MEAL_PLAN_PAGES.map((p) => [p.slug, p]));
