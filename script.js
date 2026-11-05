"use strict";

const WORDS = [
  "gato", "casa", "bola", "livro", "tempo", "amigo",
  "praia", "festa", "mundo", "planta", "carro", "janela",
  "doce", "fruta", "noite", "sonho"
];

const MAX_ATTEMPTS = 6;
const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "<zxcvbnm>"];

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const messageEl = document.getElementById("message");
const modalEl = document.getElementById("modal");
const modalBox = modalEl.querySelector(".modal-box");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");

let secret, cols, row, current, over, keyState;
let lastWord = null;

function newGame() {
  const pool = WORDS.filter(w => w !== lastWord);
  secret = pool[Math.floor(Math.random() * pool.length)];
  lastWord = secret;
  cols = secret.length;
  row = 0;
  current = "";
  over = false;
  keyState = {};
  setMessage("");
  modalEl.classList.add("hidden");
  buildBoard();
  buildKeyboard();
}

function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    rowEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    for (let c = 0; c < cols; c++) {
      const t = document.createElement("div");
      t.className = "tile";
      rowEl.appendChild(t);
    }
    boardEl.appendChild(rowEl);
  }
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  KEY_ROWS.forEach(letters => {
    const r = document.createElement("div");
    r.className = "kb-row";
    for (const ch of letters) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      if (ch === "<") { b.textContent = "⌫"; b.dataset.key = "Backspace"; b.classList.add("wide"); }
      else if (ch === ">") { b.textContent = "Enter"; b.dataset.key = "Enter"; b.classList.add("wide"); }
      else { b.textContent = ch; b.dataset.key = ch; }
      b.addEventListener("click", () => handleKey(b.dataset.key));
      r.appendChild(b);
    }
    keyboardEl.appendChild(r);
  });
}

function setMessage(text) { messageEl.textContent = text; }

function rowTiles(r) { return boardEl.children[r].children; }

function handleKey(key) {
  if (over) return;
  if (key === "Enter") return submit();
  if (key === "Backspace") {
    current = current.slice(0, -1);
  } else if (/^[a-z]$/.test(key) && current.length < cols) {
    current += key;
  } else return;
  const tiles = rowTiles(row);
  for (let i = 0; i < cols; i++) {
    tiles[i].textContent = current[i] || "";
    tiles[i].classList.toggle("filled", i < current.length);
  }
}

function evaluate(guess) {
  const result = Array(cols).fill("absent");
  const remaining = {};
  for (let i = 0; i < cols; i++) {
    if (guess[i] === secret[i]) result[i] = "correct";
    else remaining[secret[i]] = (remaining[secret[i]] || 0) + 1;
  }
  for (let i = 0; i < cols; i++) {
    if (result[i] !== "correct" && remaining[guess[i]] > 0) {
      result[i] = "present";
      remaining[guess[i]]--;
    }
  }
  return result;
}

function submit() {
  if (current.length < cols) {
    shake();
    return setMessage(`A palavra tem ${cols} letras.`);
  }
  if (!WORDS.includes(current)) {
    shake();
    return setMessage("Palavra não está na lista.");
  }
  setMessage("");
  const result = evaluate(current);
  const tiles = rowTiles(row);
  const rank = { absent: 1, present: 2, correct: 3 };
  result.forEach((state, i) => {
    tiles[i].classList.add(state, "reveal");
    tiles[i].style.animationDelay = `${i * 0.1}s`;
    const k = current[i];
    if (!keyState[k] || rank[state] > rank[keyState[k]]) keyState[k] = state;
  });
  keyboardEl.querySelectorAll(".key").forEach(b => {
    const s = keyState[b.dataset.key];
    if (s) { b.classList.remove("correct", "present", "absent"); b.classList.add(s); }
  });

  if (current === secret) return finish(true);
  row++;
  current = "";
  if (row === MAX_ATTEMPTS) finish(false);
}

function shake() {
  const el = boardEl.children[row];
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function finish(won) {
  over = true;
  const attempts = won ? row + 1 : MAX_ATTEMPTS;
  modalBox.className = "modal-box " + (won ? "win" : "lose");
  modalTitle.textContent = won ? "Parabéns, você venceu! 🎉" : "Você perdeu 😞";
  modalText.textContent = won
    ? `Você acertou "${secret.toUpperCase()}" em ${attempts} tentativa(s).`
    : `A palavra era "${secret.toUpperCase()}".`;
  setMessage(won ? "Vitória!" : `Derrota! A palavra era ${secret.toUpperCase()}.`);
  setTimeout(() => modalEl.classList.remove("hidden"), 900);
}

document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter" || e.key === "Backspace") {
    if (document.activeElement && document.activeElement.tagName === "BUTTON") document.activeElement.blur();
    handleKey(e.key);
  } else if (e.key.length === 1) {
    handleKey(e.key.toLowerCase());
  }
});

document.getElementById("new-game").addEventListener("click", e => { e.target.blur(); newGame(); });
document.getElementById("modal-btn").addEventListener("click", newGame);

newGame();
