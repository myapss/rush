/**
 * Curated ingredient list. Nutrition values are NOT stored here: the import
 * script (scripts/import-fdc.ts) looks each food up in the USDA FoodData
 * Central SR Legacy dataset by its exact description and copies the values
 * from there, recording the FDC ID as provenance.
 *
 * What this file does define (our own classification, reviewed by hand):
 * - allergens: EU 14 / US Big 9 groups. When unsure, we tag conservatively
 *   (e.g. coconut as tree nut; curry powder as mustard; oats as gluten,
 *   because of common cross-contamination).
 * - pattern: the most restrictive eating style the food fits.
 * - category: grocery aisle grouping.
 */
import type { Database } from "../src/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export type GroceryCategory =
  | "produce"
  | "meat_fish"
  | "dairy_eggs"
  | "grains_bakery"
  | "legumes_tofu"
  | "nuts_seeds"
  | "pantry"
  | "spices_herbs";

export interface CuratedFood {
  slug: string;
  name: string;
  /** Exact SR Legacy description. */
  fdc: string;
  category: GroceryCategory;
  pattern: Enums["dietary_pattern"];
  allergens?: Enums["allergen"][];
  restrictions?: Enums["food_restriction"][];
  aliases?: string[];
}

const V = "vegan" as const;
const VEG = "vegetarian" as const;
const PESC = "pescatarian" as const;
const OMNI = "omnivore" as const;

export const FOODS: CuratedFood[] = [
  // Grains and bakery
  { slug: "oats_dry", name: "Rolled oats", fdc: "Cereals, oats, regular and quick, not fortified, dry", category: "grains_bakery", pattern: V, allergens: ["gluten"], aliases: ["oatmeal", "porridge oats"] },
  { slug: "rice_white_cooked", name: "White rice (cooked)", fdc: "Rice, white, long-grain, regular, enriched, cooked", category: "grains_bakery", pattern: V, aliases: ["rice", "basmati", "jasmine rice"] },
  { slug: "rice_brown_cooked", name: "Brown rice (cooked)", fdc: "Rice, brown, long-grain, cooked", category: "grains_bakery", pattern: V },
  { slug: "quinoa_cooked", name: "Quinoa (cooked)", fdc: "Quinoa, cooked", category: "grains_bakery", pattern: V },
  { slug: "couscous_cooked", name: "Couscous (cooked)", fdc: "Couscous, cooked", category: "grains_bakery", pattern: V, allergens: ["gluten"] },
  { slug: "bulgur_cooked", name: "Bulgur wheat (cooked)", fdc: "Bulgur, cooked", category: "grains_bakery", pattern: V, allergens: ["gluten"] },
  { slug: "pasta_cooked", name: "Pasta (cooked)", fdc: "Pasta, cooked, enriched, without added salt", category: "grains_bakery", pattern: V, allergens: ["gluten"], aliases: ["spaghetti"] },
  { slug: "pasta_wholewheat_cooked", name: "Whole-wheat pasta (cooked)", fdc: "Pasta, whole-wheat, cooked", category: "grains_bakery", pattern: V, allergens: ["gluten"] },
  { slug: "rice_noodles_cooked", name: "Rice noodles (cooked)", fdc: "Rice noodles, cooked", category: "grains_bakery", pattern: V },
  { slug: "bread_wholewheat", name: "Whole-wheat bread", fdc: "Bread, whole-wheat, commercially prepared", category: "grains_bakery", pattern: V, allergens: ["gluten"] },
  { slug: "pita_wholewheat", name: "Whole-wheat pita", fdc: "Bread, pita, whole-wheat", category: "grains_bakery", pattern: V, allergens: ["gluten"] },
  { slug: "tortilla_corn", name: "Corn tortillas", fdc: "Tortillas, ready-to-bake or -fry, corn", category: "grains_bakery", pattern: V },
  { slug: "granola", name: "Granola", fdc: "Cereals ready-to-eat, granola, homemade", category: "grains_bakery", pattern: VEG, allergens: ["gluten", "tree_nut"] },
  { slug: "rice_cakes", name: "Brown rice cakes", fdc: "Snacks, rice cakes, brown rice, plain", category: "grains_bakery", pattern: V },
  { slug: "cornmeal", name: "Maize meal / cornmeal", fdc: "Cornmeal, whole-grain, yellow", category: "grains_bakery", pattern: V, aliases: ["ugali flour", "maize flour"] },

  // Legumes and tofu
  { slug: "lentils_cooked", name: "Lentils (cooked)", fdc: "Lentils, mature seeds, cooked, boiled, without salt", category: "legumes_tofu", pattern: V, aliases: ["dal", "red lentils"] },
  { slug: "chickpeas_cooked", name: "Chickpeas (cooked)", fdc: "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt", category: "legumes_tofu", pattern: V, aliases: ["garbanzo beans", "chana"] },
  { slug: "black_beans_cooked", name: "Black beans (cooked)", fdc: "Beans, black, mature seeds, cooked, boiled, without salt", category: "legumes_tofu", pattern: V },
  { slug: "kidney_beans_cooked", name: "Kidney beans (cooked)", fdc: "Beans, kidney, red, mature seeds, cooked, boiled, without salt", category: "legumes_tofu", pattern: V },
  { slug: "blackeyed_peas_cooked", name: "Black-eyed peas / cowpeas (cooked)", fdc: "Cowpeas, common (blackeyes, crowder, southern), mature seeds, cooked, boiled, without salt", category: "legumes_tofu", pattern: V, aliases: ["beans", "honey beans", "ewa"] },
  { slug: "fava_beans_cooked", name: "Fava beans (cooked)", fdc: "Broadbeans (fava beans), mature seeds, cooked, boiled, without salt", category: "legumes_tofu", pattern: V, aliases: ["ful"] },
  { slug: "tofu_firm", name: "Firm tofu", fdc: "Tofu, raw, firm, prepared with calcium sulfate", category: "legumes_tofu", pattern: V, allergens: ["soy"] },
  { slug: "edamame", name: "Edamame", fdc: "Edamame, frozen, prepared", category: "legumes_tofu", pattern: V, allergens: ["soy"] },
  { slug: "hummus", name: "Hummus", fdc: "Hummus, commercial", category: "legumes_tofu", pattern: V, allergens: ["sesame"] },

  // Meat and fish
  { slug: "chicken_breast_raw", name: "Chicken breast", fdc: "Chicken, broilers or fryers, breast, meat only, raw", category: "meat_fish", pattern: OMNI },
  { slug: "chicken_thigh_raw", name: "Chicken thighs (boneless)", fdc: "Chicken, broilers or fryers, thigh, meat only, raw", category: "meat_fish", pattern: OMNI },
  { slug: "beef_mince_lean_raw", name: "Lean ground beef (90%)", fdc: "Beef, ground, 90% lean meat / 10% fat, raw", category: "meat_fish", pattern: OMNI, restrictions: ["beef"], aliases: ["beef mince"] },
  { slug: "lamb_mince_raw", name: "Ground lamb", fdc: "Lamb, ground, raw", category: "meat_fish", pattern: OMNI, aliases: ["lamb mince"] },
  { slug: "pork_tenderloin_raw", name: "Pork tenderloin", fdc: "Pork, fresh, loin, tenderloin, separable lean only, raw", category: "meat_fish", pattern: OMNI, restrictions: ["pork"] },
  { slug: "salmon_raw", name: "Salmon fillet", fdc: "Fish, salmon, Atlantic, farmed, raw", category: "meat_fish", pattern: PESC, allergens: ["fish"] },
  { slug: "cod_raw", name: "Cod fillet", fdc: "Fish, cod, Atlantic, raw", category: "meat_fish", pattern: PESC, allergens: ["fish"], aliases: ["white fish"] },
  { slug: "tilapia_raw", name: "Tilapia fillet", fdc: "Fish, tilapia, raw", category: "meat_fish", pattern: PESC, allergens: ["fish"], aliases: ["white fish"] },
  { slug: "tuna_canned", name: "Canned tuna in water", fdc: "Fish, tuna, light, canned in water, drained solids", category: "meat_fish", pattern: PESC, allergens: ["fish"] },
  { slug: "sardines_canned", name: "Canned sardines in oil", fdc: "Fish, sardine, Atlantic, canned in oil, drained solids with bone", category: "meat_fish", pattern: PESC, allergens: ["fish"] },
  { slug: "shrimp_raw", name: "Shrimp / prawns", fdc: "Crustaceans, shrimp, raw", category: "meat_fish", pattern: PESC, allergens: ["shellfish"], aliases: ["prawns"] },

  // Dairy and eggs
  { slug: "egg", name: "Eggs", fdc: "Egg, whole, raw, fresh", category: "dairy_eggs", pattern: VEG, allergens: ["egg"] },
  { slug: "milk_whole", name: "Whole milk", fdc: "Milk, whole, 3.25% milkfat, with added vitamin D", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },
  { slug: "soy_milk", name: "Soy milk", fdc: "Soymilk, original and vanilla, unfortified", category: "dairy_eggs", pattern: V, allergens: ["soy"], aliases: ["plant milk"] },
  { slug: "greek_yogurt_nonfat", name: "Greek yogurt (plain, nonfat)", fdc: "Yogurt, Greek, plain, nonfat", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },
  { slug: "yogurt_plain_whole", name: "Plain yogurt", fdc: "Yogurt, plain, whole milk", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },
  { slug: "cheddar", name: "Cheddar cheese", fdc: "Cheese, cheddar", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },
  { slug: "feta", name: "Feta cheese", fdc: "Cheese, feta", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },
  { slug: "mozzarella", name: "Mozzarella", fdc: "Cheese, mozzarella, whole milk", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },
  { slug: "parmesan", name: "Parmesan (grated)", fdc: "Cheese, parmesan, grated", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },
  { slug: "cottage_cheese", name: "Cottage cheese (2%)", fdc: "Cheese, cottage, lowfat, 2% milkfat", category: "dairy_eggs", pattern: VEG, allergens: ["dairy"] },

  // Produce
  { slug: "spinach", name: "Spinach", fdc: "Spinach, raw", category: "produce", pattern: V },
  { slug: "kale", name: "Kale", fdc: "Kale, raw", category: "produce", pattern: V },
  { slug: "collards", name: "Collard greens", fdc: "Collards, raw", category: "produce", pattern: V, aliases: ["sukuma wiki", "greens"] },
  { slug: "tomato", name: "Tomatoes", fdc: "Tomatoes, red, ripe, raw, year round average", category: "produce", pattern: V },
  { slug: "tomato_canned", name: "Canned tomatoes", fdc: "Tomatoes, red, ripe, canned, packed in tomato juice", category: "pantry", pattern: V, aliases: ["chopped tomatoes"] },
  { slug: "tomato_paste", name: "Tomato paste", fdc: "Tomato products, canned, paste, without salt added", category: "pantry", pattern: V },
  { slug: "onion", name: "Onions", fdc: "Onions, raw", category: "produce", pattern: V },
  { slug: "scallion", name: "Spring onions", fdc: "Onions, spring or scallions (includes tops and bulb), raw", category: "produce", pattern: V, aliases: ["scallions", "green onions"] },
  { slug: "garlic", name: "Garlic", fdc: "Garlic, raw", category: "produce", pattern: V },
  { slug: "ginger", name: "Fresh ginger", fdc: "Ginger root, raw", category: "produce", pattern: V },
  { slug: "bell_pepper_red", name: "Red bell peppers", fdc: "Peppers, sweet, red, raw", category: "produce", pattern: V, aliases: ["capsicum", "tatashe"] },
  { slug: "chili_pepper", name: "Fresh chili peppers", fdc: "Peppers, hot chili, green, raw", category: "produce", pattern: V, aliases: ["scotch bonnet", "chilli"] },
  { slug: "carrot", name: "Carrots", fdc: "Carrots, raw", category: "produce", pattern: V },
  { slug: "broccoli", name: "Broccoli", fdc: "Broccoli, raw", category: "produce", pattern: V },
  { slug: "cauliflower", name: "Cauliflower", fdc: "Cauliflower, raw", category: "produce", pattern: V },
  { slug: "cabbage", name: "Cabbage", fdc: "Cabbage, raw", category: "produce", pattern: V },
  { slug: "bok_choy", name: "Bok choy", fdc: "Cabbage, chinese (pak-choi), raw", category: "produce", pattern: V, aliases: ["pak choi"] },
  { slug: "cucumber", name: "Cucumber", fdc: "Cucumber, with peel, raw", category: "produce", pattern: V },
  { slug: "lettuce_romaine", name: "Romaine lettuce", fdc: "Lettuce, cos or romaine, raw", category: "produce", pattern: V },
  { slug: "mushroom", name: "Mushrooms", fdc: "Mushrooms, white, raw", category: "produce", pattern: V },
  { slug: "zucchini", name: "Zucchini / courgette", fdc: "Squash, summer, zucchini, includes skin, raw", category: "produce", pattern: V, aliases: ["courgette"] },
  { slug: "eggplant", name: "Eggplant / aubergine", fdc: "Eggplant, raw", category: "produce", pattern: V, aliases: ["aubergine"] },
  { slug: "okra", name: "Okra", fdc: "Okra, raw", category: "produce", pattern: V },
  { slug: "green_beans", name: "Green beans", fdc: "Beans, snap, green, raw", category: "produce", pattern: V },
  { slug: "peas_green", name: "Green peas (frozen)", fdc: "Peas, green, frozen, unprepared", category: "produce", pattern: V },
  { slug: "bean_sprouts", name: "Bean sprouts", fdc: "Mung beans, mature seeds, sprouted, raw", category: "produce", pattern: V },
  { slug: "sweet_potato", name: "Sweet potatoes", fdc: "Sweet potato, raw, unprepared", category: "produce", pattern: V },
  { slug: "potato", name: "Potatoes", fdc: "Potatoes, flesh and skin, raw", category: "produce", pattern: V },
  { slug: "yam", name: "Yam", fdc: "Yam, raw", category: "produce", pattern: V },
  { slug: "plantain", name: "Ripe plantain", fdc: "Plantains, yellow, raw", category: "produce", pattern: V, aliases: ["dodo"] },
  { slug: "corn", name: "Sweetcorn", fdc: "Corn, sweet, yellow, raw", category: "produce", pattern: V },
  { slug: "avocado", name: "Avocado", fdc: "Avocados, raw, all commercial varieties", category: "produce", pattern: V },
  { slug: "banana", name: "Bananas", fdc: "Bananas, raw", category: "produce", pattern: V },
  { slug: "apple", name: "Apples", fdc: "Apples, raw, with skin", category: "produce", pattern: V },
  { slug: "blueberries", name: "Blueberries", fdc: "Blueberries, raw", category: "produce", pattern: V, aliases: ["berries"] },
  { slug: "strawberries", name: "Strawberries", fdc: "Strawberries, raw", category: "produce", pattern: V, aliases: ["berries"] },
  { slug: "mango", name: "Mango", fdc: "Mangos, raw", category: "produce", pattern: V },
  { slug: "orange", name: "Oranges", fdc: "Oranges, raw, all commercial varieties", category: "produce", pattern: V },
  { slug: "pineapple", name: "Pineapple", fdc: "Pineapple, raw, all varieties", category: "produce", pattern: V },
  { slug: "lemon_juice", name: "Lemon juice", fdc: "Lemon juice, raw", category: "produce", pattern: V, aliases: ["lemon"] },
  { slug: "lime_juice", name: "Lime juice", fdc: "Lime juice, raw", category: "produce", pattern: V, aliases: ["lime"] },
  { slug: "celery", name: "Celery", fdc: "Celery, raw", category: "produce", pattern: V, allergens: ["celery"] },
  { slug: "cilantro", name: "Fresh coriander / cilantro", fdc: "Coriander (cilantro) leaves, raw", category: "spices_herbs", pattern: V, aliases: ["coriander"] },
  { slug: "parsley", name: "Fresh parsley", fdc: "Parsley, fresh", category: "spices_herbs", pattern: V },
  { slug: "basil", name: "Fresh basil", fdc: "Basil, fresh", category: "spices_herbs", pattern: V },
  { slug: "raisins", name: "Raisins", fdc: "Raisins, seedless", category: "pantry", pattern: V },

  // Nuts and seeds
  { slug: "almonds", name: "Almonds", fdc: "Nuts, almonds", category: "nuts_seeds", pattern: V, allergens: ["tree_nut"] },
  { slug: "walnuts", name: "Walnuts", fdc: "Nuts, walnuts, english", category: "nuts_seeds", pattern: V, allergens: ["tree_nut"] },
  { slug: "peanuts", name: "Peanuts / groundnuts", fdc: "Peanuts, all types, raw", category: "nuts_seeds", pattern: V, allergens: ["peanut"], aliases: ["groundnuts"] },
  { slug: "peanut_butter", name: "Peanut butter", fdc: "Peanut butter, smooth style, without salt", category: "nuts_seeds", pattern: V, allergens: ["peanut"] },
  { slug: "chia", name: "Chia seeds", fdc: "Seeds, chia seeds, dried", category: "nuts_seeds", pattern: V },
  { slug: "sesame_seeds", name: "Sesame seeds", fdc: "Seeds, sesame seeds, whole, dried", category: "nuts_seeds", pattern: V, allergens: ["sesame"] },
  { slug: "coconut_milk", name: "Coconut milk", fdc: "Nuts, coconut milk, raw (liquid expressed from grated meat and water)", category: "pantry", pattern: V, allergens: ["tree_nut"] },

  // Pantry
  { slug: "olive_oil", name: "Olive oil", fdc: "Oil, olive, salad or cooking", category: "pantry", pattern: V },
  { slug: "vegetable_oil", name: "Vegetable oil", fdc: "Oil, canola", category: "pantry", pattern: V, aliases: ["canola oil", "cooking oil"] },
  { slug: "sesame_oil", name: "Sesame oil", fdc: "Oil, sesame, salad or cooking", category: "pantry", pattern: V, allergens: ["sesame"] },
  { slug: "soy_sauce", name: "Soy sauce", fdc: "Soy sauce made from soy and wheat (shoyu)", category: "pantry", pattern: V, allergens: ["soy", "gluten"] },
  { slug: "tamari", name: "Tamari (gluten-free soy sauce)", fdc: "Soy sauce made from soy (tamari)", category: "pantry", pattern: V, allergens: ["soy"] },
  { slug: "miso", name: "Miso paste", fdc: "Miso", category: "pantry", pattern: V, allergens: ["soy"] },
  { slug: "honey", name: "Honey", fdc: "Honey", category: "pantry", pattern: VEG },
  { slug: "salsa", name: "Tomato salsa", fdc: "Sauce, salsa, ready-to-serve", category: "pantry", pattern: V },
  { slug: "nori", name: "Nori seaweed", fdc: "Seaweed, laver, raw", category: "pantry", pattern: V },

  // Spices
  { slug: "cumin", name: "Ground cumin", fdc: "Spices, cumin seed", category: "spices_herbs", pattern: V },
  { slug: "turmeric", name: "Ground turmeric", fdc: "Spices, turmeric, ground", category: "spices_herbs", pattern: V },
  { slug: "paprika", name: "Paprika", fdc: "Spices, paprika", category: "spices_herbs", pattern: V },
  { slug: "curry_powder", name: "Curry powder", fdc: "Spices, curry powder", category: "spices_herbs", pattern: V, allergens: ["mustard"] },
  { slug: "cinnamon", name: "Ground cinnamon", fdc: "Spices, cinnamon, ground", category: "spices_herbs", pattern: V },
  { slug: "chili_powder", name: "Chili powder", fdc: "Spices, chili powder", category: "spices_herbs", pattern: V },
  { slug: "oregano", name: "Dried oregano", fdc: "Spices, oregano, dried", category: "spices_herbs", pattern: V },
  { slug: "black_pepper", name: "Black pepper", fdc: "Spices, pepper, black", category: "spices_herbs", pattern: V },
];
