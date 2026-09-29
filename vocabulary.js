const backendOrigin =
  window.location.port === "8000"
    ? window.location.origin
    : "http://localhost:8000";

const vocabularyAPI = `${backendOrigin}/api/vocabulary`;

let selectedLevel = "beginner";
let currentWord = "";
let currentWordData = null;
let wordRequestId = 0;

// Store completed words separately for each level
const completedWords = {
  beginner: JSON.parse(
    localStorage.getItem("lernova_completed_beginner") || "[]"
  ),

  intermediate: JSON.parse(
    localStorage.getItem("lernova_completed_intermediate") || "[]"
  ),

  advanced: JSON.parse(
    localStorage.getItem("lernova_completed_advanced") || "[]"
  )
};

const shownWords = {
  beginner: JSON.parse(
    localStorage.getItem("lernova_shown_beginner") || "[]"
  ),

  intermediate: JSON.parse(
    localStorage.getItem("lernova_shown_intermediate") || "[]"
  ),

  advanced: JSON.parse(
    localStorage.getItem("lernova_shown_advanced") || "[]"
  )
};


// ================================
// PAGE LOAD
// ================================

document.addEventListener("DOMContentLoaded", () => {

  setupLevelButtons();
  setupVocabularyButtons();

  updateLevelButtons();
  displayCompletedWords();
  displayProfileCompletedWords();

});


// ================================
// LEVEL BUTTONS
// ================================

function setupLevelButtons() {

  const buttons = document.querySelectorAll(".level-btn");

  console.log("Level buttons found:", buttons.length);

  buttons.forEach(button => {

    button.addEventListener("click", function (event) {

      event.preventDefault();
      event.stopPropagation();

      const newLevel = this.dataset.level;

      console.log("Level selected:", newLevel);

      if (!newLevel) {
        console.error("This button has no data-level:", this);
        return;
      }

      // Change selected level
      selectedLevel = newLevel;

      // Clear current word
      currentWord = "";

      // Update button appearance
      updateLevelButtons();

      // Update completed words display
      displayCompletedWords();

      // Clear old vocabulary information
      clearVocabularyDisplay();

      // Automatically get a new word for selected level
      getWordOfTheDay();

    });

  });

}


// ================================
// UPDATE ACTIVE BUTTON
// ================================

function updateLevelButtons() {

  const buttons = document.querySelectorAll(".level-btn");

  buttons.forEach(button => {

    if (button.dataset.level === selectedLevel) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }

  });

  console.log("Current level:", selectedLevel);
}


// ================================
// VOCABULARY BUTTONS
// ================================

function setupVocabularyButtons() {

  const wordButton = document.getElementById("vocabWord");

  if (wordButton) {

    wordButton.addEventListener("click", function (event) {

      event.preventDefault();
      event.stopPropagation();

      getWordOfTheDay();

    });

  }


  const checkButton = document.getElementById("checkSentence");

  if (checkButton) {

    checkButton.addEventListener("click", function (event) {

      event.preventDefault();
      event.stopPropagation();

      checkSentence();

    });

  }


  const textarea = document.getElementById("vocabularySentence");

  if (textarea) {

    textarea.addEventListener("click", event => {
      event.stopPropagation();
    });

    textarea.addEventListener("focus", event => {
      event.stopPropagation();
    });

  }

}


// ================================
// GET WORD OF THE DAY
// ================================

async function getWordOfTheDay(attempt = 0) {

  const requestId = ++wordRequestId;

  if (attempt >= 5) {

    console.error("Could not find a new word after several attempts.");

    showVocabularyError(
      "Could not find a new word. Please try again."
    );

    return;
  }


  const completed = [
    ...(completedWords[selectedLevel] || []),
    ...(shownWords[selectedLevel] || [])
  ].filter(
    (word, index, words) =>
      words.findIndex(
        item => item.trim().toLowerCase() === word.trim().toLowerCase()
      ) === index
  );

  console.log("--------------------------------");
  console.log("Requesting vocabulary");
  console.log("Level:", selectedLevel);
  console.log("Completed words:", completed);
  console.log("--------------------------------");


  setVocabularyLoading();


  try {

    const response = await fetch(vocabularyAPI, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        action: "word_of_the_day",

        level: selectedLevel,

        category: "general",

        completedWords: completed

      })

    });


    const data = await response.json();


    // Ignore old request
    if (requestId !== wordRequestId) {
      return;
    }


    if (!response.ok) {

      console.error("Vocabulary API error:", data);

      // If backend says word already exists,
      // try again with the same level.
      if (response.status === 409) {

        console.log(
          "Backend returned completed word. Retrying..."
        );

        return getWordOfTheDay(attempt + 1);

      }

      throw new Error(
        data.error || "Vocabulary request failed"
      );
    }


    console.log("Vocabulary response:", data);


    const word = data.word || "";


    if (!word) {

      throw new Error("No word received from backend.");

    }


    // ==========================================
    // CHECK WHETHER WORD WAS ALREADY COMPLETED
    // ==========================================

    const alreadyCompleted = completed.some(
      completedWord =>
        completedWord.trim().toLowerCase() ===
        word.trim().toLowerCase()
    );


    if (alreadyCompleted) {

      console.warn(
        "Received completed word:",
        word
      );

      // Ask backend for another word
      return getWordOfTheDay(attempt + 1);

    }


    // ==========================================
    // ACCEPT NEW WORD
    // ==========================================

    currentWord = word;
    currentWordData = data;

    const normalizedWord = word.trim().toLowerCase();
    const shownForLevel = shownWords[selectedLevel] || [];

    if (
      !shownForLevel.some(
        shownWord => shownWord.trim().toLowerCase() === normalizedWord
      )
    ) {
      shownForLevel.push(word.trim());
      localStorage.setItem(
        `lernova_shown_${selectedLevel}`,
        JSON.stringify(shownForLevel)
      );
    }

    displayVocabulary(data);

    console.log(
      "New word:",
      currentWord,
      "| Level:",
      selectedLevel
    );

  } catch (error) {

    console.error("Vocabulary error:", error);

    showVocabularyError(
      "Could not get a word. Please make sure the backend is running."
    );

  }

}


// ================================
// DISPLAY VOCABULARY
// ================================

function displayVocabulary(data) {

  const word = data.word || "—";
  const meaning = data.meaning || data.definition || "—";
  const partOfSpeech = data.partOfSpeech || data.part_of_speech || "—";
  const pronunciation = data.pronunciation || "—";
  const example = data.example || data.exampleSentence || "—";

  currentWord = word;


  // Home
  const wordTitle = document.getElementById("wordTitle");

  if (wordTitle) {
    wordTitle.textContent = word;
  }


  // Vocabulary page
  const bigWord = document.getElementById("bigWord");

  if (bigWord) {
    bigWord.textContent = word;
  }


  const challengeWord = document.getElementById("challengeWord");

  if (challengeWord) {
    challengeWord.textContent = word;
  }


  const meaningElement = document.getElementById("meaning");

  if (meaningElement) {
    meaningElement.textContent = meaning;
  }


  const partOfSpeechElement =
    document.getElementById("partOfSpeech");

  if (partOfSpeechElement) {
    partOfSpeechElement.textContent = partOfSpeech;
  }


  const pronunciationElement =
    document.getElementById("pronunciation");

  if (pronunciationElement) {
    pronunciationElement.textContent = pronunciation;
  }


  const exampleText =
    document.getElementById("exampleText");

  if (exampleText) {
    exampleText.textContent = example;
  }

  document.querySelectorAll(".example").forEach(element => {
    const label = element.querySelector("b");

    element.textContent = "";

    if (label) {
      element.appendChild(label);
      element.appendChild(document.createTextNode(" " + example));
    } else {
      element.textContent = example;
    }
  });

  const chips = document.querySelector(".chips");

  if (chips) {
    const synonyms = Array.isArray(data.synonyms)
      ? data.synonyms
      : String(data.synonyms || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

    chips.innerHTML = synonyms
      .map(synonym => `<span>${escapeHTML(synonym)}</span>`)
      .join("");
  }


  // Synonyms
  const synonymsElement =
    document.getElementById("synonyms");

  if (synonymsElement) {

    const synonyms = data.synonyms || [];

    synonymsElement.textContent =
      Array.isArray(synonyms)
        ? synonyms.join(", ")
        : synonyms;

  }


  // Antonyms
  const antonymsElement =
    document.getElementById("antonyms");

  if (antonymsElement) {

    const antonyms = data.antonyms || [];

    antonymsElement.textContent =
      Array.isArray(antonyms)
        ? antonyms.join(", ")
        : antonyms;

  }


  // Clear previous sentence result
  const sentenceResult = document.getElementById("sentenceResult");

  if (sentenceResult) {
    sentenceResult.innerHTML = "";
  }


  const textarea =
    document.getElementById("vocabularySentence");

  if (textarea) {
    textarea.value = "";
  }

}


// ================================
// CHECK SENTENCE
// ================================

async function checkSentence() {

  const textarea =
    document.getElementById("vocabularySentence");

  const result =
    document.getElementById("sentenceResult");


  if (!textarea || !result) {
    return;
  }


  const sentence = textarea.value.trim();


  if (!sentence) {

    result.innerHTML =
      "<p>Please write a sentence first.</p>";

    return;
  }


  if (!currentWord) {

    result.innerHTML =
      "<p>Please get a vocabulary word first.</p>";

    return;
  }


  result.innerHTML =
    "<p>Checking your sentence...</p>";


  try {

    const response = await fetch(vocabularyAPI, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        action: "check_sentence",

        level: selectedLevel,

        word: currentWord,

        sentence: sentence

      })

    });


    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.error || "Could not check sentence."
      );
    }


    displaySentenceResult(data);


    // ==========================================
    // MARK WORD COMPLETED ONLY IF CORRECT
    // ==========================================

    if (data.correct === true) {

      addCompletedWord(currentWord);

    }

  } catch (error) {

    console.error(error);

    result.innerHTML =
      `<p>Could not check your sentence. ${
        escapeHTML(error.message || "Please try again.")
      }</p>`;

  }

}


// ================================
// DISPLAY SENTENCE RESULT
// ================================

function displaySentenceResult(data) {

  const result =
    document.getElementById("sentenceResult");

  if (!result) {
    return;
  }


  let html = "";


  if (data.correct === true) {

    html += `
            <div class="success-message">
                ✅ Great! Your sentence is correct.
            </div>
        `;

  } else {

    html += `
            <div class="error-message">
                ❌ There is something to improve.
            </div>
        `;

  }


  if (data.correctedSentence) {

    html += `
            <p>
                <strong>Corrected sentence:</strong><br>
                ${escapeHTML(data.correctedSentence)}
            </p>
        `;

  }


  if (data.explanation) {

    html += `
            <p>
                <strong>Explanation:</strong><br>
                ${escapeHTML(data.explanation)}
            </p>
        `;

  }


  result.innerHTML = html;

}


// ================================
// ADD COMPLETED WORD
// ================================

function addCompletedWord(word) {

  if (!word) {
    return;
  }


  const normalizedWord =
    word.trim().toLowerCase();


  const list =
    completedWords[selectedLevel];


  // Don't add duplicates
  if (
    list.some(
      item =>
        item.trim().toLowerCase() === normalizedWord
    )
  ) {

    return;

  }


  list.push(word.trim());

  const details = JSON.parse(
    localStorage.getItem("lernova_completed_details") || "{}"
  );

  details[normalizedWord] = {
    word: word.trim(),
    meaning: currentWordData?.meaning || "",
    synonyms: Array.isArray(currentWordData?.synonyms)
      ? currentWordData.synonyms
      : []
  };

  localStorage.setItem(
    "lernova_completed_details",
    JSON.stringify(details)
  );


  // Save level-specific list
  localStorage.setItem(
    `lernova_completed_${selectedLevel}`,
    JSON.stringify(list)
  );


  console.log(
    "Completed word saved:",
    word,
    "| Level:",
    selectedLevel
  );


  displayCompletedWords();
  displayProfileCompletedWords();

}


// ================================
// DISPLAY COMPLETED WORDS
// ================================

function displayCompletedWords() {
  displayProfileCompletedWords();

}

function displayProfileCompletedWords() {

  const container = document.getElementById("profileCompletedWords");
  const count = document.getElementById("profileCompletedCount");

  if (!container || !count) {
    return;
  }

  const allCompleted = Object.values(completedWords).flat();
  const details = JSON.parse(
    localStorage.getItem("lernova_completed_details") || "{}"
  );

  count.textContent =
    `${allCompleted.length} ${allCompleted.length === 1 ? "word" : "words"}`;

  if (allCompleted.length === 0) {
    container.innerHTML =
      "<p>No completed words yet. Complete a vocabulary sentence to see it here.</p>";
    return;
  }

  container.innerHTML = allCompleted.map(word => {
    const item = details[word.trim().toLowerCase()] || {
      word,
      meaning: "Meaning not saved for this word.",
      synonyms: []
    };

    const synonyms = Array.isArray(item.synonyms) && item.synonyms.length
      ? item.synonyms.join(", ")
      : "No similar words saved.";

    return `
      <article class="completed-word-card">
        <h4>${escapeHTML(item.word)}</h4>
        <p>${escapeHTML(item.meaning)}</p>
        <small><strong>Similar words:</strong> ${escapeHTML(synonyms)}</small>
      </article>
    `;
  }).join("");
}


// ================================
// CLEAR OLD WORD
// ================================

function clearVocabularyDisplay() {

  const elements = [
    "bigWord",
    "challengeWord",
    "wordTitle",
    "meaning",
    "partOfSpeech",
    "pronunciation",
    "exampleText",
    "synonyms",
    "antonyms"
  ];


  elements.forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {

      element.textContent = "—";

    }

  });


  const sentenceResult =
    document.getElementById("sentenceResult");

  if (sentenceResult) {

    sentenceResult.innerHTML = "";

  }


  const textarea =
    document.getElementById("vocabularySentence");

  if (textarea) {

    textarea.value = "";

  }

}


// ================================
// LOADING
// ================================

function setVocabularyLoading() {

  const wordTitle =
    document.getElementById("wordTitle");

  if (wordTitle) {
    wordTitle.textContent =
      "Generating word...";
  }


  const bigWord =
    document.getElementById("bigWord");

  if (bigWord) {
    bigWord.textContent =
      "Generating...";
  }

}


// ================================
// ERROR
// ================================

function showVocabularyError(message) {

  const bigWord =
    document.getElementById("bigWord");

  if (bigWord) {
    bigWord.textContent = "Try again";
  }


  const wordTitle =
    document.getElementById("wordTitle");

  if (wordTitle) {
    wordTitle.textContent = "Try again";
  }


  console.error(message);

}


// ================================
// ESCAPE HTML
// ================================

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}