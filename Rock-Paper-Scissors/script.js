// Keep track of the scores
let winScore = 0;
let loseScore = 0;
let tieScore = 0;

// This function runs every time the player clicks a choice button
function playRound(playerChoice) {
  const options = ['rock', 'paper', 'scissors'];

  // Computer picks randomly from the three options
  const randomIndex = Math.floor(Math.random() * options.length);
  const computerChoice = options[randomIndex];

  // Show both choices on the page
  document.getElementById('playerChoice').textContent = playerChoice;
  document.getElementById('computerChoice').textContent = computerChoice;

  // Figure out who won
  let result = getResult(playerChoice, computerChoice);

  // Update the score based on the result
  if (result === 'win') {
    winScore++;
    document.getElementById('resultText').textContent = "You Win! 🎉";
  } else if (result === 'lose') {
    loseScore++;
    document.getElementById('resultText').textContent = "You Lose! 😢";
  } else {
    tieScore++;
    document.getElementById('resultText').textContent = "It's a Tie! 🤝";
  }

  // Update the scoreboard numbers on the page
  document.getElementById('winScore').textContent = winScore;
  document.getElementById('loseScore').textContent = loseScore;
  document.getElementById('tieScore').textContent = tieScore;
}

// This function compares the two choices and returns 'win', 'lose', or 'tie'
function getResult(player, computer) {
  if (player === computer) {
    return 'tie';
  }

  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win';
  }

  return 'lose';
}

// Resets everything back to the starting state
function resetGame() {
  winScore = 0;
  loseScore = 0;
  tieScore = 0;

  document.getElementById('winScore').textContent = 0;
  document.getElementById('loseScore').textContent = 0;
  document.getElementById('tieScore').textContent = 0;

  document.getElementById('playerChoice').textContent = '-';
  document.getElementById('computerChoice').textContent = '-';
  document.getElementById('resultText').textContent = 'Make your move!';
}
