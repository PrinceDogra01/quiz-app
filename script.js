const roundQuestionsCount = [10, 12, 15];
const passingScores = [7, 10, 12];
const triviaDifficulties = ["easy", "medium", "hard"];
const triviaCategories = [
    "&category=9", // General Knowledge
    "&category=18", // Science: Computers
    "&category=21", // Sports
    "&category=23", // History
    "&category=22", // Geography
    "&category=17", // Science & Nature
    "&category=10", // Entertainment: Books
    "&category=11" // Entertainment: Film
];
const TIMER_DURATION = 30;

let gameUI = {};
let currentRound = 0;
let currentQuestionIndex = 0;
let correctAnswersInRound = 0;
let totalScore = 0;
let currentQuestions = [];
let roundScores = [0, 0, 0];
let timerInterval;

// Utility functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function showMessage(text, colorClasses) {
    gameUI.messageBox.textContent = text;
    gameUI.messageBox.className = `message-box text-center text-2xl font-bold p-4 rounded-xl text-gray-900 ${colorClasses}`;
    gameUI.messageBox.classList.remove('hidden');
}

function hideMessage() {
    gameUI.messageBox.classList.add('hidden');
}

// --- Game Logic ---

// Fetch questions for the current round
async function fetchQuestions() {
    gameUI.loadingSpinner.classList.remove('hidden');
    gameUI.questionElement.textContent = 'AI Assistant: Calculating quantum hyper-jump... fetching mission data...';
    gameUI.answersContainer.innerHTML = '';
    gameUI.actionBtn.style.display = 'none';

    try {
        const difficulty = triviaDifficulties[currentRound];
        const amount = roundQuestionsCount[currentRound];
        const allQuestions = [];

        while (allQuestions.length < amount) {
            const category = triviaCategories[Math.floor(Math.random() * triviaCategories.length)];
            const url = `https://opentdb.com/api.php?amount=${amount - allQuestions.length}&difficulty=${difficulty}&type=multiple${category}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.response_code === 0 && data.results.length > 0) {
                allQuestions.push(...data.results);
            } else {
                break;
            }
        }
        shuffleArray(allQuestions);
        currentQuestions = allQuestions.slice(0, amount);

        if (currentQuestions.length === 0) {
            throw new Error('Mission data corrupted. Unable to retrieve questions.');
        }

        gameUI.loadingSpinner.classList.add('hidden');
        startQuestionCountdown();

    } catch (error) {
        console.error("Mission failed:", error);
        showMessage('AI Assistant: Mission data lost. Please initiate diagnostics.', 'bg-red-600 text-white');
        gameUI.loadingSpinner.classList.add('hidden');
        gameUI.actionBtn.style.display = 'block';
        gameUI.actionBtn.textContent = 'Retry Mission';
        gameUI.actionBtn.onclick = startMission;
    }
}

// Start a 3-second countdown before the question appears
function startQuestionCountdown() {
    gameUI.answersContainer.innerHTML = '';
    gameUI.countdownText.textContent = 3;
    gameUI.countdownText.style.display = 'block';
    gameUI.timerRing.style.display = 'none';

    let countdown = 3;
    const countdownInterval = setInterval(() => {
        gameUI.sfxCountdown.play();
        countdown--;
        if (countdown > 0) {
            gameUI.countdownText.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            gameUI.countdownText.style.display = 'none';
            loadQuestion();
        }
    }, 1000);
}

// Load and display the current question
function loadQuestion() {
    clearInterval(timerInterval);
    gameUI.timerRing.style.display = 'block';

    if (currentQuestionIndex >= currentQuestions.length) {
        endRound();
        return;
    }
    hideMessage();
    gameUI.actionBtn.style.display = 'none';

    const q = currentQuestions[currentQuestionIndex];
    const allAnswers = [...q.incorrect_answers, q.correct_answer];
    shuffleArray(allAnswers);

    gameUI.questionElement.textContent = `Mission ${currentRound + 1}: Q${currentQuestionIndex + 1}/${currentQuestions.length} - ${decodeHtml(q.question)}`;
    gameUI.answersContainer.innerHTML = "";

    allAnswers.forEach((ans) => {
        const button = document.createElement('button');
        button.textContent = decodeHtml(ans);
        button.className = 'w-full py-3 px-4 rounded-xl text-lg font-medium text-gray-100 transition-colors duration-200 bg-gray-700 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800';
        button.onclick = () => checkAnswer(ans, q.correct_answer, button);
        gameUI.answersContainer.appendChild(button);
    });

    startTimer();
}

// Start the circular timer
function startTimer() {
    let timeLeft = TIMER_DURATION;
    gameUI.countdownText.textContent = timeLeft;
    gameUI.countdownText.style.display = 'block';

    const circumference = 2 * Math.PI * 45; // Based on r="45"
    gameUI.timerRing.style.strokeDasharray = circumference;

    timerInterval = setInterval(() => {
        timeLeft--;
        const offset = circumference * (timeLeft / TIMER_DURATION);
        gameUI.timerRing.style.strokeDashoffset = offset;
        gameUI.countdownText.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkAnswer(null, currentQuestions[currentQuestionIndex].correct_answer, null);
        }
    }, 1000);
}

// Check the selected answer
function checkAnswer(selectedAnswer, correctAnswer, button) {
    clearInterval(timerInterval);
    gameUI.countdownText.style.display = 'none';
    gameUI.timerRing.style.display = 'none';

    const buttons = gameUI.answersContainer.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect) {
        gameUI.sfxCorrect.play();
        correctAnswersInRound++;
        totalScore++;
        if (button) {
            button.classList.remove('bg-gray-700', 'hover:bg-indigo-600');
            button.classList.add('bg-green-600', 'correct-answer-effect');
        }
        showMessage('AI Assistant: Correct! Commendable performance!', 'bg-green-600 text-white');
    } else {
        gameUI.sfxWrong.play();
        if (button) {
            button.classList.remove('bg-gray-700', 'hover:bg-indigo-600');
            button.classList.add('bg-red-600', 'wrong-answer-effect');
        }
        buttons.forEach(btn => {
            if (btn.textContent === decodeHtml(correctAnswer)) {
                btn.classList.remove('bg-gray-700', 'hover:bg-indigo-600');
                btn.classList.add('bg-green-600');
            }
        });
        showMessage('AI Assistant: Incorrect. The correct answer is highlighted.', 'bg-red-600 text-white');
    }
    updateUI();
    setTimeout(() => {
        currentQuestionIndex++;
        startQuestionCountdown();
    }, 2500);
}

// End the current round
function endRound() {
    roundScores[currentRound] = correctAnswersInRound;
    const passed = correctAnswersInRound >= passingScores[currentRound];

    if (passed) {
        currentRound++;
        if (currentRound < roundQuestionsCount.length) {
            currentQuestionIndex = 0;
            correctAnswersInRound = 0;
            showMessage(`AI Assistant: Mission ${currentRound} Complete! Commencing Mission ${currentRound + 1} (${triviaDifficulties[currentRound]} difficulty).`, 'bg-green-600 text-white');
            gameUI.actionBtn.textContent = 'Begin Next Mission';
            gameUI.actionBtn.onclick = fetchQuestions;
            gameUI.actionBtn.style.display = 'block';
        } else {
            showFinalScorecard();
        }
    } else {
        gameUI.answersContainer.innerHTML = '';
        gameUI.questionElement.textContent = 'AI Assistant: Mission Failed. You did not meet the required score.';
        showMessage(`AI Assistant: Mission Failed. Minimum score is ${passingScores[currentRound]}. Please try again.`, 'bg-red-600 text-white');
        gameUI.actionBtn.textContent = 'Re-attempt Mission';
        gameUI.actionBtn.onclick = () => {
            totalScore -= correctAnswersInRound;
            correctAnswersInRound = 0;
            currentQuestionIndex = 0;
            updateUI();
            fetchQuestions();
        };
        gameUI.actionBtn.style.display = 'block';
    }
}

// Update UI displays
function updateUI() {
    gameUI.roundInfo.textContent = `Mission ${currentRound + 1}`;
    gameUI.scoreInfo.textContent = `Score: ${totalScore}`;
}

// Display final scorecard
function showFinalScorecard() {
    gameUI.sfxVictory.play();
    gameUI.answersContainer.innerHTML = `
        <div class="text-center space-y-4">
            <p class="text-3xl font-bold text-indigo-400">AI Assistant: Mission Accomplished!</p>
            <p class="text-xl font-medium">You have completed all missions. Here is your final report.</p>
            <div class="bg-gray-700 p-6 rounded-xl space-y-3 border border-indigo-500">
                <p class="text-xl font-bold">Mission Report</p>
                <p>Mission 1 (Easy): <span class="text-indigo-300">${roundScores[0]} / ${roundQuestionsCount[0]}</span></p>
                <p>Mission 2 (Medium): <span class="text-indigo-300">${roundScores[1]} / ${roundQuestionsCount[1]}</span></p>
                <p>Mission 3 (Hard): <span class="text-indigo-300">${roundScores[2]} / ${roundQuestionsCount[2]}</span></p>
            </div>
            <p class="text-3xl font-bold mt-6">Total Score: ${totalScore}</p>
        </div>
    `;
    gameUI.questionElement.textContent = 'Congratulations, Commander!';
    gameUI.actionBtn.textContent = 'Replay Mission?';
    gameUI.actionBtn.onclick = startMission;
    gameUI.actionBtn.style.display = 'block';
}

// Initial game setup
function startMission() {
    gameUI.gameContainer = document.getElementById('game-container');
    gameUI.gameTitle = document.getElementById('game-title');
    gameUI.roundInfo = document.getElementById('round-info');
    gameUI.scoreInfo = document.getElementById('score-info');
    gameUI.questionElement = document.getElementById('question');
    gameUI.answersContainer = document.getElementById('answers');
    gameUI.actionBtn = document.getElementById('action-btn');
    gameUI.messageBox = document.getElementById('message-box');
    gameUI.loadingSpinner = document.getElementById('loading-spinner');
    gameUI.timerRing = document.getElementById('timer-ring');
    gameUI.countdownText = document.getElementById('countdown-text');
    gameUI.sfxCorrect = document.getElementById('sfx-correct');
    gameUI.sfxWrong = document.getElementById('sfx-wrong');
    gameUI.sfxCountdown = document.getElementById('sfx-countdown');
    gameUI.sfxVictory = document.getElementById('sfx-victory');

    currentRound = 0;
    currentQuestionIndex = 0;
    correctAnswersInRound = 0;
    totalScore = 0;
    roundScores = [0, 0, 0];
    hideMessage();
    updateUI();

    // Immediately start fetching questions for the first round
    fetchQuestions();
}

// Call the initial setup function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startMission);
