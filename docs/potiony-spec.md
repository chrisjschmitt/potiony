# Potiony-spec.md

## Overview
Build a single-page interactive iPad web application titled **"Potiony"**. 
The app is designed for young children (kid-friendly, non-scary, vibrant, touch-optimized). The core gameplay revolves around cleaning up the environment (picking up pretend garbage) to earn magical ingredients, which are then brewed into magical **potions** to heal sick characters suffering from silly ailments. 

> **Important Tone & Language Rule:** NEVER use the word "medicine" anywhere in the UI, story, or audio cues. Always refer to remedies as **"Potions"** or **"Magic Brews"** to ensure the experience feels playful and non-threatening.


## Technical & UX Requirements
- **Target Device:** iPad (responsive, full-screen touch layout, large tap targets, prevent default pinch-to-zoom).
- **Tech Stack:** HTML5, CSS3 (Tailwind CSS preferred), JavaScript (React or vanilla JS with state management).
- **Visual Style:** Whimsical, colorful, friendly, cartoon aesthetic with rewarding particle effects/animations.
- **Audio/Visual Cues:** Soft sparkle sound effects, cheerful feedback when picking up trash, bubbling sounds at the cauldron, and celebratory animations when a potion heals a friend.

---

## Key Gameplay Scenes & Flow

### 1. Main Navigation / Hub
- A simple top/bottom tab navigation bar:
  * 🏞️ **Clean & Collect** (World Map)
  * 🧪 **Potion Lab** (Brewing Room)
  * 🏡 **Town & Friends** (Villager Care)
  * 📖 **Potion Recipe Book**

---

### 2. Scene 1: "Clean & Collect" (Garbage Pickup)
- **Environments:** Toggleable locations like *Sunflower Park*, *Sparkle Beach*, and *Enchanted Forest*.
- **Interactive Cleanup:** 
  - Drifting or scattered litter items (e.g., plastic bottles, soda cans, crumpled paper, tire debris).
  - Players tap or drag litter into designated recycling bins (Paper, Plastic, Metal).
- **Reward System:**
  - As pollution clears, nature blooms! Plants sparkle and reveal harvested potion ingredients.
  - *Example Ingredients:* 
	- 🌸 *Sunlight Blossom* (unlocked from clearing park plastic)
	- 💧 *Dewdrop Crystal* (unlocked from clearing beach glass)
	- 🍃 *Whispering Leaf* (unlocked from clearing forest paper)
	- ✨ *Star Dust* (bonus reward for 100% clean area)

---

### 3. Scene 2: "Potion Lab" (Brewing Station)
- **Visuals:** A bubbling central cauldron with dynamic liquid color changes.
- **Mechanics:**
  - An inventory shelf displaying collected ingredients with clean quantity counters.
  - **Drag-and-Drop:** Players drop 2 or 3 ingredients into the bubbling cauldron.
  - **Stir Action:** A finger-trace or tap-to-stir wheel animation to brew the potion.
- **Potion Outcomes:**
  - *Giggle Fizz Potion* = Sunlight Blossom + Dewdrop Crystal
  - *Cozy Warmth Potion* = Whispering Leaf + Sunlight Blossom
  - *Super Bouncy Potion* = Dewdrop Crystal + Star Dust

---

### 4. Scene 3: "Town & Friends" (Healing & Helping)
- **Characters:** Friendly animal or fantasy characters visiting the town square with silly, mild ailments.
  - 🦊 *Barnaby Fox* has the **"Giggle-Coughs"** (Needs: *Giggle Fizz Potion*)
  - 🐻 *Barnaby Bear* has a **"Topsy-Turvy Tummy"** (Needs: *Cozy Warmth Potion*)
  - 🐰 *Pippa Bunny* has **"Sleepy Knees"** (Needs: *Super Bouncy Potion*)
- **Interaction:**
  - Tap a friend to see their potion request in a clear, icon-based speech bubble.
  - Drag the correct potion from the inventory to the friend.
  - **Reward:** The friend instantly cheers, does a happy jump, heart particles appear, and the town gets cleaner and brighter!

---

## UI Components to Build
1. **Inventory Drawer:** Slide-out drawer or fixed bottom bar showing collected trash count, ingredient counts, and brewed potions.
2. **Progress Bar:** "Planet Cleanliness Meter" showing total environmental progress across all zones.
3. **Recipe Book Modal:** Simple visual guide displaying discovered potion recipes.

---

## Delivery Instructions
Please output the complete, functional application code in a clean structure with embedded CSS animations and interactive JavaScript logic. Ensure all interactive elements feature generous touch padding tailored for young children on an iPad.


## Success criteria
- The game plays as a PWA on an iPad in landscape mode
- My 8 year old grandchild can play the game without my help:
	- She knows how to start a new game
	- She can understand how to play the game
	- The game saves progress when closed
-