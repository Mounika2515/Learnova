// speaking.js

const speakingBackendOrigin =
  window.location.port === "8000"
    ? window.location.origin
    : "http://localhost:8000";

const speakingAPI = `${speakingBackendOrigin}/api/speaking`;

let speakingTranscript = "";


// Start speaking practice
async function startSpeakingPractice(topic = "daily life") {

  speakingTranscript = "";

  const transcriptElement =
    document.getElementById("transcript");

  if (transcriptElement) {
    transcriptElement.textContent =
      "Listening...";
  }

  try {

    // This function expects your backend
    // to handle IBM Speech-to-Text.

    const response = await fetch(
      `${speakingAPI}/start`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          topic: topic
        })
      }
    );

    if (!response.ok) {
      throw new Error("Speaking session could not start");
    }

    const data = await response.json();

    if (data.session_id) {
      sessionStorage.setItem(
        "speaking_session_id",
        data.session_id
      );
    }

    console.log("Speaking session started.");

  } catch (error) {

    console.error(
      "Speaking Start Error:",
      error
    );

    showSpeakingError(
      "Unable to start speaking practice."
    );
  }
}


// Send transcript to Speaking Coach
async function analyzeSpeaking(transcript) {

  if (!transcript.trim()) {

    alert(
      "Please complete a speaking practice session first."
    );

    return;
  }

  speakingTranscript = transcript;

  showSpeakingLoading(true);

  try {

    const response = await fetch(
      `${speakingAPI}/analyze`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          transcript: transcript
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        "Speaking analysis failed"
      );
    }

    const data = await response.json();

    displaySpeakingFeedback(data);

    return data;

  } catch (error) {

    console.error(
      "Speaking Coach Error:",
      error
    );

    showSpeakingError(
      "Unable to analyze your speaking."
    );

  } finally {

    showSpeakingLoading(false);
  }
}


// Display transcript
function displayTranscript(transcript) {

  speakingTranscript = transcript;

  const element =
    document.getElementById("transcript");

  if (element) {
    element.textContent = transcript;
  }
}


// Display AI feedback
function displaySpeakingFeedback(data) {

  const feedback =
    document.getElementById("speaking-feedback");

  if (!feedback) return;

  feedback.innerHTML = `
        <h2>🎙️ Speaking Feedback</h2>

        <section>
            <h3>What You Did Well</h3>
            <p>
                ${escapeHTML(data.strengths || "")}
            </p>
        </section>

        <section>
            <h3>Grammar</h3>
            <p>
                ${escapeHTML(data.grammar || "")}
            </p>
        </section>

        <section>
            <h3>Sentence Construction</h3>
            <p>
                ${escapeHTML(data.sentence_construction || "")}
            </p>
        </section>

        <section>
            <h3>Vocabulary</h3>
            <p>
                ${escapeHTML(data.vocabulary || "")}
            </p>
        </section>

        <section>
            <h3>Repeated Words</h3>
            <p>
                ${escapeHTML(data.repeated_words || "")}
            </p>
        </section>

        <section>
            <h3>Filler Words</h3>
            <p>
                ${escapeHTML(data.filler_words || "")}
            </p>
        </section>

        <section>
            <h3>Corrected Examples</h3>
            <p>
                ${escapeHTML(data.corrected_examples || "")}
            </p>
        </section>

        <section>
            <h3>Tips for Next Time</h3>
            <p>
                ${escapeHTML(data.tips || "")}
            </p>
        </section>
    `;
}


// Loading
function showSpeakingLoading(isLoading) {

  const loading =
    document.getElementById("speaking-loading");

  if (loading) {
    loading.style.display =
      isLoading ? "block" : "none";
  }
}


// Error
function showSpeakingError(message) {

  const error =
    document.getElementById("speaking-error");

  if (error) {

    error.textContent = message;
    error.style.display = "block";

  } else {

    alert(message);
  }
}


// Security helper
function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}