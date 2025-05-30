let video;
let handPose;
let hands = [];

let questions = [
  { word: "technol__gy", answer: "o", options: ["e", "a", "o", "i", "u"] },
  { word: "_earning", answer: "L", options: ["T", "R", "D", "L", "K"] },
  { word: "M__dia", answer: "e", options: ["o", "u", "e", "a", "i"] },
  { word: "Flip__d", answer: "p", options: ["l", "p", "b", "d", "f"] },
  { word: "ADD__E", answer: "I", options: ["O", "U", "I", "E", "A"] }
];

let currentQuestionIndex = 0;
let cardSize = 60;
let cards = [];
let draggedCard = null;

let timer = 10;
let lastTime;
let score = 0;

let showSuccess = false;
let successTime = 0;

let showError = false;
let errorTime = 0;
let errorAnswer = "";

let isWaiting = false;

let gameOver = false;

// 馬卡龍色調
const colors = {
  background: '#FDF6F0',  // 奶油米白
  overlay: 'rgba(255, 255, 255, 0.7)', // 透明白
  cardFill: ['#A8E6CF', '#FFD3B6', '#FFAAA5', '#D4A5A5', '#9DE0AD'], // 馬卡龍綠橘粉紫淡綠
  cardStroke: '#FFD3B6',
  textPrimary: '#555555',
  textHighlight: '#FF8C94',  // 粉紅強調
  success: '#77DD77',   // 馬卡龍綠
  error: '#FF6F91',     // 馬卡龍紅
  timerBg: 'rgba(255, 255, 255, 0.6)'
};

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function gotHands(results) {
  hands = results;
}

function setup() {
  let canvas = createCanvas(640, 480);
  canvas.position((windowWidth - width) / 2, (windowHeight - height) / 2);
  rectMode(CENTER);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  handPose.detectStart(video, gotHands);
  textAlign(CENTER, CENTER);
  setupCards();
  lastTime = millis();
}

function setupCards() {
  cards = [];
  let options = questions[currentQuestionIndex].options;
  let totalWidth = options.length * (cardSize + 20);
  let startX = width / 2 - totalWidth / 2 + cardSize / 2;

  for (let i = 0; i < options.length; i++) {
    let x = startX + i * (cardSize + 20);
    cards.push({
      letter: options[i],
      x: x,
      y: 420,
      originalX: x,
      originalY: 420,
      isDragging: false,
      color: colors.cardFill[i % colors.cardFill.length]
    });
  }

  timer = 10;
  lastTime = millis();
}

function draw() {
  background(colors.background);
  
  // 直接畫影片，沒濾鏡
  image(video, 0, 0);

  if (!gameOver && !isWaiting && millis() - lastTime >= 1000) {
    timer--;
    lastTime = millis();
    if (timer < 0) nextQuestion();
  }

  // 分數與時間底色
  noStroke();
  fill(colors.timerBg);
  rect(80, 40, 160, 50, 8);

  fill(colors.textPrimary);
  textSize(18);
  text(`分數: ${score}`, 80, 28);
  text(`時間: ${timer}`, 80, 52);

  // 手指點綴
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let kp of hand.keypoints) {
          fill(hand.handedness === "Left" ? '#FFB6B9' : '#FFE156');  // 左手淡粉 右手奶黃
          noStroke();
          circle(kp.x, kp.y, 12);
        }
      }
    }
  }

  if (gameOver) {
    // 底色半透明白色大方塊
    fill('rgba(255, 255, 255, 0.85)');
    rect(width / 2, height / 2, 320, 120, 20);

    // 文字陰影
    textSize(36);
    textAlign(CENTER, CENTER);
    fill('#AEDFF7');  // 淡藍陰影
    text(`🎉 完成！`, width / 2 + 2, height / 2 - 20 + 2);
    text(`總分: ${score}`, width / 2 + 2, height / 2 + 30 + 2);

    // 主文字
    fill(colors.textHighlight);
    text(`🎉 完成！`, width / 2, height / 2 - 20);
    text(`總分: ${score}`, width / 2, height / 2 + 30);
    return;
  }

  let q = questions[currentQuestionIndex];
  // 題目區塊底色
  fill(colors.overlay);
  rect(width / 2, 90, 280, 80, 12);

  fill(colors.textPrimary);
  textSize(32);
  text(q.word, width / 2, 90);

  if (showSuccess && millis() - successTime < 1000) {
    fill(colors.success);
    textSize(28);
    text("✔ Correct!", width / 2, 140);
  } else {
    showSuccess = false;
  }

  if (showError && millis() - errorTime < 1000) {
    fill(colors.error);
    textSize(28);
    text(`✖ Wrong! 答案是：${errorAnswer}`, width / 2, 140);
  } else {
    showError = false;
  }

  let fx = null, fy = null;
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.handedness === "Right") {
        fx = hand.index_finger_tip.x;
        fy = hand.index_finger_tip.y;
        fill('#FF6F91');  // 馬卡龍粉紅小圈圈
        noStroke();
        circle(fx, fy, 20);
      }
    }
  }

  if (!isWaiting) {
    for (let c of cards) {
      if (fx !== null && !draggedCard) {
        if (dist(fx, fy, c.x, c.y) < cardSize / 2) {
          c.isDragging = true;
          draggedCard = c;
        }
      }
      if (c.isDragging && fx !== null) {
        c.x = fx;
        c.y = fy;
      }
    }
  }

  for (let i = 0; i < cards.length; i++) {
    let c = cards[i];
    fill(c.color);
    stroke(colors.cardStroke);
    strokeWeight(2);
    rect(c.x, c.y, cardSize, cardSize, 8);
    noStroke();
    fill(colors.textPrimary);
    textSize(24);
    text(c.letter, c.x, c.y);
  }

  if (!isWaiting && draggedCard && fx !== null) {
    let hit = collideRectCircle(width / 2, 90, 280, 80, draggedCard.x, draggedCard.y, 20);
    if (hit) {
      if (draggedCard.letter.toLowerCase() === q.answer.toLowerCase()) {
        score++;
        showSuccess = true;
        successTime = millis();
        nextQuestion();
      } else {
        showError = true;
        errorTime = millis();
        errorAnswer = q.answer;
        isWaiting = true;
        setTimeout(() => {
          nextQuestion();
          isWaiting = false;
        }, 1000);
      }
    }
  }
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= questions.length) {
    gameOver = true;
  } else {
    draggedCard = null;
    setupCards();
  }
}