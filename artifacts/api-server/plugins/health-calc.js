const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default [
  {
    command: 'bmi', aliases: ['bodymass','bmicalc'],
    category: 'health', description: 'Calculate your BMI', usage: '.bmi <weight kg> <height cm>',
    async handler(sock, msg, args, ctx) {
      const [weight, height] = args.map(Number);
      if (!weight || !height || height < 50 || weight < 1) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .bmi <weight in kg> <height in cm>\nExample: .bmi 70 175' }, { quoted: msg });
      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      let category, advice;
      if (bmi < 18.5) { category = '🔵 Underweight'; advice = 'Consider increasing calorie intake with nutritious foods.'; }
      else if (bmi < 25) { category = '🟢 Normal weight'; advice = 'Great! Maintain your healthy lifestyle.'; }
      else if (bmi < 30) { category = '🟡 Overweight'; advice = 'Consider increasing physical activity and watching your diet.'; }
      else { category = '🔴 Obese'; advice = 'Please consult a healthcare professional for personalized advice.'; }
      await sock.sendMessage(ctx.chatId, {
        text: `⚕️ *BMI Calculator*\n\n⚖️ Weight: ${weight} kg\n📏 Height: ${height} cm\n\n📊 BMI: *${bmi.toFixed(1)}*\n🏷️ Category: *${category}*\n\n💡 ${advice}\n\n⚠️ _BMI is a general guide, not a medical diagnosis._`
      }, { quoted: msg });
    }
  },
  {
    command: 'calories', aliases: ['calorie','tdee','caloriecalc'],
    category: 'health', description: 'Calculate daily calorie needs', usage: '.calories <weight> <height> <age> <gender> <activity>',
    async handler(sock, msg, args, ctx) {
      const [weightS, heightS, ageS, gender, activity] = args;
      const weight = parseFloat(weightS), height = parseFloat(heightS), age = parseFloat(ageS);
      if (!weight || !height || !age || !gender) {
        return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .calories <weight kg> <height cm> <age> <m/f> <activity 1-5>\n\nActivity levels:\n1 = Sedentary\n2 = Lightly active\n3 = Moderately active\n4 = Very active\n5 = Extra active\n\nExample: .calories 70 175 25 m 3' }, { quoted: msg });
      }
      let bmr;
      if (gender.toLowerCase() === 'm') bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      else bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      const multipliers = [1.2, 1.375, 1.55, 1.725, 1.9];
      const act = Math.min(5, Math.max(1, parseInt(activity) || 3));
      const tdee = Math.round(bmr * multipliers[act - 1]);
      await sock.sendMessage(ctx.chatId, {
        text: `🍽️ *Calorie Calculator (TDEE)*\n\n⚖️ Weight: ${weight}kg | 📏 Height: ${height}cm | 🎂 Age: ${age}\n\n🔥 *Daily Calories: ${tdee} kcal*\n\nFor your goal:\n🔽 Lose weight: *${tdee - 500} kcal/day*\n➡️ Maintain: *${tdee} kcal/day*\n🔼 Gain muscle: *${tdee + 300} kcal/day*\n\n⚠️ _Consult a nutritionist for personalized plans._`
      }, { quoted: msg });
    }
  },
  {
    command: 'macros', aliases: ['macrocalc','macronutrients'],
    category: 'health', description: 'Calculate macronutrient ratios', usage: '.macros <calories> <goal>',
    async handler(sock, msg, args, ctx) {
      const cals = parseInt(args[0]);
      const goal = (args[1] || 'maintain').toLowerCase();
      if (!cals || cals < 500) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .macros <daily calories> [goal]\nGoals: lose/maintain/gain\nExample: .macros 2000 lose' }, { quoted: msg });
      const ratios = {
        lose:     { p: 0.35, c: 0.35, f: 0.30, label: 'Fat Loss' },
        maintain: { p: 0.25, c: 0.45, f: 0.30, label: 'Maintenance' },
        gain:     { p: 0.30, c: 0.50, f: 0.20, label: 'Muscle Gain' },
      };
      const g = ratios[goal] || ratios.maintain;
      const protein = Math.round((cals * g.p) / 4);
      const carbs = Math.round((cals * g.c) / 4);
      const fat = Math.round((cals * g.f) / 9);
      await sock.sendMessage(ctx.chatId, {
        text: `🥗 *Macro Calculator — ${g.label}*\n\n📊 Total: *${cals} kcal/day*\n\n💪 Protein: *${protein}g* (${Math.round(g.p*100)}%)\n🍞 Carbs: *${carbs}g* (${Math.round(g.c*100)}%)\n🥑 Fats: *${fat}g* (${Math.round(g.f*100)}%)\n\n📌 Tips:\n• Protein: chicken, eggs, fish, legumes\n• Carbs: rice, oats, fruits, vegetables\n• Fats: avocado, nuts, olive oil`
      }, { quoted: msg });
    }
  },
  {
    command: 'idealweight', aliases: ['idealwt','targetweight'],
    category: 'health', description: 'Calculate ideal body weight', usage: '.idealweight <height cm> <gender m/f>',
    async handler(sock, msg, args, ctx) {
      const height = parseFloat(args[0]);
      const gender = (args[1] || 'm').toLowerCase();
      if (!height || height < 100) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .idealweight <height in cm> <m/f>\nExample: .idealweight 175 m' }, { quoted: msg });
      const heightIn = (height - 152.4) / 2.54;
      let idealLow, idealHigh;
      if (gender === 'm') { idealLow = Math.round(50 + 0.9 * heightIn * 2.205); idealHigh = idealLow + 9; }
      else { idealLow = Math.round(45.5 + 0.9 * heightIn * 2.205); idealHigh = idealLow + 9; }
      const deviation = Math.round(idealHigh - idealLow);
      await sock.sendMessage(ctx.chatId, {
        text: `⚖️ *Ideal Weight Calculator*\n\n📏 Height: ${height} cm\n🚻 Gender: ${gender === 'm' ? 'Male' : 'Female'}\n\n✅ Ideal weight range:\n*${Math.max(40, idealLow)} — ${Math.max(50, idealHigh)} kg*\n\n_Based on Devine Formula. BMI 18.5-24.9 range may differ._`
      }, { quoted: msg });
    }
  },
  {
    command: 'heartrate', aliases: ['maxhr','hrzone'],
    category: 'health', description: 'Calculate target heart rate zones', usage: '.heartrate <age>',
    async handler(sock, msg, args, ctx) {
      const age = parseInt(args[0]);
      if (!age || age < 5 || age > 120) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .heartrate <your age>\nExample: .heartrate 25' }, { quoted: msg });
      const maxHR = 220 - age;
      await sock.sendMessage(ctx.chatId, {
        text: `❤️ *Heart Rate Zones*\n\nAge: ${age} | Max HR: *${maxHR} bpm*\n\n💙 Warm-up (50-60%): ${Math.round(maxHR*0.5)}-${Math.round(maxHR*0.6)} bpm\n💚 Fat Burn (60-70%): ${Math.round(maxHR*0.6)}-${Math.round(maxHR*0.7)} bpm\n💛 Aerobic (70-80%): ${Math.round(maxHR*0.7)}-${Math.round(maxHR*0.8)} bpm\n🧡 Anaerobic (80-90%): ${Math.round(maxHR*0.8)}-${Math.round(maxHR*0.9)} bpm\n❤️ Max Effort (90-100%): ${Math.round(maxHR*0.9)}-${maxHR} bpm\n\n_Aim for 150 min/week of moderate cardio._`
      }, { quoted: msg });
    }
  },
  {
    command: 'burned', aliases: ['calorieburn','burnedcalories'],
    category: 'health', description: 'Calories burned by activity', usage: '.burned <activity> <minutes> <weight kg>',
    async handler(sock, msg, args, ctx) {
      const activities = {
        running:   9.8, cycling:   7.5, swimming:  8.3, walking:   3.5,
        jumping:   8.0, yoga:      3.0, dance:     6.5, boxing:    10.5,
        football:  8.0, basketball:7.5, tennis:    6.0, hiking:    6.3,
        weightlift:5.0, pilates:   3.5, rowing:    7.0, climbing:  8.5,
      };
      const activity = args[0]?.toLowerCase();
      const minutes = parseFloat(args[1]);
      const weight = parseFloat(args[2]) || 70;
      if (!activity || !minutes) {
        const acts = Object.keys(activities).join(', ');
        return sock.sendMessage(ctx.chatId, { text: `❌ Usage: .burned <activity> <minutes> [weight kg]\n\nActivities: ${acts}\n\nExample: .burned running 30 70` }, { quoted: msg });
      }
      const met = activities[activity] || 5;
      const cals = Math.round((met * weight * minutes) / 60);
      await sock.sendMessage(ctx.chatId, {
        text: `🔥 *Calories Burned*\n\n🏃 Activity: ${activity}\n⏱️ Duration: ${minutes} min\n⚖️ Weight: ${weight} kg\n\n💥 *Burned: ${cals} kcal*\n\n_Keep moving! Every calorie counts._ 💪`
      }, { quoted: msg });
    }
  },
  {
    command: 'waterintake', aliases: ['water','hydration','drinkwater'],
    category: 'health', description: 'Calculate daily water intake', usage: '.waterintake <weight kg>',
    async handler(sock, msg, args, ctx) {
      const weight = parseFloat(args[0]) || 70;
      const liters = (weight * 0.033).toFixed(1);
      const glasses = Math.round(liters / 0.25);
      await sock.sendMessage(ctx.chatId, {
        text: `💧 *Daily Water Intake*\n\n⚖️ Weight: ${weight} kg\n\n💧 *Recommended: ${liters} liters/day*\n🥛 That's about *${glasses} glasses* (250ml each)\n\nTips:\n• Drink a glass when you wake up 🌅\n• Carry a water bottle everywhere 🍶\n• Drink before meals for weight control 🍽️\n• Exercise? Add 500ml-1L extra! 🏃`
      }, { quoted: msg });
    }
  },
  {
    command: 'meditation', aliases: ['meditate','mindful'],
    category: 'health', description: 'Get a meditation exercise', usage: '.meditation',
    async handler(sock, msg, args, ctx) {
      const sessions = [
        { name: '4-7-8 Breathing', steps: '1. Inhale through nose for *4 seconds*\n2. Hold breath for *7 seconds*\n3. Exhale through mouth for *8 seconds*\n\n✅ Repeat 4 times. Perfect for sleep and anxiety!' },
        { name: 'Box Breathing', steps: '1. Inhale for *4 counts*\n2. Hold for *4 counts*\n3. Exhale for *4 counts*\n4. Hold empty for *4 counts*\n\n✅ Repeat 4-5 times. Used by Navy SEALs for focus!' },
        { name: 'Body Scan', steps: '1. Close your eyes and breathe deeply\n2. Starting from your toes, slowly scan upward\n3. Notice any tension and consciously relax each area\n4. Take 5-10 minutes, ending at the top of your head\n\n✅ Great for stress relief and sleep!' },
        { name: 'Mindful Breathing', steps: '1. Sit comfortably and close your eyes\n2. Focus only on your natural breath\n3. When your mind wanders, gently return focus\n4. Do this for *5-10 minutes* daily\n\n✅ Builds focus and reduces anxiety over time!' },
      ];
      const s = r(sessions);
      await sock.sendMessage(ctx.chatId, { text: `🧘 *${s.name}*\n\n${s.steps}\n\n_Consistency is key — even 5 minutes daily makes a difference!_ 🌟` }, { quoted: msg });
    }
  },
  {
    command: 'stretch', aliases: ['stretching','flexibility'],
    category: 'health', description: 'Get stretching exercise routine', usage: '.stretch',
    async handler(sock, msg, args, ctx) {
      const routines = [
        '🧘 *Morning Stretch Routine*\n\n1. Neck rolls — 30 sec\n2. Shoulder rolls — 30 sec\n3. Chest opener — 45 sec\n4. Hip flexor stretch — 60 sec each leg\n5. Hamstring stretch — 60 sec each leg\n6. Child\'s pose — 60 sec\n7. Cat-Cow — 10 reps\n\n✅ Total: ~10 minutes',
        '🏃 *Post-Workout Stretch*\n\n1. Quad stretch — 30 sec each\n2. Calf stretch — 30 sec each\n3. Hip flexor — 45 sec each\n4. Pigeon pose — 60 sec each\n5. Seated forward fold — 60 sec\n6. Supine twist — 45 sec each\n7. Cobra pose — 30 sec\n\n✅ Total: ~10 minutes',
        '💺 *Office/Desk Stretch*\n\n1. Neck side stretch — 15 sec each side\n2. Shoulder shrugs — 10 reps\n3. Wrist circles — 15 sec each\n4. Seated twist — 30 sec each side\n5. Ankle rotations — 10 each\n6. Stand up and walk every 30-45 min!\n\n✅ Total: ~5 minutes',
      ];
      await sock.sendMessage(ctx.chatId, { text: r(routines) }, { quoted: msg });
    }
  },
  {
    command: 'diettip', aliases: ['nutritiontip','foodtip'],
    category: 'health', description: 'Random nutrition/diet tip', usage: '.diettip',
    async handler(sock, msg, args, ctx) {
      const tips = [
        '🥗 *Eat the Rainbow*\nInclude colorful vegetables in every meal. Different colors = different vitamins and antioxidants!',
        '⏰ *Meal Timing Matters*\nTry not to eat large meals within 2-3 hours of bedtime. Your body is less efficient at digesting during sleep.',
        '🍽️ *Portion Control Trick*\nUse a smaller plate! Research shows we eat 20-30% less food with smaller plates without noticing.',
        '💧 *Drink Before Meals*\nDrinking 2 glasses of water 20-30 minutes before a meal can reduce calorie intake and aid digestion.',
        '🥦 *Vegetables First*\nEat your vegetables and protein before carbs. This helps control blood sugar spikes.',
        '🍎 *Snack Smart*\nChoose snacks with protein + fiber: apple + peanut butter, nuts + fruit, or Greek yogurt.',
        '🚫 *Avoid Liquid Calories*\nSugary drinks can add 300-500 extra calories without making you feel full. Water is always best!',
        '🔄 *Meal Prep Sundays*\nPrepping meals in advance makes healthy eating 10x easier during busy weekdays.',
        '🍳 *Protein at Breakfast*\nEating 25-30g of protein at breakfast reduces hunger and cravings throughout the day.',
      ];
      await sock.sendMessage(ctx.chatId, { text: `🥗 *Nutrition Tip*\n\n${r(tips)}` }, { quoted: msg });
    }
  },
  {
    command: 'mental', aliases: ['mentalhealth','selfcare'],
    category: 'health', description: 'Mental health tip or affirmation', usage: '.mental',
    async handler(sock, msg, args, ctx) {
      const tips = [
        '💆 *Practice Gratitude Daily*\nWrite down 3 things you\'re grateful for each morning. This shifts your mindset to abundance over lack.',
        '📵 *Digital Detox*\nTake 30-60 minutes each day away from all screens. Read, walk, or simply sit in silence.',
        '🌿 *Get Sunlight*\nAt least 15-30 minutes of morning sunlight boosts serotonin and regulates your sleep cycle.',
        '💬 *Talk About It*\nSharing your feelings with someone you trust doesn\'t make you weak — it makes you brave.',
        '🛌 *Sleep is Non-Negotiable*\nPoor sleep affects everything: mood, weight, focus, immunity. Aim for 7-9 hours consistently.',
        '🚶 *Walk for Your Mind*\nA 20-minute walk outdoors lowers cortisol and boosts mood as effectively as mild antidepressants.',
        '🎯 *Set Small Goals*\nBig dreams start with tiny steps. One small win each day builds unstoppable momentum.',
        '❤️ *You Are Enough*\nYou don\'t need to earn your worth. You are valuable simply by existing. Rest is productive.',
      ];
      const affirmations = [
        '✨ I am capable of handling whatever comes my way.',
        '💪 I grow stronger and wiser with every challenge.',
        '🌟 I deserve happiness, love, and peace of mind.',
        '🔥 I am enough, exactly as I am right now.',
        '🌈 Better days are always ahead of me.',
        '💖 I choose to focus on what I can control.',
      ];
      await sock.sendMessage(ctx.chatId, {
        text: `🧠 *Mental Health Corner*\n\n${r(tips)}\n\n💬 *Daily Affirmation:*\n"${r(affirmations)}"`
      }, { quoted: msg });
    }
  },
  {
    command: 'workout', aliases: ['exercise','gym'],
    category: 'health', description: 'Get a workout routine', usage: '.workout [beginner/intermediate/advanced]',
    async handler(sock, msg, args, ctx) {
      const level = (args[0] || 'beginner').toLowerCase();
      const workouts = {
        beginner: '🏋️ *Beginner Workout (No Equipment)*\n\n🔥 *Warm-up (5 min)*\nJumping jacks — 2 min\nArm circles — 1 min\nLeg swings — 2 min\n\n💪 *Main Workout*\nPush-ups: 3 × 8\nSquats: 3 × 12\nLunges: 3 × 10 each\nPlank: 3 × 20 sec\nMountain climbers: 3 × 10\n\n🧊 *Cool-down (5 min)*\nLight stretching\n\n⏱️ Total: ~30 minutes',
        intermediate: '💪 *Intermediate Workout*\n\n🔥 *Warm-up (7 min)*\nJogging in place — 3 min\nDynamic stretches — 4 min\n\n🏋️ *Main Workout*\nBurpees: 4 × 10\nPush-ups: 4 × 15\nSquats: 4 × 20\nDips (chair): 3 × 12\nPlank: 3 × 45 sec\nJump squats: 3 × 12\n\n🧊 *Cool-down*\nFull body stretch — 8 min\n\n⏱️ Total: ~45 minutes',
        advanced: '🔥 *Advanced Workout*\n\n⚡ *HIIT Circuit (3 rounds)*\nBurpees — 45 sec\nRest — 15 sec\nJump squats — 45 sec\nRest — 15 sec\nPush-up variations — 45 sec\nRest — 15 sec\nBox jumps — 45 sec\nRest — 15 sec\nMountain climbers — 45 sec\nRest — 60 sec\n\n🧊 *Cool-down*\nFoam rolling + stretching — 10 min\n\n⏱️ Total: ~50 minutes',
      };
      await sock.sendMessage(ctx.chatId, { text: workouts[level] || workouts.beginner }, { quoted: msg });
    }
  },
  {
    command: 'sleep', aliases: ['sleeptip','bedtime'],
    category: 'health', description: 'Sleep improvement tips', usage: '.sleep',
    async handler(sock, msg, args, ctx) {
      const tips = [
        '😴 *Consistent Schedule*\nSleep and wake at the same time every day — even weekends. This regulates your circadian rhythm.',
        '📵 *No Screens Before Bed*\nBlue light from screens suppresses melatonin. Stop using devices 1 hour before sleep.',
        '🌡️ *Cool Your Room*\nThe ideal sleep temperature is 65-68°F (18-20°C). A cooler room signals your body it\'s time to sleep.',
        '☕ *Watch Your Caffeine*\nCaffeine has a half-life of 5-6 hours. Avoid coffee after 2-3 PM for better sleep.',
        '📓 *Wind-Down Routine*\nDo the same 30-min routine before bed: journal, read, meditate. It signals your brain to shut down.',
        '🌑 *Darkness Is Key*\nUse blackout curtains. Even small amounts of light can disrupt your sleep quality.',
      ];
      await sock.sendMessage(ctx.chatId, { text: `😴 *Sleep Improvement Tip*\n\n${r(tips)}\n\n💡 _Adults need 7-9 hours of sleep per night for optimal health._` }, { quoted: msg });
    }
  },
  {
    command: 'mealplan', aliases: ['dietplan','nutritionplan'],
    category: 'health', description: 'Get a simple meal plan', usage: '.mealplan [calories]',
    async handler(sock, msg, args, ctx) {
      const cals = parseInt(args[0]) || 2000;
      const meal1 = Math.round(cals * 0.25);
      const meal2 = Math.round(cals * 0.35);
      const meal3 = Math.round(cals * 0.30);
      const snack = Math.round(cals * 0.10);
      await sock.sendMessage(ctx.chatId, {
        text: `🍽️ *Simple Meal Plan (${cals} kcal/day)*\n\n🌅 *Breakfast (${meal1} kcal)*\n• Oatmeal with berries and nuts\n• 2 boiled eggs\n• Black coffee or green tea\n\n🥗 *Lunch (${meal2} kcal)*\n• Grilled chicken breast (150g)\n• Brown rice (1 cup)\n• Mixed salad with olive oil dressing\n\n🍽️ *Dinner (${meal3} kcal)*\n• Baked salmon or tofu\n• Steamed vegetables\n• Sweet potato (medium)\n\n🍌 *Snack (${snack} kcal)*\n• Apple + peanut butter\n• Greek yogurt\n• Handful of mixed nuts\n\n💧 Drink 2-3L water throughout the day!`
      }, { quoted: msg });
    }
  },
];
