// conversation.js

const conversationBackendOrigin =
  window.location.port === "8000"
    ? window.location.origin
    : "http://localhost:8000";

const conversationAPI = `${conversationBackendOrigin}/api/conversation`;

let conversationHistory = [];


// Start a new conversation
async function startConversation(topic = "daily life", level = "intermediate") {

  conversationHistory = [];

  addMessage("system", "Starting your English conversation practice...");

  await sendConversationMessage(
    `Let's practice English conversation about ${topic}. Start the conversation by asking me a simple question.`
  );
}


// Send learner message to AI
async function sendConversationMessage(message) {

  const cleanedMessage = String(message || "").trim();

  if (!cleanedMessage) return;

  // Show learner message
  addMessage("user", cleanedMessage);

  conversationHistory.push({
    role: "user",
    content: cleanedMessage
  });

  setConversationLoading(true);

  try {

    const response = await fetch(conversationAPI, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: cleanedMessage,
        history: conversationHistory,
        level: "intermediate"
      })
    });

    if (!response.ok) {
      throw new Error("Conversation agent request failed");
    }

    const contentType =
      response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || "Sorry, I couldn't generate a response." };
    }

    const aiMessage =
      data.message ||
      data.response ||
      "Sorry, I couldn't generate a response.";

    // Show AI response
    addMessage("assistant", aiMessage);

    conversationHistory.push({
      role: "assistant",
      content: aiMessage
    });

  } catch (error) {

    console.error("Conversation Agent Error:", error);

    addMessage(
      "assistant",
      "Sorry, something went wrong. Please try again."
    );

  } finally {

    setConversationLoading(false);
  }
}


// Add message to chat
function addMessage(role, message) {

  const chatContainer =
    document.getElementById("conversation-messages") ||
    document.getElementById("messages");

  if (!chatContainer) return;

  const messageElement = document.createElement("div");

  messageElement.className =
    role === "user"
      ? "message user-msg"
      : "message bot-msg";

  messageElement.textContent = message;

  chatContainer.appendChild(messageElement);

  chatContainer.scrollTop =
    chatContainer.scrollHeight;
}


// Loading indicator
function setConversationLoading(isLoading) {

  const loading =
    document.getElementById("conversation-loading") ||
    document.getElementById("loading");

  if (!loading) return;

  loading.style.display =
    isLoading ? "block" : "none";
}


// Finish conversation and request feedback
async function getConversationFeedback() {

  try {

    setConversationLoading(true);

    const response = await fetch(conversationAPI, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        action: "feedback",
        history: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error("Feedback request failed");
    }

    const data = await response.json();

    displayConversationFeedback(data);

  } catch (error) {

    console.error("Conversation Feedback Error:", error);

    alert("Unable to generate conversation feedback.");

  } finally {

    setConversationLoading(false);
  }
}


// Display final feedback
function displayConversationFeedback(data) {

  const feedback =
    document.getElementById("conversation-feedback");

  if (!feedback) return;

  feedback.innerHTML = `
        <h2>Your Conversation Feedback</h2>

        <p>
            <strong>What you did well:</strong>
            ${escapeHTML(data.strengths || "")}
        </p>

        <p>
            <strong>Grammar:</strong>
            ${escapeHTML(data.grammar || "")}
        </p>

        <p>
            <strong>Vocabulary:</strong>
            ${escapeHTML(data.vocabulary || "")}
        </p>

        <p>
            <strong>Sentence Construction:</strong>
            ${escapeHTML(data.sentence_construction || "")}
        </p>

        <p>
            <strong>Tips:</strong>
            ${escapeHTML(data.tips || "")}
        </p>
    `;
}


function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


document.addEventListener("DOMContentLoaded", () => {

  const sendButton = document.getElementById("sendChat");
  const input = document.getElementById("chatInput");

  if (!sendButton || !input) return;

  sendButton.onclick = () => {
    const nextMessage = input.value.trim();
    if (!nextMessage) return;
    input.value = "";
    sendConversationMessage(nextMessage);
  };

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      const nextMessage = input.value.trim();
      if (!nextMessage) return;
      input.value = "";
      sendConversationMessage(nextMessage);
    }
  });

});