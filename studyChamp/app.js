// State Management
const STATE = {
    theme: localStorage.getItem('sc_theme') || 'dark',
    sounds: localStorage.getItem('sc_sounds') !== 'false',
    notifications: localStorage.getItem('sc_notify') === 'true',
    xp: parseInt(localStorage.getItem('sc_xp')) || 0,
    focusMinutes: parseInt(localStorage.getItem('sc_focus_mins')) || 0,
    tasksDone: parseInt(localStorage.getItem('sc_tasks_done')) || 0,
    flashcardsMastered: parseInt(localStorage.getItem('sc_fc_mastered')) || 0,
    quizHistory: JSON.parse(localStorage.getItem('sc_quiz_history')) || [],
    tasks: JSON.parse(localStorage.getItem('sc_tasks')) || [],
    flashcards: JSON.parse(localStorage.getItem('sc_flashcards')) || [],
    quizBank: JSON.parse(localStorage.getItem('sc_quiz_bank')) || [],
    focusHistory: JSON.parse(localStorage.getItem('sc_focus_history')) || Array(7).fill(0)
};

// DOM Elements
const els = {
    navBtns: document.querySelectorAll('.nav-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    subTabBtns: document.querySelectorAll('.tab-btn'),
    subTabContents: document.querySelectorAll('.sub-tab-content'),
    pageTitle: document.getElementById('page-title'),
    themeToggle: document.getElementById('theme-toggle'),
    notifyBtn: document.getElementById('notify-request-btn'),
    
    // Stats
    userLevel: document.getElementById('user-level'),
    xpBar: document.getElementById('xp-bar'),
    statFocus: document.getElementById('stat-focus-time'),
    statTasks: document.getElementById('stat-tasks-done'),
    statCards: document.getElementById('stat-cards-mastered'),
    statQuiz: document.getElementById('stat-quiz-score'),
    
    // Audio
    sndSuccess: document.getElementById('sound-success'),
    sndError: document.getElementById('sound-error'),
    sndTimer: document.getElementById('sound-timer'),
};

// Initialize App
const initApp = () => {
    applyTheme(STATE.theme);
    updateDashboardStats();
    initChart();
    renderTasks();
    renderFlashcardsList();
    updateFcView();
    renderQuizPreview();
    setupEventListeners();
    
    // Settings toggles
    document.getElementById('setting-sound').checked = STATE.sounds;
    document.getElementById('setting-notify').checked = STATE.notifications;
};

// --- Utilities & Core ---
const saveState = (key, value) => {
    STATE[key] = value;
    if(typeof value === 'object') localStorage.setItem(`sc_${key}`, JSON.stringify(value));
    else localStorage.setItem(`sc_${key}`, value);
};

const addXP = (amount) => {
    STATE.xp += amount;
    saveState('xp', STATE.xp);
    updateXPBar();
};

const updateXPBar = () => {
    const level = Math.floor(STATE.xp / 100) + 1;
    const progress = STATE.xp % 100;
    els.userLevel.textContent = level;
    els.xpBar.style.width = `${progress}%`;
};

const playSound = (type) => {
    if(!STATE.sounds) return;
    try {
        if(type === 'success') els.sndSuccess.play();
        if(type === 'error') els.sndError.play();
        if(type === 'timer') els.sndTimer.play();
    } catch(e) {}
};

const triggerConfetti = () => {
    if(typeof confetti !== 'undefined') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
};

const sendNotification = (title, body) => {
    if(STATE.notifications && window.Notification && Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' });
    }
};

// --- UI Logic ---
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    els.themeToggle.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    if(window.focusChartInst) {
        window.focusChartInst.options.scales.x.ticks.color = theme==='dark'?'#94a3b8':'#64748b';
        window.focusChartInst.options.scales.y.ticks.color = theme==='dark'?'#94a3b8':'#64748b';
        window.focusChartInst.update();
    }
};

const updateDashboardStats = () => {
    const hours = Math.floor(STATE.focusMinutes / 60);
    const mins = STATE.focusMinutes % 60;
    els.statFocus.textContent = `${hours}h ${mins}m`;
    els.statTasks.textContent = STATE.tasksDone;
    els.statCards.textContent = STATE.flashcardsMastered;
    
    if(STATE.quizHistory.length > 0) {
        const sum = STATE.quizHistory.reduce((a,b)=>a+b, 0);
        els.statQuiz.textContent = `${Math.round(sum/STATE.quizHistory.length)}%`;
    }
    updateXPBar();
};

const setupEventListeners = () => {
    // Nav
    els.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.navBtns.forEach(b => b.classList.remove('active'));
            els.tabContents.forEach(tc => tc.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
            els.pageTitle.textContent = btn.querySelector('span') ? btn.querySelector('span').textContent.trim() : btn.textContent.trim();
        });
    });

    // Sub Tabs (Quiz)
    els.subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.subTabBtns.forEach(b => b.classList.remove('active'));
            els.subTabContents.forEach(tc => tc.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-qtarget');
            document.getElementById(target).classList.add('active');
            if(target === 'take-quiz') initQuiz();
        });
    });

    // Theme Toggle
    els.themeToggle.addEventListener('click', () => {
        const newTheme = STATE.theme === 'dark' ? 'light' : 'dark';
        saveState('theme', newTheme);
        applyTheme(newTheme);
    });

    // Notify Request
    els.notifyBtn.addEventListener('click', () => {
        if (window.Notification && Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    saveState('notifications', true);
                    document.getElementById('setting-notify').checked = true;
                    alert("Notifications enabled!");
                }
            });
        } else {
            alert("Your browser does not support notifications or you have blocked them.");
        }
    });

    // Settings
    document.getElementById('setting-sound').addEventListener('change', (e) => saveState('sounds', e.target.checked));
    document.getElementById('setting-notify').addEventListener('change', (e) => {
        if(e.target.checked) els.notifyBtn.click();
        else saveState('notifications', false);
    });
    
    document.getElementById('clear-data-btn').addEventListener('click', () => {
        if(confirm('Are you sure you want to delete all data? This cannot be undone.')){
            localStorage.clear();
            location.reload();
        }
    });
};

// --- Chart.js ---
const initChart = () => {
    const ctx = document.getElementById('focusChart').getContext('2d');
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'];
    const color = STATE.theme === 'dark' ? '#94a3b8' : '#64748b';
    
    window.focusChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Focus Minutes',
                data: STATE.focusHistory,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color } },
                x: { grid: { display: false }, ticks: { color } }
            }
        }
    });
};

const updateChartData = (newMins) => {
    STATE.focusHistory[6] += newMins; // Add to today
    saveState('focusHistory', STATE.focusHistory);
    window.focusChartInst.update();
};

// --- Pomodoro System ---
const timer = {
    interval: null,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    mode: 'focus' // focus, short, long
};

const pDisplay = document.getElementById('timer-display');
const pModeText = document.getElementById('timer-mode');
const pCircle = document.querySelector('.progress-ring__circle');
const pCircumference = 2 * Math.PI * 140;
pCircle.style.strokeDasharray = `${pCircumference} ${pCircumference}`;
pCircle.style.strokeDashoffset = 0;

const pBtns = {
    start: document.getElementById('start-btn'),
    pause: document.getElementById('pause-btn'),
    reset: document.getElementById('reset-btn'),
    modes: document.querySelectorAll('.mode-btn')
};

const updateTimerUI = () => {
    const m = Math.floor(timer.timeLeft / 60).toString().padStart(2, '0');
    const s = (timer.timeLeft % 60).toString().padStart(2, '0');
    pDisplay.textContent = `${m}:${s}`;
    document.title = timer.isRunning ? `${m}:${s} - ${timer.mode === 'focus'?'Focus':'Break'}` : 'StudyChamp';
    
    const offset = pCircumference - (timer.timeLeft / timer.totalTime) * pCircumference;
    pCircle.style.strokeDashoffset = offset;
};

const setTimerMode = (mode, mins) => {
    clearInterval(timer.interval);
    timer.isRunning = false;
    timer.mode = mode;
    timer.totalTime = mins * 60;
    timer.timeLeft = timer.totalTime;
    
    pModeText.textContent = mode === 'focus' ? 'Focus Time' : mode === 'short' ? 'Short Break' : 'Long Break';
    pCircle.style.stroke = mode === 'focus' ? 'var(--primary-color)' : 'var(--secondary-color)';
    
    pBtns.modes.forEach(b => b.classList.remove('active'));
    document.getElementById(`${mode === 'short' ? 'short-break' : mode === 'long' ? 'long-break' : 'focus-mode'}-btn`).classList.add('active');
    
    pBtns.start.classList.remove('hidden');
    pBtns.pause.classList.add('hidden');
    updateTimerUI();
};

pBtns.modes[0].addEventListener('click', () => setTimerMode('focus', 25));
pBtns.modes[1].addEventListener('click', () => setTimerMode('short', 5));
pBtns.modes[2].addEventListener('click', () => setTimerMode('long', 15));

pBtns.start.addEventListener('click', () => {
    if (timer.isRunning) return;
    timer.isRunning = true;
    pBtns.start.classList.add('hidden');
    pBtns.pause.classList.remove('hidden');
    
    timer.interval = setInterval(() => {
        if (timer.timeLeft > 0) {
            timer.timeLeft--;
            updateTimerUI();
        } else {
            clearInterval(timer.interval);
            timer.isRunning = false;
            playSound('timer');
            sendNotification('Timer Complete!', `${timer.mode==='focus'?'Focus session':'Break'} is over.`);
            
            if(timer.mode === 'focus') {
                addXP(25);
                STATE.focusMinutes += Math.round(timer.totalTime/60);
                saveState('focusMinutes', STATE.focusMinutes);
                updateChartData(Math.round(timer.totalTime/60));
                updateDashboardStats();
                triggerConfetti();
                // Complete active task if exists
                if(window.activeTaskId) completeTask(window.activeTaskId);
            }
            
            pBtns.reset.click();
        }
    }, 1000);
});

pBtns.pause.addEventListener('click', () => {
    clearInterval(timer.interval);
    timer.isRunning = false;
    pBtns.start.classList.remove('hidden');
    pBtns.pause.classList.add('hidden');
});

pBtns.reset.addEventListener('click', () => {
    setTimerMode(timer.mode, timer.totalTime / 60);
});


// --- Tasks System ---
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const activeTaskDisplay = document.getElementById('active-task-display');
let currentTaskFilter = 'all';
window.activeTaskId = null;

const renderTasks = () => {
    taskList.innerHTML = '';
    const filtered = STATE.tasks.filter(t => {
        if(currentTaskFilter === 'active') return !t.completed;
        if(currentTaskFilter === 'completed') return t.completed;
        return true;
    });
    
    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        if(task.id === window.activeTaskId) li.style.borderColor = 'var(--primary-color)';
        
        li.innerHTML = `
            <div class="task-content" onclick="toggleTask(${task.id})">
                <div class="task-checkbox"></div>
                <span class="task-text">${task.text}</span>
            </div>
            <div class="task-actions">
                ${!task.completed ? `<button class="set-active-btn" onclick="setActiveTask(${task.id})" title="Set as active for Pomodoro"><i class="fa-solid fa-bullseye"></i></button>` : ''}
                <button onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        taskList.appendChild(li);
    });
};

addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if(text) {
        STATE.tasks.push({ id: Date.now(), text, completed: false });
        saveState('tasks', STATE.tasks);
        taskInput.value = '';
        renderTasks();
    }
});

taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTaskBtn.click());

window.toggleTask = (id) => {
    const task = STATE.tasks.find(t => t.id === id);
    if(task) {
        task.completed = !task.completed;
        if(task.completed) {
            playSound('success');
            STATE.tasksDone++;
            saveState('tasksDone', STATE.tasksDone);
            addXP(10);
            updateDashboardStats();
            if(window.activeTaskId === id) setActiveTask(null);
        } else {
            STATE.tasksDone--;
            saveState('tasksDone', STATE.tasksDone);
            updateDashboardStats();
        }
        saveState('tasks', STATE.tasks);
        renderTasks();
    }
};

window.completeTask = (id) => {
    const task = STATE.tasks.find(t => t.id === id);
    if(task && !task.completed) {
        task.completed = true;
        STATE.tasksDone++;
        saveState('tasksDone', STATE.tasksDone);
        saveState('tasks', STATE.tasks);
        addXP(10);
        updateDashboardStats();
        setActiveTask(null);
        renderTasks();
    }
}

window.deleteTask = (id) => {
    STATE.tasks = STATE.tasks.filter(t => t.id !== id);
    saveState('tasks', STATE.tasks);
    if(window.activeTaskId === id) setActiveTask(null);
    renderTasks();
};

window.setActiveTask = (id) => {
    window.activeTaskId = id;
    if(id === null) {
        activeTaskDisplay.innerHTML = '<p class="text-muted">No task selected. Select one from the Tasks tab.</p>';
    } else {
        const task = STATE.tasks.find(t => t.id === id);
        activeTaskDisplay.innerHTML = `<h3 style="color:var(--primary-color)">🎯 ${task.text}</h3>`;
        // Switch to Pomodoro tab
        els.navBtns[1].click();
    }
    renderTasks();
};

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTaskFilter = e.target.getAttribute('data-filter');
        renderTasks();
    });
});


// --- Flashcards System ---
let currentFcIndex = 0;
const renderFlashcardsList = () => {
    const list = document.getElementById('fc-list');
    list.innerHTML = '';
    STATE.flashcards.forEach((fc, idx) => {
        list.innerHTML += `
            <div class="fc-list-item">
                <p><strong>Q:</strong> ${fc.q}</p>
                <button class="icon-btn" onclick="deleteFc(${idx})" style="width:30px;height:30px;font-size:0.8rem;border:none;background:transparent;color:var(--danger-color)"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
};

document.getElementById('add-fc-btn').addEventListener('click', () => {
    const q = document.getElementById('fc-question').value.trim();
    const a = document.getElementById('fc-answer').value.trim();
    if(q && a) {
        STATE.flashcards.push({q, a});
        saveState('flashcards', STATE.flashcards);
        document.getElementById('fc-question').value = '';
        document.getElementById('fc-answer').value = '';
        renderFlashcardsList();
        updateFcView();
        addXP(5);
    }
});

window.deleteFc = (idx) => {
    if(confirm('Delete this card?')){
        STATE.flashcards.splice(idx, 1);
        saveState('flashcards', STATE.flashcards);
        renderFlashcardsList();
        if(currentFcIndex >= STATE.flashcards.length) currentFcIndex = 0;
        updateFcView();
    }
};

const fcViewer = document.getElementById('fc-viewer');
const fcEmpty = document.getElementById('fc-empty-state');
const fcCard = document.getElementById('active-flashcard');

const updateFcView = () => {
    if(STATE.flashcards.length === 0) {
        fcViewer.classList.add('hidden');
        fcEmpty.classList.remove('hidden');
    } else {
        fcViewer.classList.remove('hidden');
        fcEmpty.classList.add('hidden');
        fcCard.classList.remove('flipped');
        
        setTimeout(() => {
            document.getElementById('fc-front').textContent = STATE.flashcards[currentFcIndex].q;
            document.getElementById('fc-back').textContent = STATE.flashcards[currentFcIndex].a;
            document.getElementById('fc-counter').textContent = `${currentFcIndex + 1} / ${STATE.flashcards.length}`;
        }, 150); // wait for flip back if it was flipped
    }
};

fcCard.addEventListener('click', () => fcCard.classList.toggle('flipped'));

document.getElementById('fc-prev-btn').addEventListener('click', () => {
    if(STATE.flashcards.length > 0) {
        currentFcIndex = (currentFcIndex - 1 + STATE.flashcards.length) % STATE.flashcards.length;
        updateFcView();
    }
});
document.getElementById('fc-next-btn').addEventListener('click', () => {
    if(STATE.flashcards.length > 0) {
        currentFcIndex = (currentFcIndex + 1) % STATE.flashcards.length;
        updateFcView();
    }
});

document.querySelectorAll('.fc-rate-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.getAttribute('data-val');
        if(val === 'easy') {
            STATE.flashcardsMastered++;
            saveState('flashcardsMastered', STATE.flashcardsMastered);
            updateDashboardStats();
            addXP(2);
        }
        document.getElementById('fc-next-btn').click();
    });
});


// --- Quiz System ---
const renderQuizPreview = () => {
    const preview = document.getElementById('quiz-list-preview');
    preview.innerHTML = '';
    STATE.quizBank.forEach((q, idx) => {
        preview.innerHTML += `
            <div class="fc-list-item">
                <p><strong>${idx+1}:</strong> ${q.question}</p>
                <button class="icon-btn" onclick="deleteQuizQ(${idx})" style="width:30px;height:30px;font-size:0.8rem;border:none;background:transparent;color:var(--danger-color)"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
};

document.getElementById('add-quiz-btn').addEventListener('click', () => {
    const q = document.getElementById('quiz-question').value.trim();
    const o1 = document.getElementById('quiz-opt1').value.trim();
    const o2 = document.getElementById('quiz-opt2').value.trim();
    const o3 = document.getElementById('quiz-opt3').value.trim();
    const o4 = document.getElementById('quiz-opt4').value.trim();
    
    if(q && o1 && o2) {
        const options = [o1, o2];
        if(o3) options.push(o3);
        if(o4) options.push(o4);
        
        STATE.quizBank.push({ question: q, options, correct: o1 });
        saveState('quizBank', STATE.quizBank);
        
        document.getElementById('quiz-question').value = '';
        document.getElementById('quiz-opt1').value = '';
        document.getElementById('quiz-opt2').value = '';
        document.getElementById('quiz-opt3').value = '';
        document.getElementById('quiz-opt4').value = '';
        renderQuizPreview();
        addXP(10);
    } else {
        alert("Please provide a question and at least 2 options.");
    }
});

window.deleteQuizQ = (idx) => {
    if(confirm('Delete this question?')){
        STATE.quizBank.splice(idx, 1);
        saveState('quizBank', STATE.quizBank);
        renderQuizPreview();
    }
};

let quizState = { current: 0, score: 0, activeQuiz: [] };

const initQuiz = () => {
    const activeView = document.getElementById('quiz-active-state');
    const resultView = document.getElementById('quiz-result-state');
    const emptyView = document.getElementById('quiz-empty-state');
    
    if(STATE.quizBank.length === 0) {
        activeView.classList.add('hidden');
        resultView.classList.add('hidden');
        emptyView.classList.remove('hidden');
        return;
    }
    
    emptyView.classList.add('hidden');
    resultView.classList.add('hidden');
    activeView.classList.remove('hidden');
    
    // Select up to 10 random questions
    const shuffledBank = [...STATE.quizBank].sort(() => 0.5 - Math.random());
    quizState.activeQuiz = shuffledBank.slice(0, 10);
    quizState.current = 0;
    quizState.score = 0;
    
    loadQuizQ();
};

const loadQuizQ = () => {
    const qData = quizState.activeQuiz[quizState.current];
    document.getElementById('active-q-text').textContent = qData.question;
    
    const progress = ((quizState.current) / quizState.activeQuiz.length) * 100;
    document.getElementById('quiz-progress-fill').style.width = `${progress}%`;
    
    const optionsDiv = document.getElementById('active-q-options');
    optionsDiv.innerHTML = '';
    
    const shuffledOpts = [...qData.options].sort(() => 0.5 - Math.random());
    
    shuffledOpts.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'quiz-option';
        div.innerHTML = `<span>${opt}</span><div class="circle"></div>`;
        div.onclick = () => {
            if(document.getElementById('submit-q-btn').classList.contains('hidden')) return; // already submitted
            document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
            div.classList.add('selected');
            document.getElementById('submit-q-btn').disabled = false;
        };
        optionsDiv.appendChild(div);
    });
    
    document.getElementById('q-feedback').className = 'feedback-badge hidden';
    document.getElementById('submit-q-btn').classList.remove('hidden');
    document.getElementById('submit-q-btn').disabled = true;
    document.getElementById('next-q-btn').classList.add('hidden');
};

document.getElementById('submit-q-btn').addEventListener('click', () => {
    const selected = document.querySelector('.quiz-option.selected');
    if(!selected) return;
    
    const selectedText = selected.querySelector('span').textContent;
    const correctText = quizState.activeQuiz[quizState.current].correct;
    const isCorrect = selectedText === correctText;
    
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.classList.add('disabled');
        const text = opt.querySelector('span').textContent;
        if(text === correctText) opt.classList.add('correct');
        else if(opt.classList.contains('selected') && !isCorrect) opt.classList.add('incorrect');
    });
    
    const feedback = document.getElementById('q-feedback');
    feedback.classList.remove('hidden');
    
    if(isCorrect) {
        quizState.score++;
        feedback.textContent = 'Awesome! Correct.';
        feedback.className = 'feedback-badge success';
        playSound('success');
    } else {
        feedback.textContent = `Oops! Correct was: ${correctText}`;
        feedback.className = 'feedback-badge error';
        playSound('error');
    }
    
    document.getElementById('submit-q-btn').classList.add('hidden');
    const nextBtn = document.getElementById('next-q-btn');
    nextBtn.classList.remove('hidden');
    
    if(quizState.current === quizState.activeQuiz.length - 1) {
        nextBtn.textContent = 'See Results';
    } else {
        nextBtn.textContent = 'Next Question';
    }
});

document.getElementById('next-q-btn').addEventListener('click', () => {
    quizState.current++;
    if(quizState.current < quizState.activeQuiz.length) {
        loadQuizQ();
    } else {
        showQuizResult();
    }
});

const showQuizResult = () => {
    document.getElementById('quiz-active-state').classList.add('hidden');
    const resultView = document.getElementById('quiz-result-state');
    resultView.classList.remove('hidden');
    
    const percentage = Math.round((quizState.score / quizState.activeQuiz.length) * 100);
    document.getElementById('quiz-score').textContent = `${percentage}%`;
    
    const msg = document.getElementById('quiz-msg');
    if(percentage === 100) {
        msg.textContent = 'Perfect score! You are a genius!';
        triggerConfetti();
        addXP(50);
        playSound('success');
    } else if (percentage >= 80) {
        msg.textContent = 'Great job! Almost perfect.';
        triggerConfetti();
        addXP(30);
    } else {
        msg.textContent = 'Good effort. Keep studying!';
        addXP(10);
    }
    
    STATE.quizHistory.push(percentage);
    saveState('quizHistory', STATE.quizHistory);
    updateDashboardStats();
};

document.getElementById('restart-quiz-btn').addEventListener('click', initQuiz);


// Run
initApp();
