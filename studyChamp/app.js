document.addEventListener('DOMContentLoaded', () => {
    // === Navigation Logic ===
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Add active class to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // === Pomodoro Logic ===
    let timerInterval;
    let timeLeft = 25 * 60; // default 25 mins in seconds
    let isRunning = false;
    let currentMode = 'focus'; // focus, shortBreak, longBreak

    const timerDisplay = document.getElementById('timer-display');
    const timerMode = document.getElementById('timer-mode');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const focusModeBtn = document.getElementById('focus-mode-btn');
    const shortBreakBtn = document.getElementById('short-break-btn');
    const longBreakBtn = document.getElementById('long-break-btn');

    const updateDisplay = () => {
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
        document.title = `${mins}:${secs} - StudyChamp`;
    };

    const setMode = (mode, seconds, text, btn) => {
        clearInterval(timerInterval);
        isRunning = false;
        currentMode = mode;
        timeLeft = seconds;
        timerMode.textContent = text;
        updateDisplay();
        document.title = 'StudyChamp';

        [focusModeBtn, shortBreakBtn, longBreakBtn].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
    };

    focusModeBtn.addEventListener('click', () => setMode('focus', 25 * 60, 'Focus Time', focusModeBtn));
    shortBreakBtn.addEventListener('click', () => setMode('shortBreak', 5 * 60, 'Short Break', shortBreakBtn));
    longBreakBtn.addEventListener('click', () => setMode('longBreak', 15 * 60, 'Long Break', longBreakBtn));

    startBtn.addEventListener('click', () => {
        if (!isRunning) {
            isRunning = true;
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                } else {
                    clearInterval(timerInterval);
                    isRunning = false;
                    alert('Time is up!');
                    resetBtn.click();
                }
            }, 1000);
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            document.title = `Paused - StudyChamp`;
        }
    });

    resetBtn.addEventListener('click', () => {
        if (currentMode === 'focus') setMode('focus', 25 * 60, 'Focus Time', focusModeBtn);
        else if (currentMode === 'shortBreak') setMode('shortBreak', 5 * 60, 'Short Break', shortBreakBtn);
        else if (currentMode === 'longBreak') setMode('longBreak', 15 * 60, 'Long Break', longBreakBtn);
    });

    // === Flashcards Logic ===
    let flashcards = JSON.parse(localStorage.getItem('studyChamp_flashcards')) || [];
    let currentFcIndex = 0;

    const fcQuestionInput = document.getElementById('fc-question');
    const fcAnswerInput = document.getElementById('fc-answer');
    const addFcBtn = document.getElementById('add-fc-btn');
    const fcViewer = document.getElementById('fc-viewer');
    const fcEmptyState = document.getElementById('fc-empty-state');
    const activeFlashcard = document.getElementById('active-flashcard');
    const fcFront = document.getElementById('fc-front');
    const fcBack = document.getElementById('fc-back');
    const fcCounter = document.getElementById('fc-counter');
    const fcPrevBtn = document.getElementById('fc-prev-btn');
    const fcNextBtn = document.getElementById('fc-next-btn');
    const deleteFcBtn = document.getElementById('delete-fc-btn');

    const saveFlashcards = () => {
        localStorage.setItem('studyChamp_flashcards', JSON.stringify(flashcards));
    };

    const updateFcView = () => {
        if (flashcards.length === 0) {
            fcViewer.classList.add('hidden');
            fcEmptyState.classList.remove('hidden');
        } else {
            fcViewer.classList.remove('hidden');
            fcEmptyState.classList.add('hidden');
            
            // Ensure card is showing front
            activeFlashcard.classList.remove('flipped');
            
            setTimeout(() => {
                fcFront.textContent = flashcards[currentFcIndex].q;
                fcBack.textContent = flashcards[currentFcIndex].a;
                fcCounter.textContent = `${currentFcIndex + 1} / ${flashcards.length}`;
            }, 100);
        }
    };

    addFcBtn.addEventListener('click', () => {
        const q = fcQuestionInput.value.trim();
        const a = fcAnswerInput.value.trim();
        if (q && a) {
            flashcards.push({ q, a });
            saveFlashcards();
            fcQuestionInput.value = '';
            fcAnswerInput.value = '';
            currentFcIndex = flashcards.length - 1; // jump to new card
            updateFcView();
        }
    });

    activeFlashcard.addEventListener('click', () => {
        activeFlashcard.classList.toggle('flipped');
    });

    fcPrevBtn.addEventListener('click', () => {
        if (flashcards.length > 0) {
            currentFcIndex = (currentFcIndex - 1 + flashcards.length) % flashcards.length;
            updateFcView();
        }
    });

    fcNextBtn.addEventListener('click', () => {
        if (flashcards.length > 0) {
            currentFcIndex = (currentFcIndex + 1) % flashcards.length;
            updateFcView();
        }
    });

    deleteFcBtn.addEventListener('click', () => {
        if (flashcards.length > 0) {
            if(confirm("Are you sure you want to delete this flashcard?")) {
                flashcards.splice(currentFcIndex, 1);
                saveFlashcards();
                if (currentFcIndex >= flashcards.length && currentFcIndex > 0) {
                    currentFcIndex--;
                }
                updateFcView();
            }
        }
    });

    // Initial load
    updateFcView();


    // === Quiz Logic ===
    let quizQuestions = JSON.parse(localStorage.getItem('studyChamp_quiz')) || [];
    let currentQuizIndex = 0;
    let score = 0;
    let selectedOptionIndex = null;

    const quizTabBtns = document.querySelectorAll('.quiz-tab-btn');
    const qTabContents = document.querySelectorAll('.q-tab-content');
    
    // Creator elements
    const quizQuestionInput = document.getElementById('quiz-question');
    const quizOpt1 = document.getElementById('quiz-opt1');
    const quizOpt2 = document.getElementById('quiz-opt2');
    const quizOpt3 = document.getElementById('quiz-opt3');
    const quizOpt4 = document.getElementById('quiz-opt4');
    const addQuizBtn = document.getElementById('add-quiz-btn');
    const quizListPreview = document.getElementById('quiz-list-preview');

    // Taker elements
    const quizActiveState = document.getElementById('quiz-active-state');
    const quizResultState = document.getElementById('quiz-result-state');
    const quizEmptyState = document.getElementById('quiz-empty-state');
    const activeQText = document.getElementById('active-q-text');
    const activeQOptions = document.getElementById('active-q-options');
    const submitQBtn = document.getElementById('submit-q-btn');
    const nextQBtn = document.getElementById('next-q-btn');
    const qFeedback = document.getElementById('q-feedback');
    const quizScore = document.getElementById('quiz-score');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');

    const saveQuiz = () => {
        localStorage.setItem('studyChamp_quiz', JSON.stringify(quizQuestions));
    };

    // Quiz Tabs
    quizTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            quizTabBtns.forEach(b => b.classList.remove('active'));
            qTabContents.forEach(tc => tc.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-qtarget');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'take-quiz') {
                startQuiz();
            }
        });
    });

    const updateQuizPreview = () => {
        quizListPreview.innerHTML = '';
        quizQuestions.forEach((q, index) => {
            const div = document.createElement('div');
            div.className = 'q-preview-item';
            div.innerHTML = `
                <span><strong>Q${index+1}:</strong> ${q.question}</span>
                <button onclick="window.deleteQuizQuestion(${index})" title="Delete Question"><i class="fa-solid fa-trash"></i></button>
            `;
            quizListPreview.appendChild(div);
        });
    };

    window.deleteQuizQuestion = (index) => {
        if(confirm("Delete this quiz question?")) {
            quizQuestions.splice(index, 1);
            saveQuiz();
            updateQuizPreview();
        }
    };

    addQuizBtn.addEventListener('click', () => {
        const q = quizQuestionInput.value.trim();
        const o1 = quizOpt1.value.trim();
        const o2 = quizOpt2.value.trim();
        const o3 = quizOpt3.value.trim();
        const o4 = quizOpt4.value.trim();

        if (q && o1 && o2) {
            const options = [o1, o2];
            if(o3) options.push(o3);
            if(o4) options.push(o4);

            quizQuestions.push({
                question: q,
                options: options,
                correctAnswer: o1 // First input is always correctly marked
            });
            saveQuiz();
            
            // clear inputs
            quizQuestionInput.value = '';
            quizOpt1.value = '';
            quizOpt2.value = '';
            quizOpt3.value = '';
            quizOpt4.value = '';
            
            updateQuizPreview();
        } else {
            alert('Please enter a question and at least 2 options (Option 1 must be correct).');
        }
    });

    const shuffleArray = (array) => {
        let curId = array.length;
        while (0 !== curId) {
            let randId = Math.floor(Math.random() * curId);
            curId -= 1;
            let tmp = array[curId];
            array[curId] = array[randId];
            array[randId] = tmp;
        }
        return array;
    };

    const startQuiz = () => {
        if (quizQuestions.length === 0) {
            quizActiveState.classList.add('hidden');
            quizResultState.classList.add('hidden');
            quizEmptyState.classList.remove('hidden');
            return;
        }
        quizEmptyState.classList.add('hidden');
        quizResultState.classList.add('hidden');
        quizActiveState.classList.remove('hidden');
        
        currentQuizIndex = 0;
        score = 0;
        loadQuizQuestion();
    };

    const loadQuizQuestion = () => {
        const q = quizQuestions[currentQuizIndex];
        activeQText.textContent = `Q${currentQuizIndex + 1}: ${q.question}`;
        
        const shuffledOptions = shuffleArray([...q.options]);
        
        activeQOptions.innerHTML = '';
        selectedOptionIndex = null;
        submitQBtn.disabled = true;
        submitQBtn.classList.remove('hidden');
        nextQBtn.classList.add('hidden');
        qFeedback.classList.add('hidden');

        shuffledOptions.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = 'quiz-option';
            div.textContent = opt;
            div.addEventListener('click', () => {
                if (submitQBtn.classList.contains('hidden')) return; // Already submitted
                Array.from(activeQOptions.children).forEach(c => c.classList.remove('selected'));
                div.classList.add('selected');
                selectedOptionIndex = idx;
                submitQBtn.disabled = false;
            });
            activeQOptions.appendChild(div);
        });
    };

    submitQBtn.addEventListener('click', () => {
        if (selectedOptionIndex === null) return;
        
        const q = quizQuestions[currentQuizIndex];
        const selectedText = activeQOptions.children[selectedOptionIndex].textContent;
        const isCorrect = selectedText === q.correctAnswer;

        // Reveal answers
        Array.from(activeQOptions.children).forEach(c => {
            c.style.pointerEvents = 'none'; // disable clicks
            if (c.textContent === q.correctAnswer) {
                c.classList.add('correct');
            } else if (c.classList.contains('selected') && !isCorrect) {
                c.classList.add('incorrect');
            }
        });

        qFeedback.classList.remove('hidden', 'correct-text', 'incorrect-text');
        if (isCorrect) {
            score++;
            qFeedback.textContent = 'Correct! Great job.';
            qFeedback.classList.add('correct-text');
        } else {
            qFeedback.textContent = `Incorrect! The correct answer was: ${q.correctAnswer}`;
            qFeedback.classList.add('incorrect-text');
        }

        submitQBtn.classList.add('hidden');
        nextQBtn.classList.remove('hidden');
        
        if (currentQuizIndex === quizQuestions.length - 1) {
            nextQBtn.textContent = 'Finish Quiz';
        } else {
            nextQBtn.textContent = 'Next Question';
        }
    });

    nextQBtn.addEventListener('click', () => {
        currentQuizIndex++;
        if (currentQuizIndex < quizQuestions.length) {
            loadQuizQuestion();
        } else {
            showQuizResults();
        }
    });

    const showQuizResults = () => {
        quizActiveState.classList.add('hidden');
        quizResultState.classList.remove('hidden');
        quizScore.textContent = `${score} / ${quizQuestions.length}`;
    };

    restartQuizBtn.addEventListener('click', startQuiz);

    // Initial call
    updateQuizPreview();
});
