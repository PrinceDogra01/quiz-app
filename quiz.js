// Quiz logic extracted from user's code, adapted to integrate with the Space login

// ----- Player Info & Page Navigation -----
let playerName = '';
let playerEmail = '';

function goToGreeting() {
  playerName = document.getElementById('playerName').value.trim();
  playerEmail = document.getElementById('playerEmail').value.trim();
  const age = document.getElementById('playerAge').value.trim();
  const gender = document.getElementById('playerGender').value;
  if (!playerName || !playerEmail || !age || !gender) {
    alert("Please fill all fields!");
    return;
  }
  try {
    localStorage.setItem('player_name', playerName);
    localStorage.setItem('player_email', playerEmail);
  } catch (e) {}
  const greeting = document.getElementById('greeting-text');
  if (greeting) greeting.textContent = `Welcome, ${playerName}!`;
  // hide the login card
  const container = document.querySelector('.container');
  if (container) container.style.display = 'none';
  const gp = document.getElementById('greeting-page');
  if (gp) gp.style.display = 'flex';
  typeWriter();
}

function goToRules() {
  document.getElementById('greeting-page').style.display='none';
  document.getElementById('rules-page').style.display='flex';
}

function startQuiz() {
  document.getElementById('rules-page').style.display='none';
  document.getElementById('category-page').style.display='flex';
  renderLeaderboard();
}

function goToNextLevel() {
  document.getElementById('congrats-page').style.display = 'none';
  document.getElementById('quiz-page').style.display = 'flex';
  loadRound();
}

// Typing Effect
function typeWriter() {
  const aiMessageEl = document.getElementById("ai-message");
  const name = document.getElementById('playerName').value.trim();
  const greetingText = `Hi My name is Prince Dogra and I welcome you to this Mission Control. Are you excited to complete this mission, ${name}?`;
  aiMessageEl.innerHTML = "";
  let i = 0;
  (function type(){
    if (i < greetingText.length) {
      aiMessageEl.innerHTML += greetingText.charAt(i);
      i++;
      setTimeout(type, 30);
    }
  })();
}

// ----- API Mapping -----
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

// ----- Quiz Logic -----
const roundQuestionsCount = [6, 10, 12];
const passingScores = [4, 7, 8];
const triviaDifficulties = ["easy", "medium", "hard"];
const TIMER_DURATION_PER_QUESTION = 30;

let currentRound = 0, currentQuestionIndex = 0, correctAnswersInRound = 0, totalScore = 0, currentQuestions = [], currentCategory = '';
let timerInterval, timeLeft = TIMER_DURATION_PER_QUESTION;

function startCategoryQuiz(category){
  currentCategory = category;
  document.getElementById('category-page').style.display='none';
  document.getElementById('quiz-page').style.display='flex';
  document.getElementById('game-title').textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Mission`;
  startMission();
}

function shuffleArray(array){ for(let i=array.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]]; } }
function decodeHtml(html){ const txt=document.createElement("textarea"); txt.innerHTML=html; return txt.value; }

function startMission() {
  currentRound=0; currentQuestionIndex=0; correctAnswersInRound=0; totalScore=0;
  document.getElementById('score-info').textContent = `Score: 0`;
  loadRound();
}

async function loadRound() {
  clearInterval(timerInterval);
  correctAnswersInRound=0;
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

function updateProgressBar() {
  const progressBar = document.getElementById('progress-bar');
  const totalQuestions = roundQuestionsCount[currentRound];
  const progressPercentage = ((currentQuestionIndex) / totalQuestions) * 100;
  progressBar.style.width = `${progressPercentage}%`;
}

function loadQuestion() {
  clearInterval(timerInterval);
  timeLeft = TIMER_DURATION_PER_QUESTION;
  const timerEl = document.getElementById('timer');
  timerEl.textContent = timeLeft;
  timerEl.classList.remove('low-time');
  updateProgressBar();
  if(currentQuestionIndex >= currentQuestions.length){ endRound(); return; }
  const questionEl = document.getElementById('question');
  const answersEl = document.getElementById('answers');
  answersEl.innerHTML = "";
  const q = currentQuestions[currentQuestionIndex];
  questionEl.textContent = `Mission ${currentRound+1} Q${currentQuestionIndex+1}: ${decodeHtml(q.question)}`;
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
    } else {
      timerEl.classList.remove('low-time');
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      sfxTimeUp.play();
      const buttons = document.querySelectorAll('#answers button');
      buttons.forEach(b => b.disabled = true);
      buttons.forEach(b => { 
        if(b.textContent === decodeHtml(currentQuestions[currentQuestionIndex].correct_answer)) {
          b.style.backgroundColor = 'green';
        }
      });
      setTimeout(() => { currentQuestionIndex++; loadQuestion(); }, 2000);
    }
  }, 1000);
}

function checkAnswer(selected, correct, btn){
  clearInterval(timerInterval);
  const timerEl = document.getElementById('timer');
  timerEl.classList.remove('low-time');
  const buttons = document.querySelectorAll('#answers button');
  buttons.forEach(b => b.disabled = true);
  if(selected === correct){
    document.getElementById('sfx-correct').play();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    totalScore++; 
    correctAnswersInRound++;
    btn.style.backgroundColor = 'green';
  } else {
    document.getElementById('sfx-wrong').play();
    btn.style.backgroundColor = 'red';
    buttons.forEach(b => { if(b.textContent === decodeHtml(correct)) { b.style.backgroundColor = 'green'; } });
  }
  document.getElementById('score-info').textContent = `Score: ${totalScore}`;
  setTimeout(() => { currentQuestionIndex++; loadQuestion(); }, 2000);
}

function endRound() {
  clearInterval(timerInterval);
  const totalQuestionsThisRound = roundQuestionsCount[currentRound];
  const passed = correctAnswersInRound >= passingScores[currentRound];
  // Always save before showing result
  saveScoreToLeaderboard();
  // Hide quiz page
  document.getElementById('quiz-page').style.display = 'none';

  const resultPage = document.getElementById('round-result-page');
  const titleEl = document.getElementById('round-result-title');
  const textEl = document.getElementById('round-result-text');
  const statsEl = document.getElementById('round-result-stats');
  const btnEl = document.getElementById('round-result-btn');

  if (!resultPage || !titleEl || !textEl || !statsEl || !btnEl) {
    // Fallback if elements missing
    if (passed) {
      alert(`Mission ${currentRound + 1} Complete! Round Score: ${correctAnswersInRound}/${totalQuestionsThisRound}. Total: ${totalScore}`);
      currentRound++;
      if (currentRound < roundQuestionsCount.length) {
        goToNextLevel();
      } else {
        goBackToCategories();
      }
    } else {
      alert(`Mission Failed! Round Score: ${correctAnswersInRound}/${totalQuestionsThisRound}. Total: ${totalScore}`);
      goBackToCategories();
    }
    return;
  }

  // Fill content
  statsEl.textContent = `Round Score: ${correctAnswersInRound}/${totalQuestionsThisRound} • Total Score: ${totalScore}`;

  if (passed) {
    titleEl.textContent = `Mission ${currentRound + 1} Accomplished!`;
    textEl.textContent = `Congratulations, ${playerName}! Prepare for the next mission.`;
    btnEl.textContent = 'Next Mission';
    btnEl.onclick = () => {
      resultPage.style.display = 'none';
      currentRound++;
      if (currentRound < roundQuestionsCount.length) {
        document.getElementById('congrats-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'flex';
        loadRound();
      } else {
        // All missions done -> back to categories
        goBackToCategories();
      }
    };
  } else {
    titleEl.textContent = `Mission ${currentRound + 1} Failed`;
    textEl.textContent = `Sorry, Space Cadet. Keep it up and try again!`;
    btnEl.textContent = 'Back to Categories';
    btnEl.onclick = () => {
      resultPage.style.display = 'none';
      goBackToCategories();
    };
  }

  resultPage.style.display = 'flex';
}

function goBackToCategories() {
  clearInterval(timerInterval);
  document.getElementById('quiz-page').style.display = 'none';
  document.getElementById('congrats-page').style.display = 'none';
  document.getElementById('category-page').style.display = 'flex';
  currentRound = 0;
  totalScore = 0;
  renderLeaderboard();
}

function getCurrentWeekKey() {
  const now = new Date();
  const firstJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - firstJan) / 86400000);
  const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function renderLeaderboard() {
  const allTime = JSON.parse(localStorage.getItem("leaderboard")) || [];
  const listAll = document.getElementById("leaderboard-list");
  const weekKey = getCurrentWeekKey();
  const weekly = JSON.parse(localStorage.getItem(`leaderboard_week_${weekKey}`)) || [];
  const listWeekly = document.getElementById("leaderboard-list-weekly");

  if (listAll) {
    const myAllTime = playerEmail ? allTime.filter(p => p.email === playerEmail) : [];
    myAllTime.sort((a, b) => b.score - a.score);
    listAll.innerHTML = "";
    myAllTime.slice(0, 5).forEach(p => {
      const li = document.createElement("li");
      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = p.name;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'item-score';
      scoreSpan.textContent = `${p.score} pts`;
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      listAll.appendChild(li);
    });
  }

  if (listWeekly) {
    const myWeekly = playerEmail ? weekly.filter(p => p.email === playerEmail) : [];
    myWeekly.sort((a, b) => b.score - a.score);
    listWeekly.innerHTML = "";
    myWeekly.slice(0, 5).forEach(p => {
      const li = document.createElement("li");
      const nameSpan = document.createElement('span');
      nameSpan.className = 'item-name';
      nameSpan.textContent = p.name;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'item-score';
      scoreSpan.textContent = `${p.score} pts`;
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      listWeekly.appendChild(li);
    });
  }
}

function saveScoreToLeaderboard() {
  // All‑time
  let board = JSON.parse(localStorage.getItem("leaderboard")) || [];
  const existingIdx = board.findIndex(player => player.email === playerEmail);
  if (existingIdx !== -1) {
    if (totalScore > board[existingIdx].score) {
      board[existingIdx].score = totalScore;
      board[existingIdx].name = playerName;
    }
  } else {
    board.push({ name: playerName, email: playerEmail, score: totalScore });
  }
  localStorage.setItem("leaderboard", JSON.stringify(board));

  // Weekly
  const weekKey = getCurrentWeekKey();
  let wboard = JSON.parse(localStorage.getItem(`leaderboard_week_${weekKey}`)) || [];
  const wIdx = wboard.findIndex(player => player.email === playerEmail);
  if (wIdx !== -1) {
    if (totalScore > wboard[wIdx].score) {
      wboard[wIdx].score = totalScore;
      wboard[wIdx].name = playerName;
    }
  } else {
    wboard.push({ name: playerName, email: playerEmail, score: totalScore });
  }
  localStorage.setItem(`leaderboard_week_${weekKey}`, JSON.stringify(wboard));

  renderLeaderboard();
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const storedName = localStorage.getItem('player_name');
    const storedEmail = localStorage.getItem('player_email');
    if (storedName) playerName = storedName;
    if (storedEmail) playerEmail = storedEmail;
  } catch (e) {}
  renderLeaderboard();
});

// Remove any legacy placeholder entries saved with default email
document.addEventListener('DOMContentLoaded', () => {
  const legacyEmail = 'player@mission.com';
  let board = JSON.parse(localStorage.getItem('leaderboard')) || [];
  const newBoard = board.filter(p => p.email !== legacyEmail);
  if (newBoard.length !== board.length) {
    localStorage.setItem('leaderboard', JSON.stringify(newBoard));
  }
  const weekKey = getCurrentWeekKey();
  let wboard = JSON.parse(localStorage.getItem(`leaderboard_week_${weekKey}`)) || [];
  const newW = wboard.filter(p => p.email !== legacyEmail);
  if (newW.length !== wboard.length) {
    localStorage.setItem(`leaderboard_week_${weekKey}`, JSON.stringify(newW));
  }
});


