// Meal library. Nutrition values are per standard serving (approximate).
// diet: the most restrictive eating style the meal suits (vegan < vegetarian < pescatarian < omnivore).
// tags: allergens/ingredients a user may want to avoid.
window.MEALS = [
  // Breakfast
  { id: 'overnight-oats', type: 'breakfast', name: 'Overnight oats with berries', cuisine: 'International', kcal: 350, p: 12, c: 55, f: 9, diet: 'vegan', tags: ['gluten'], ingredients: ['Rolled oats', 'Plant milk', 'Mixed berries', 'Chia seeds'] },
  { id: 'masala-omelette', type: 'breakfast', name: 'Masala omelette with toast', cuisine: 'Indian', kcal: 380, p: 22, c: 28, f: 19, diet: 'vegetarian', tags: ['gluten'], ingredients: ['Eggs', 'Onion', 'Tomatoes', 'Green chili', 'Whole-grain bread'] },
  { id: 'yogurt-parfait', type: 'breakfast', name: 'Greek yogurt parfait', cuisine: 'Greek', kcal: 330, p: 20, c: 40, f: 10, diet: 'vegetarian', tags: ['dairy', 'nuts'], ingredients: ['Greek yogurt', 'Granola', 'Honey', 'Walnuts'] },
  { id: 'shakshuka', type: 'breakfast', name: 'Shakshuka', cuisine: 'Middle Eastern', kcal: 360, p: 20, c: 22, f: 21, diet: 'vegetarian', tags: [], ingredients: ['Eggs', 'Tomatoes', 'Bell pepper', 'Onion', 'Cumin'] },
  { id: 'congee', type: 'breakfast', name: 'Ginger & scallion congee', cuisine: 'Chinese', kcal: 300, p: 8, c: 58, f: 4, diet: 'vegan', tags: [], ingredients: ['Rice', 'Fresh ginger', 'Scallions', 'Tamari'] },
  { id: 'tofu-scramble', type: 'breakfast', name: 'Tofu scramble with spinach', cuisine: 'International', kcal: 320, p: 22, c: 14, f: 19, diet: 'vegan', tags: [], ingredients: ['Firm tofu', 'Spinach', 'Turmeric', 'Onion'] },
  { id: 'avocado-toast', type: 'breakfast', name: 'Avocado toast with egg', cuisine: 'International', kcal: 390, p: 16, c: 32, f: 22, diet: 'vegetarian', tags: ['gluten'], ingredients: ['Whole-grain bread', 'Avocado', 'Eggs', 'Lemon'] },
  { id: 'japanese-breakfast', type: 'breakfast', name: 'Salmon, rice & miso soup', cuisine: 'Japanese', kcal: 450, p: 28, c: 50, f: 14, diet: 'pescatarian', tags: [], ingredients: ['Salmon fillet', 'Rice', 'Miso paste', 'Nori'] },
  { id: 'ful-medames', type: 'breakfast', name: 'Ful medames', cuisine: 'Egyptian', kcal: 340, p: 17, c: 45, f: 10, diet: 'vegan', tags: [], ingredients: ['Fava beans', 'Olive oil', 'Lemon', 'Garlic', 'Cumin'] },
  { id: 'chia-mango', type: 'breakfast', name: 'Coconut chia pudding with mango', cuisine: 'Southeast Asian', kcal: 310, p: 8, c: 38, f: 15, diet: 'vegan', tags: [], ingredients: ['Chia seeds', 'Coconut milk', 'Mango'] },
  { id: 'chilaquiles', type: 'breakfast', name: 'Baked chilaquiles with egg', cuisine: 'Mexican', kcal: 420, p: 20, c: 42, f: 19, diet: 'vegetarian', tags: [], ingredients: ['Corn tortillas', 'Salsa', 'Eggs', 'Black beans', 'Onion'] },

  // Lunch
  { id: 'chickpea-quinoa', type: 'lunch', name: 'Chickpea & quinoa salad', cuisine: 'Mediterranean', kcal: 480, p: 18, c: 62, f: 17, diet: 'vegan', tags: [], ingredients: ['Quinoa', 'Chickpeas', 'Cucumber', 'Tomatoes', 'Olive oil', 'Lemon'] },
  { id: 'burrito-bowl', type: 'lunch', name: 'Chicken burrito bowl', cuisine: 'Mexican', kcal: 560, p: 40, c: 60, f: 16, diet: 'omnivore', tags: [], ingredients: ['Chicken breast', 'Brown rice', 'Black beans', 'Salsa', 'Lettuce'] },
  { id: 'dal', type: 'lunch', name: 'Red lentil dal with rice', cuisine: 'Indian', kcal: 520, p: 22, c: 80, f: 11, diet: 'vegan', tags: [], ingredients: ['Red lentils', 'Basmati rice', 'Tomatoes', 'Onion', 'Garam masala'] },
  { id: 'nicoise', type: 'lunch', name: 'Tuna niçoise salad', cuisine: 'French', kcal: 450, p: 32, c: 28, f: 22, diet: 'pescatarian', tags: [], ingredients: ['Tuna', 'Eggs', 'Green beans', 'Potatoes', 'Olives'] },
  { id: 'pho', type: 'lunch', name: 'Chicken pho', cuisine: 'Vietnamese', kcal: 500, p: 35, c: 62, f: 10, diet: 'omnivore', tags: [], ingredients: ['Chicken breast', 'Rice noodles', 'Bean sprouts', 'Fresh herbs', 'Fresh ginger'] },
  { id: 'falafel-wrap', type: 'lunch', name: 'Falafel wrap with hummus', cuisine: 'Middle Eastern', kcal: 540, p: 20, c: 66, f: 21, diet: 'vegan', tags: ['gluten'], ingredients: ['Falafel', 'Whole-wheat wrap', 'Hummus', 'Lettuce', 'Tomatoes'] },
  { id: 'bibimbap', type: 'lunch', name: 'Tofu bibimbap', cuisine: 'Korean', kcal: 520, p: 22, c: 72, f: 15, diet: 'vegan', tags: ['gluten'], ingredients: ['Rice', 'Firm tofu', 'Spinach', 'Carrots', 'Gochujang'] },
  { id: 'caprese-sandwich', type: 'lunch', name: 'Caprese sandwich', cuisine: 'Italian', kcal: 470, p: 22, c: 48, f: 21, diet: 'vegetarian', tags: ['dairy', 'gluten'], ingredients: ['Whole-grain bread', 'Mozzarella', 'Tomatoes', 'Fresh basil'] },
  { id: 'black-bean-soup', type: 'lunch', name: 'Black bean soup', cuisine: 'Latin American', kcal: 410, p: 20, c: 62, f: 8, diet: 'vegan', tags: [], ingredients: ['Black beans', 'Onion', 'Bell pepper', 'Cumin', 'Lime'] },
  { id: 'fish-tacos', type: 'lunch', name: 'Grilled fish tacos', cuisine: 'Mexican', kcal: 480, p: 30, c: 48, f: 17, diet: 'pescatarian', tags: [], ingredients: ['White fish fillet', 'Corn tortillas', 'Cabbage', 'Lime', 'Avocado'] },
  { id: 'beef-stir-fry', type: 'lunch', name: 'Beef & vegetable stir-fry', cuisine: 'Chinese', kcal: 520, p: 36, c: 45, f: 20, diet: 'omnivore', tags: ['beef', 'gluten'], ingredients: ['Lean beef', 'Broccoli', 'Bell pepper', 'Soy sauce', 'Rice'] },

  // Dinner
  { id: 'baked-salmon', type: 'dinner', name: 'Baked salmon, sweet potato & broccoli', cuisine: 'International', kcal: 560, p: 38, c: 45, f: 24, diet: 'pescatarian', tags: [], ingredients: ['Salmon fillet', 'Sweet potatoes', 'Broccoli', 'Olive oil'] },
  { id: 'chicken-tikka', type: 'dinner', name: 'Chicken tikka with salad & rice', cuisine: 'Indian', kcal: 540, p: 42, c: 45, f: 18, diet: 'omnivore', tags: ['dairy'], ingredients: ['Chicken breast', 'Plain yogurt', 'Tikka spices', 'Basmati rice', 'Cucumber'] },
  { id: 'tagine', type: 'dinner', name: 'Vegetable & chickpea tagine with couscous', cuisine: 'Moroccan', kcal: 540, p: 18, c: 85, f: 13, diet: 'vegan', tags: ['gluten'], ingredients: ['Chickpeas', 'Couscous', 'Carrots', 'Zucchini', 'Ras el hanout'] },
  { id: 'lentil-bolognese', type: 'dinner', name: 'Spaghetti with lentil bolognese', cuisine: 'Italian', kcal: 580, p: 26, c: 88, f: 12, diet: 'vegan', tags: ['gluten'], ingredients: ['Whole-wheat spaghetti', 'Brown lentils', 'Tomato passata', 'Onion', 'Garlic'] },
  { id: 'green-curry', type: 'dinner', name: 'Thai green curry with tofu', cuisine: 'Thai', kcal: 600, p: 20, c: 70, f: 26, diet: 'vegan', tags: [], ingredients: ['Firm tofu', 'Green curry paste', 'Coconut milk', 'Jasmine rice', 'Green beans'] },
  { id: 'chicken-quinoa', type: 'dinner', name: 'Grilled chicken, quinoa & roasted vegetables', cuisine: 'International', kcal: 540, p: 44, c: 48, f: 16, diet: 'omnivore', tags: [], ingredients: ['Chicken breast', 'Quinoa', 'Zucchini', 'Bell pepper', 'Olive oil'] },
  { id: 'jollof', type: 'dinner', name: 'Jollof rice with grilled chicken', cuisine: 'West African', kcal: 610, p: 38, c: 75, f: 16, diet: 'omnivore', tags: [], ingredients: ['Chicken thighs', 'Long-grain rice', 'Tomatoes', 'Bell pepper', 'Scotch bonnet'] },
  { id: 'paella', type: 'dinner', name: 'Shrimp & vegetable paella', cuisine: 'Spanish', kcal: 560, p: 32, c: 70, f: 15, diet: 'pescatarian', tags: [], ingredients: ['Shrimp', 'Paella rice', 'Peas', 'Bell pepper', 'Saffron'] },
  { id: 'stuffed-peppers', type: 'dinner', name: 'Bean & cheese stuffed peppers', cuisine: 'American', kcal: 480, p: 22, c: 55, f: 18, diet: 'vegetarian', tags: ['dairy'], ingredients: ['Bell pepper', 'Kidney beans', 'Brown rice', 'Cheddar', 'Tomatoes'] },
  { id: 'lamb-kofta', type: 'dinner', name: 'Lamb kofta with tabbouleh', cuisine: 'Middle Eastern', kcal: 590, p: 34, c: 40, f: 32, diet: 'omnivore', tags: ['gluten'], ingredients: ['Lean ground lamb', 'Bulgur wheat', 'Parsley', 'Tomatoes', 'Lemon'] },
  { id: 'pork-tenderloin', type: 'dinner', name: 'Pork tenderloin with apples & green beans', cuisine: 'European', kcal: 480, p: 40, c: 30, f: 20, diet: 'omnivore', tags: ['pork'], ingredients: ['Pork tenderloin', 'Apples', 'Green beans', 'Potatoes'] },
  { id: 'miso-cod', type: 'dinner', name: 'Miso-glazed cod with bok choy', cuisine: 'Japanese', kcal: 500, p: 34, c: 58, f: 12, diet: 'pescatarian', tags: [], ingredients: ['Cod fillet', 'Miso paste', 'Bok choy', 'Rice'] },
  { id: 'risotto', type: 'dinner', name: 'Mushroom & spinach risotto', cuisine: 'Italian', kcal: 540, p: 16, c: 80, f: 17, diet: 'vegetarian', tags: ['dairy'], ingredients: ['Arborio rice', 'Mushrooms', 'Spinach', 'Parmesan', 'Vegetable stock'] },
  { id: 'beef-chili', type: 'dinner', name: 'Lean beef & bean chili', cuisine: 'American', kcal: 550, p: 40, c: 50, f: 18, diet: 'omnivore', tags: ['beef'], ingredients: ['Lean beef', 'Kidney beans', 'Tomatoes', 'Onion', 'Chili powder'] },
  { id: 'sweet-potato-curry', type: 'dinner', name: 'Sweet potato & spinach curry', cuisine: 'Indian', kcal: 520, p: 15, c: 78, f: 16, diet: 'vegan', tags: [], ingredients: ['Sweet potatoes', 'Spinach', 'Chickpeas', 'Coconut milk', 'Basmati rice'] },
  { id: 'feijoada-veg', type: 'dinner', name: 'Black bean feijoada with rice & greens', cuisine: 'Brazilian', kcal: 560, p: 22, c: 90, f: 11, diet: 'vegan', tags: [], ingredients: ['Black beans', 'Rice', 'Collard greens', 'Smoked paprika', 'Orange'] },

  // Snacks
  { id: 'apple-pb', type: 'snack', name: 'Apple with peanut butter', cuisine: 'International', kcal: 200, p: 5, c: 25, f: 9, diet: 'vegan', tags: ['nuts'], ingredients: ['Apples', 'Peanut butter'] },
  { id: 'hummus-carrots', type: 'snack', name: 'Hummus & carrot sticks', cuisine: 'Middle Eastern', kcal: 180, p: 6, c: 20, f: 8, diet: 'vegan', tags: [], ingredients: ['Hummus', 'Carrots'] },
  { id: 'yogurt-honey', type: 'snack', name: 'Greek yogurt with honey', cuisine: 'Greek', kcal: 160, p: 14, c: 18, f: 3, diet: 'vegetarian', tags: ['dairy'], ingredients: ['Greek yogurt', 'Honey'] },
  { id: 'mixed-nuts', type: 'snack', name: 'Handful of mixed nuts', cuisine: 'International', kcal: 190, p: 6, c: 7, f: 16, diet: 'vegan', tags: ['nuts'], ingredients: ['Mixed nuts'] },
  { id: 'banana', type: 'snack', name: 'Banana', cuisine: 'International', kcal: 105, p: 1, c: 27, f: 0, diet: 'vegan', tags: [], ingredients: ['Bananas'] },
  { id: 'edamame', type: 'snack', name: 'Steamed edamame', cuisine: 'Japanese', kcal: 190, p: 17, c: 14, f: 8, diet: 'vegan', tags: [], ingredients: ['Edamame'] },
  { id: 'boiled-eggs', type: 'snack', name: 'Two boiled eggs', cuisine: 'International', kcal: 155, p: 13, c: 1, f: 11, diet: 'vegetarian', tags: [], ingredients: ['Eggs'] },
  { id: 'rice-cakes', type: 'snack', name: 'Rice cakes with avocado', cuisine: 'International', kcal: 170, p: 3, c: 22, f: 9, diet: 'vegan', tags: [], ingredients: ['Rice cakes', 'Avocado'] },
  { id: 'cottage-pineapple', type: 'snack', name: 'Cottage cheese with pineapple', cuisine: 'International', kcal: 170, p: 14, c: 20, f: 3, diet: 'vegetarian', tags: ['dairy'], ingredients: ['Cottage cheese', 'Pineapple'] },
  { id: 'roasted-chickpeas', type: 'snack', name: 'Roasted chickpeas', cuisine: 'International', kcal: 170, p: 8, c: 25, f: 4, diet: 'vegan', tags: [], ingredients: ['Chickpeas', 'Paprika'] }
];
