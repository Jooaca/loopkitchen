// Loop Kitchen MVP - Lógica Avanzada (Versión Final con UX Premium)

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

let state = {
    pantry: { 'i1': 2, 'i3': 1, 'i7': 1 },
    
    weeklyPlan: {
        'Lunes': [], 'Martes': [], 'Miércoles': [], 'Jueves': [], 
        'Viernes': [], 'Sábado': [], 'Domingo': []
    },
    
    sessionBought: {},
    
    selectedRecipeForDay: null,
    targetDayForRecipe: null,
    currentViewedRecipe: null
};

let currentFilter = 'Todo';

// =======================
// PERSISTENCIA (LOCAL STORAGE)
// =======================

function saveState() {
    const dataToSave = {
        pantry: state.pantry,
        weeklyPlan: state.weeklyPlan,
        sessionBought: state.sessionBought
    };
    localStorage.setItem('loopKitchenData', JSON.stringify(dataToSave));
}

function loadState() {
    const saved = localStorage.getItem('loopKitchenData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.pantry) state.pantry = parsed.pantry;
            if (parsed.weeklyPlan) state.weeklyPlan = parsed.weeklyPlan;
            if (parsed.sessionBought) state.sessionBought = parsed.sessionBought;
        } catch(e) {
            console.error("Error cargando el estado", e);
        }
    }
}

function checkOnboarding() {
    const hasSeen = localStorage.getItem('loopKitchenOnboarding');
    if (!hasSeen) {
        document.getElementById('onboarding-overlay').classList.add('active');
    }
}

function closeOnboarding() {
    localStorage.setItem('loopKitchenOnboarding', 'true');
    const overlay = document.getElementById('onboarding-overlay');
    overlay.classList.add('fade-out');
    setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.remove('fade-out');
    }, 300);
}

function resetWeek() {
    if(confirm("¿Estás seguro de terminar tu semana? Tu plan se borrará pero conservarás lo que hay en tu despensa para la próxima semana.")) {
        state.weeklyPlan = {
            'Lunes': [], 'Martes': [], 'Miércoles': [], 'Jueves': [], 
            'Viernes': [], 'Sábado': [], 'Domingo': []
        };
        state.sessionBought = {};
        
        saveState();
        navigateTo('view-dashboard');
    }
}

// =======================
// RENDERIZADOS PRINCIPALES
// =======================

function renderDashboard() {
    const todayIndex = new Date().getDay(); 
    const dayMap = [6, 0, 1, 2, 3, 4, 5]; 
    const todayName = diasSemana[dayMap[todayIndex]];
    
    document.getElementById('dashboard-date').textContent = `Hoy es ${todayName}.`;

    let isEmpty = true;
    for(let day in state.weeklyPlan) {
        if(state.weeklyPlan[day].length > 0) isEmpty = false;
    }

    if (isEmpty) {
        document.getElementById('dashboard-empty').style.display = 'block';
        document.getElementById('dashboard-active').style.display = 'none';
    } else {
        document.getElementById('dashboard-empty').style.display = 'none';
        document.getElementById('dashboard-active').style.display = 'block';

        const todayMeals = state.weeklyPlan[todayName];
        const container = document.getElementById('dashboard-today-meals');
        container.innerHTML = '';

        if (todayMeals.length === 0) {
            container.innerHTML = `<div style="padding:20px; color:rgba(19,36,17,0.7);">No planificaste comidas para hoy.</div>`;
        } else {
            todayMeals.forEach((mealObj, index) => {
                const recipe = mockRecipes.find(r => r.id === mealObj.id);
                container.innerHTML += `
                    <div class="today-meal-item" id="dash-meal-${index}" style="${mealObj.cooked ? 'opacity:0.5;' : ''}">
                        <div class="today-meal-icon" onclick="openRecipeDetail('${recipe.id}')" style="cursor:pointer;"><i class="ph ph-cooking-pot"></i></div>
                        <div class="today-meal-info" onclick="openRecipeDetail('${recipe.id}')" style="cursor:pointer; flex:1;">
                            <h4 style="${mealObj.cooked ? 'text-decoration:line-through;' : ''}">${recipe.title}</h4>
                            <span style="font-size:0.85rem; color:rgba(19,36,17,0.7);">${recipe.desc}</span>
                        </div>
                        <div class="planner-actions">
                            ${!mealObj.cooked ? `<button class="btn-cook" onclick="markRecipeCooked('${todayName}', ${index}, 'dash-meal-${index}')"><i class="ph ph-check"></i></button>` : ''}
                        </div>
                    </div>
                `;
            });
        }
    }
}

function renderPlanner() {
    const container = document.getElementById('planner-days-container');
    container.innerHTML = '';

    diasSemana.forEach(day => {
        let mealsHtml = '';
        state.weeklyPlan[day].forEach((mealObj, index) => {
            const recipe = mockRecipes.find(r => r.id === mealObj.id);
            mealsHtml += `
                <div class="planner-meal ${mealObj.cooked ? 'cooked' : ''}" id="planner-meal-${day}-${index}">
                    <span class="planner-meal-name" onclick="openRecipeDetail('${recipe.id}')" style="cursor:pointer;">${recipe.title}</span>
                    <div class="planner-actions">
                        ${!mealObj.cooked ? `<button class="btn-cook" onclick="markRecipeCooked('${day}', ${index}, 'planner-meal-${day}-${index}')"><i class="ph ph-check"></i></button>` : ''}
                        <button class="btn-remove" onclick="removeFromPlan('${day}', ${index})"><i class="ph ph-x"></i></button>
                    </div>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="planner-day-block">
                <div class="planner-day-header">
                    <span>${day}</span>
                    <span>${state.weeklyPlan[day].length} Comidas</span>
                </div>
                ${mealsHtml}
                <button class="add-meal-btn" onclick="goToCatalogForDay('${day}')">
                    <i class="ph ph-plus"></i> Añadir Comida
                </button>
            </div>
        `;
    });
}

function setRecipeFilter(filterName) {
    currentFilter = filterName;
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if(btn.textContent.trim().toLowerCase() === filterName.toLowerCase() || (filterName==='Todo' && btn.textContent==='Todo')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderRecipes();
}

function renderRecipes() {
    const container = document.getElementById('recipes-list-container');
    container.innerHTML = '';

    let filteredRecipes = mockRecipes;

    if (currentFilter !== 'Todo') {
        filteredRecipes = mockRecipes.filter(r => {
            const searchStr = (r.title + ' ' + r.desc).toLowerCase();
            if (currentFilter === 'Rápidas') return parseInt(r.time) < 20;
            if (currentFilter === 'Desayuno') return searchStr.includes('desayuno') || searchStr.includes('avena') || searchStr.includes('huevo');
            if (currentFilter === 'Pollo') return searchStr.includes('pollo');
            if (currentFilter === 'Ensalada') return searchStr.includes('ensalada');
            return true;
        });
    }

    if (filteredRecipes.length === 0) {
        container.innerHTML = `<div style="padding:40px; text-align:center;">No hay recetas para este filtro.</div>`;
        return;
    }

    filteredRecipes.forEach(recipe => {
        container.innerHTML += `
            <div class="recipe-item" onclick="openRecipeDetail('${recipe.id}')">
                <div class="recipe-info">
                    <h3>${recipe.title}</h3>
                    <p>${recipe.desc}</p>
                </div>
                <div class="recipe-badges-mini">
                    <span><i class="ph ph-clock"></i> ${recipe.time}</span>
                </div>
            </div>
        `;
    });
}

function renderPantry() {
    const container = document.getElementById('pantry-list-container');
    container.innerHTML = '';

    let hasItems = false;
    for (let id in state.pantry) {
        if (state.pantry[id] > 0) {
            hasItems = true;
            const ing = catalogIngredients[id];
            container.innerHTML += `
                <div class="pantry-row">
                    <div class="col-name">${ing.name}</div>
                    <div class="col-qty">${state.pantry[id]} <span style="font-size:0.6em; font-weight:normal">${ing.unit}</span></div>
                    <div class="col-action">
                        <button class="btn-square" onclick="updatePantry('${id}', -1)">-</button>
                        <button class="btn-square" onclick="updatePantry('${id}', 1)">+</button>
                    </div>
                </div>
            `;
        }
    }

    if(!hasItems) {
        container.innerHTML = `<div style="padding:40px 20px; font-weight:500;">Tu despensa está vacía.</div>`;
    }
}

function renderGroceryList() {
    const pendingContainer = document.getElementById('grocery-pending-container');
    const boughtContainer = document.getElementById('grocery-bought-container');
    pendingContainer.innerHTML = '';
    boughtContainer.innerHTML = '';

    let needed = {};
    let totalItemsNeeded = 0;
    let totalItemsSaved = 0;

    diasSemana.forEach(day => {
        state.weeklyPlan[day].forEach(mealObj => {
            if(!mealObj.cooked) {
                const recipe = mockRecipes.find(r => r.id === mealObj.id);
                recipe.ingredients.forEach(req => {
                    if (!needed[req.id]) needed[req.id] = 0;
                    needed[req.id] += req.qty;
                });
            }
        });
    });

    let hasPending = false;

    for (let id in needed) {
        const requiredQty = needed[id];
        const sessionQty = state.sessionBought[id] || 0;
        const originalPantry = (state.pantry[id] || 0) - sessionQty; 
        
        const savedQty = Math.min(requiredQty, Math.max(0, originalPantry)); 
        const toBuy = requiredQty - savedQty - sessionQty; 

        totalItemsNeeded += requiredQty;
        totalItemsSaved += savedQty;

        const ing = catalogIngredients[id];

        if (toBuy > 0) {
            hasPending = true;
            pendingContainer.innerHTML += `
                <div class="grocery-interactive-item" id="grocery-item-${id}">
                    <div class="checkbox-wrapper">
                        <input type="checkbox" onchange="markAsBought('${id}', ${toBuy}, 'grocery-item-${id}')">
                    </div>
                    <div class="grocery-details">
                        <div class="grocery-name">${toBuy} ${ing.unit} de ${ing.name}</div>
                        <div class="grocery-math">
                            Plan: ${requiredQty} | Despensa: -${savedQty} | <strong>A Comprar: ${toBuy}</strong>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    if(!hasPending && Object.keys(needed).length > 0) {
        pendingContainer.innerHTML = `<div style="padding:30px 20px; font-weight:600; color:var(--color-dark);">¡Tienes todo lo necesario para tu semana!</div>`;
    } else if (Object.keys(needed).length === 0) {
        pendingContainer.innerHTML = `<div style="padding:30px 20px; font-weight:500;">Tu plan está vacío o ya cocinaste todo. Empieza a planificar.</div>`;
    }

    let hasBought = false;
    for (let id in state.sessionBought) {
        hasBought = true;
        const ing = catalogIngredients[id];
        const qty = state.sessionBought[id];
        boughtContainer.innerHTML += `
            <div class="grocery-interactive-item bought">
                <div class="checkbox-wrapper">
                    <input type="checkbox" checked onchange="unmarkAsBought('${id}', ${qty})">
                </div>
                <div class="grocery-details">
                    <div class="grocery-name">${qty} ${ing.unit} de ${ing.name}</div>
                    <div class="grocery-math">¡Añadido a tu despensa!</div>
                </div>
            </div>
        `;
    }

    if(!hasBought) {
        boughtContainer.innerHTML = `<div style="padding:20px; font-size:0.8rem;">Aún no has marcado nada.</div>`;
    }

    document.getElementById('stat-needed').textContent = totalItemsNeeded;
    document.getElementById('stat-saved').textContent = totalItemsSaved;
}

// =======================
// LÓGICA DE DETALLES DE RECETA
// =======================

function openRecipeDetail(recipeId) {
    state.currentViewedRecipe = recipeId;
    const recipe = mockRecipes.find(r => r.id === recipeId);
    const container = document.getElementById('recipe-detail-content');

    let ingHtml = recipe.ingredients.map(req => {
        const ing = catalogIngredients[req.id];
        return `<div class="detail-ingredient-row">
                    <span>${ing.name}</span>
                    <strong>${req.qty} ${ing.unit}</strong>
                </div>`;
    }).join('');

    let stepsHtml = recipe.instructions.map((step, idx) => {
        return `<div class="detail-step">
                    <div class="step-num">${idx + 1}</div>
                    <div class="step-text">${step}</div>
                </div>`;
    }).join('');

    container.innerHTML = `
        <div class="detail-hero">
            <h2>${recipe.title}</h2>
            <p>${recipe.desc}</p>
        </div>
        <div class="detail-badges">
            <div class="badge"><i class="ph ph-clock"></i> ${recipe.time}</div>
            <div class="badge"><i class="ph ph-users"></i> ${recipe.portions} porciones</div>
            <div class="badge"><i class="ph ph-chart-bar"></i> ${recipe.difficulty}</div>
        </div>
        <div class="detail-section">
            <h3>Ingredientes</h3>
            <div class="detail-ingredients-box">
                ${ingHtml}
            </div>
        </div>
        <div class="detail-section" style="border-bottom: none;">
            <h3>Preparación</h3>
            ${stepsHtml}
        </div>
        <div class="detail-footer-action">
            <button class="btn-massive btn-lime" onclick="handleAddFromDetail()">+ Añadir al Plan</button>
        </div>
    `;

    document.getElementById('view-recipe-detail').classList.add('active');
}

function closeRecipeDetail() {
    document.getElementById('view-recipe-detail').classList.remove('active');
    state.currentViewedRecipe = null;
}

function handleAddFromDetail() {
    const recipeId = state.currentViewedRecipe;
    
    if (state.targetDayForRecipe) {
        confirmAddDay(state.targetDayForRecipe, recipeId);
        state.targetDayForRecipe = null; 
        closeRecipeDetail();
    } else {
        state.selectedRecipeForDay = recipeId;
        const container = document.getElementById('modal-days-list');
        container.innerHTML = '';
        
        diasSemana.forEach(day => {
            container.innerHTML += `<button class="day-select-btn" onclick="confirmAddDay('${day}')">${day}</button>`;
        });

        document.getElementById('modal-select-day').classList.add('active');
    }
}

function surpriseMe() {
    const randomIndex = Math.floor(Math.random() * mockRecipes.length);
    const randomRecipe = mockRecipes[randomIndex];
    openRecipeDetail(randomRecipe.id);
}

// =======================
// LÓGICA DE INTERACCIÓN (CON ANIMACIONES)
// =======================

function markRecipeCooked(day, index, elementId) {
    const el = document.getElementById(elementId);
    if(el) el.classList.add('fade-out');

    setTimeout(() => {
        const mealObj = state.weeklyPlan[day][index];
        mealObj.cooked = true;
        
        const recipe = mockRecipes.find(r => r.id === mealObj.id);
        recipe.ingredients.forEach(req => {
            updatePantry(req.id, -req.qty, false); // false = no re-render yet
        });

        saveState();
        renderDashboard();
        renderPlanner();
        renderGroceryList();
    }, 300);
}

function markAsBought(id, qty, elementId) {
    const el = document.getElementById(elementId);
    if(el) el.classList.add('slide-out');

    setTimeout(() => {
        if (!state.pantry[id]) state.pantry[id] = 0;
        state.pantry[id] += qty;
        
        if (!state.sessionBought[id]) state.sessionBought[id] = 0;
        state.sessionBought[id] += qty;

        saveState();
        renderGroceryList();
        renderPantry();
    }, 300);
}

function unmarkAsBought(id, qty) {
    state.pantry[id] -= qty;
    if (state.pantry[id] <= 0) delete state.pantry[id];
    
    state.sessionBought[id] -= qty;
    if (state.sessionBought[id] <= 0) delete state.sessionBought[id];

    saveState();
    renderGroceryList();
    renderPantry();
}

function updatePantry(id, change, autoRender = true) {
    if (!state.pantry[id]) state.pantry[id] = 0;
    state.pantry[id] += change;
    
    if (state.pantry[id] <= 0) {
        delete state.pantry[id];
    }
    
    saveState();
    if(autoRender) {
        renderPantry();
        renderGroceryList();
        renderDashboard();
    }
}

function removeFromPlan(day, index) {
    state.weeklyPlan[day].splice(index, 1);
    
    saveState();
    renderPlanner();
    renderGroceryList();
    renderDashboard();
}

// =======================
// MODALES Y NAVEGACIÓN
// =======================

function navigateTo(targetId) {
    if (targetId !== 'view-recipes' || !state.targetDayForRecipe) {
        state.targetDayForRecipe = null; 
    }

    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view:not(#view-recipe-detail)');

    navItems.forEach(nav => nav.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if(activeNav) activeNav.classList.add('active');
    document.getElementById(targetId).classList.add('active');

    const header = document.querySelector('.app-header');
    if(targetId === 'view-grocery' || targetId === 'view-planner') {
        header.style.backgroundColor = 'var(--color-lime)';
    } else {
        header.style.backgroundColor = 'var(--color-cream)';
    }

    if(targetId === 'view-dashboard') renderDashboard();
    if(targetId === 'view-planner') renderPlanner();
    if(targetId === 'view-grocery') renderGroceryList();
    if(targetId === 'view-pantry') renderPantry();
}

function goToCatalogForDay(day) {
    state.targetDayForRecipe = day;
    navigateTo('view-recipes');
}

function confirmAddDay(day, specificRecipeId = null) {
    const recipeToAdd = specificRecipeId || state.selectedRecipeForDay;
    if(recipeToAdd) {
        state.weeklyPlan[day].push({ id: recipeToAdd, cooked: false });
        state.selectedRecipeForDay = null;
        saveState();
    }
    closeModal('modal-select-day');
    closeRecipeDetail();
    navigateTo('view-planner');
}

function openAddIngredientModal() {
    const select = document.getElementById('select-new-ingredient');
    select.innerHTML = '';
    
    let keys = Object.keys(catalogIngredients).sort((a,b) => catalogIngredients[a].name.localeCompare(catalogIngredients[b].name));
    keys.forEach(id => {
        select.innerHTML += `<option value="${id}">${catalogIngredients[id].name} (${catalogIngredients[id].unit})</option>`;
    });

    document.getElementById('input-new-qty').value = 1;
    document.getElementById('modal-add-ingredient').classList.add('active');
}

function submitAddIngredient() {
    const id = document.getElementById('select-new-ingredient').value;
    const qty = parseInt(document.getElementById('input-new-qty').value);
    
    if (id && qty > 0) {
        updatePantry(id, qty);
        closeModal('modal-add-ingredient');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// =======================
// INIT
// =======================

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkOnboarding();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            state.targetDayForRecipe = null;
            navigateTo(item.getAttribute('data-target'));
        });
    });

    renderDashboard();
    renderRecipes();
    renderPlanner();
    renderPantry();
    renderGroceryList();
});
