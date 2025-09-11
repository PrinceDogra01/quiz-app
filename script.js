// ----- Global Variables -----
const apiLinks = {
    general: {
        easy: "https://opentdb.com/api.php?amount=6&category=9&difficulty=easy&type=multiple",
        medium: "https://opentdb.com/api.php?amount=10&category=9&difficulty=medium&type=multiple",
        hard: "https://opentdb.com/api.php?amount=12&category=9&difficulty=hard&type=multiple"
    },
    engineering: {
        easy: "https://opentdb.com/api.php?amount=6&category=18&difficulty=easy&type=multiple",
        medium: "https://opentdb.com/api.php?amount=10&category=18&difficulty=medium&type=multiple",
        hard: "https://opentdb.com/api.php?amount=12&category=18&difficulty=hard&type=multiple"
    },
    medical: {
        easy: "https://opentdb.com/api.php?amount=6&category=17&difficulty=easy&type=multiple",
        medium: "https://opentdb.com/api.php?amount=10&category=17&difficulty=medium&type=multiple",
        hard: "https://opentdb.com/api.php?amount=12&category=17&difficulty=hard&type=multiple"
    },
    sports: {
        easy: "https://opentdb.com/api.php?amount=6&category=21&difficulty=easy&type=multiple",
        medium: "https://opentdb.com/api.php?amount=10&category=21&difficulty=medium&type=multiple",
        hard: "https://opentdb.com/api.php?amount=12&category=21&difficulty=hard&type=multiple"
    }
};

const roundQuestionsCount = [6, 10, 12];
const passingScores = [4, 7, 8];
const triviaDifficulties = ["easy", "medium", "hard"];
const TIMER_DURATION_PER_QUESTION = 30;

let currentRound = 0, currentQuestionIndex = 0, correctAnswersInRound = 0, totalScore = 0, currentQuestions = [], currentCategory = '', playerName = '';
let timerInterval, timeLeft = TIMER_DURATION_PER_QUESTION;


// ----- Page Navigation & Setup -----
function goToGreeting() {
    playerName = document.getElementById('playerName').value.trim();
    const age = document.getElementById('playerAge').value.trim();
    const gender = document.getElementById('playerGender').value;

    if (!playerName || !age || !gender) {
        alert("Please fill all fields!");
        return;
    }

    document.getElementById('greeting-text').textContent = `Welcome, ${playerName}!`;
    document.getElementById('input-page').style.display = 'none';
    document.getElementById('greeting-page').style.display = 'flex';
    typeWriter();
}

function goToRules() {
    document.getElementById('greeting-page').style.display = 'none';
    document.getElementById('rules-page').style.display = 'flex';
}

function startQuiz() {
    document.getElementById('rules-page').style.display = 'none';
    document.getElementById('category-page').style.display = 'flex';
}

function goToNextLevel() {
    document.getElementById('congrats-page').style.display = 'none';
    document.getElementById('quiz-page').style.display = 'flex';
    loadRound();
}

function goBackToCategories() {
    clearInterval(timerInterval);
    document.getElementById('quiz-page').style.display = 'none';
    document.getElementById('congrats-page').style.display = 'none';
    document.getElementById('category-page').style.display = 'flex';
    currentRound = 0;
    totalScore = 0;
}

// Typing Effect
function typeWriter() {
    const aiMessageEl = document.getElementById("ai-message");
    const name = document.getElementById('playerName').value.trim();
    const greetingText = `Hi My name is Prince Dogra and I welcome you to this Mission Control. Are you excited to complete this mission, ${name}?`;
    aiMessageEl.innerHTML = "";
    let i = 0;

    function type() {
        if (i < greetingText.length) {
            aiMessageEl.innerHTML += greetingText.charAt(i);
            i++;
            setTimeout(type, 30);
        }
    }
    type();
}


// ----- Quiz Logic -----
function startCategoryQuiz(category) {
    currentCategory = category;
    document.getElementById('category-page').style.display = 'none';
    document.getElementById('quiz-page').style.display = 'flex';
    document.getElementById('game-title').textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Mission`;
    startMission();
}

function startMission() {
    currentRound = 0;
    currentQuestionIndex = 0;
    correctAnswersInRound = 0;
    totalScore = 0;
    document.getElementById('score-info').textContent = `Score: 0`; // Reset score display
    loadRound();
}

async function loadRound() {
    clearInterval(timerInterval);
    correctAnswersInRound = 0;
    currentQuestionIndex = 0;
    const difficulty = triviaDifficulties[currentRound];
    const url = apiLinks[currentCategory][difficulty];

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.response_code === 0 && data.results.length > 0) {
            currentQuestions = data.results;
            loadQuestion();
        } else {
            alert("Could not fetch mission data. Please try another category.");
            goBackToCategories();
        }
    } catch (error) {
        alert("Network error. Could not connect to mission control.");
        goBackToCategories();
    }
}

function loadQuestion() {
    clearInterval(timerInterval);
    timeLeft = TIMER_DURATION_PER_QUESTION;
    const timerEl = document.getElementById('timer');
    timerEl.textContent = timeLeft;
    timerEl.classList.remove('low-time');
    updateProgressBar();

    if (currentQuestionIndex >= currentQuestions.length) {
        endRound();
        return;
    }

    const questionEl = document.getElementById('question');
    const answersEl = document.getElementById('answers');
    answersEl.innerHTML = "";

    const q = currentQuestions[currentQuestionIndex];
    questionEl.textContent = `Mission ${currentRound + 1} Q${currentQuestionIndex + 1}: ${decodeHtml(q.question)}`;
    const allAnswers = [...q.incorrect_answers, q.correct_answer];
    shuffleArray(allAnswers);

    allAnswers.forEach(ans => {
        const btn = document.createElement('button');
        btn.textContent = decodeHtml(ans);
        btn.className = 'quiz-btn';
        btn.onclick = () => checkAnswer(ans, q.correct_answer, btn);
        answersEl.appendChild(btn);
    });

    startQuestionTimer();
}

function startQuestionTimer() {
    const timerEl = document.getElementById('timer');
    const sfxTick = document.getElementById('sfx-tick');
    const sfxTimeUp = document.getElementById('sfx-timeup');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;

        if (timeLeft <= 10 && timeLeft > 0) {
            timerEl.classList.add('low-time');
            sfxTick.play();
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            sfxTimeUp.play();
            const buttons = document.querySelectorAll('#answers button');
            buttons.forEach(b => {
                b.disabled = true;
                if (b.textContent === decodeHtml(currentQuestions[currentQuestionIndex].correct_answer)) {
                    b.style.backgroundColor = 'green';
                }
            });
            setTimeout(() => {
                currentQuestionIndex++;
                loadQuestion();
            }, 2000);
        }
    }, 1000);
}

function checkAnswer(selected, correct, btn) {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('timer');
    timerEl.classList.remove('low-time');

    const buttons = document.querySelectorAll('#answers button');
    buttons.forEach(b => b.disabled = true);

    if (selected === correct) {
        document.getElementById('sfx-correct').play();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        totalScore++;
        correctAnswersInRound++;
        btn.style.backgroundColor = 'green';
    } else {
        document.getElementById('sfx-wrong').play();
        btn.style.backgroundColor = 'red';
        buttons.forEach(b => {
            if (b.textContent === decodeHtml(correct)) {
                b.style.backgroundColor = 'green';
            }
        });
    }
    document.getElementById('score-info').textContent = `Score: ${totalScore}`;
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 2000);
}

function endRound() {
    clearInterval(timerInterval);

    if (correctAnswersInRound >= passingScores[currentRound]) {
        currentRound++; // Move to the next round index

        if (currentRound < roundQuestionsCount.length) {
            // Player passed and there is a next level
            document.getElementById('quiz-page').style.display = 'none';
            document.getElementById('congrats-page').style.display = 'flex';
            document.getElementById('congrats-text').textContent = `You have successfully completed Mission ${currentRound}! Now preparing for your next mission.`;
        } else {
            // Player passed the FINAL round and won the game
            saveScoreToLeaderboard();
            alert(`Congratulations, ${playerName}! All missions complete! Your final score is: ${totalScore}`);
            location.reload();
        }
    } else {
        // Player failed the current round
        saveScoreToLeaderboard(); // Save score even on failure
        alert(`Mission Failed! You only scored ${correctAnswersInRound}/${roundQuestionsCount[currentRound]}. Try again, Space Cadet.`);
        location.reload(); // Reload to start over
    }
}


// ----- Helper & Utility Functions -----
function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const totalQuestions = roundQuestionsCount[currentRound];
    const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;
    progressBar.style.width = `${progressPercentage}%`;
}

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


// ----- Leaderboard Logic -----
function renderLeaderboard() {
    const board = JSON.parse(localStorage.getItem("leaderboard")) || [];
    const listEl = document.getElementById("leaderboard-list");
    
    board.sort((a, b) => b.score - a.score);
    listEl.innerHTML = "";

    board.slice(0, 5).forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player.name} - ${player.score} pts`;
        listEl.appendChild(li);
    });
}

function saveScoreToLeaderboard() {
    let board = JSON.parse(localStorage.getItem("leaderboard")) || [];
    const existingPlayerIndex = board.findIndex(player => player.name === playerName);

    if (existingPlayerIndex !== -1) {
        if (totalScore > board[existingPlayerIndex].score) {
            board[existingPlayerIndex].score = totalScore;
        }
    } else {
        const newScore = {
            name: playerName,
            score: totalScore,
        };
        board.push(newScore);
    }
    localStorage.setItem("leaderboard", JSON.stringify(board));
    renderLeaderboard();
}

// Initial call to render the leaderboard when the page loads
document.addEventListener('DOMContentLoaded', renderLeaderboard);