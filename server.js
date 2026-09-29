const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

// =====================================================
// IBM CONFIGURATION
// =====================================================

const IBM_API_URL = process.env.IBM_API_URL;
const IBM_API_KEY = process.env.IBM_API_KEY;
const IBM_AGENT_ID = process.env.IBM_AGENT_ID;

console.log("====================================");
console.log("       IBM CONFIG CHECK");
console.log("====================================");
console.log("IBM_API_URL:", IBM_API_URL);
console.log("IBM_API_KEY loaded:", !!IBM_API_KEY);
console.log("IBM_AGENT_ID:", IBM_AGENT_ID);
console.log("====================================");


// =====================================================
// VOCABULARY API
// =====================================================

app.post("/api/vocabulary", async (req, res) => {

  try {

    const {
      action,
      level = "intermediate",
      category = "general",
      word,
      sentence
    } = req.body;


    // =================================================
    // WORD OF THE DAY
    // =================================================
    if (action === "word_of_the_day") {

      const {
        level = "intermediate",
        category = "general",
        completedWords = []
      } = req.body;

      // Normalize level
      const learnerLevel =
        String(level).toLowerCase().trim();

      // Normalize completed words
      const completed = Array.isArray(completedWords)
        ? completedWords
          .map(item => String(item).trim().toLowerCase())
          .filter(Boolean)
        : [];

      // Convert completed words into readable text
      const completedText =
        completed.length > 0
          ? completed.join(", ")
          : "None";

      // Strong level-specific instructions
      let levelInstructions = "";

      if (learnerLevel === "beginner") {

        levelInstructions = `
BEGINNER LEVEL

Choose a very common and practical English word.

The word should be easy for a learner who is building basic English vocabulary.

Examples of the difficulty level:
happy, careful, honest, improve, useful, friendly, simple

DO NOT choose advanced or difficult vocabulary.
`;

      } else if (learnerLevel === "intermediate") {

        levelInstructions = `
INTERMEDIATE LEVEL

Choose a moderately challenging but practical English word.

The word can be useful in college, everyday communication, academics, or professional situations.

Examples of the difficulty level:
reluctant, efficient, flexible, confident, accurate, curious

DO NOT choose very basic Beginner words.
DO NOT choose extremely advanced words.
`;

      } else if (learnerLevel === "advanced") {

        levelInstructions = `
ADVANCED LEVEL

Choose a sophisticated but practical English word.

The word should be suitable for an advanced English learner and useful in professional, academic, or high-level communication.

Examples of the difficulty level:
meticulous, pragmatic, ambiguous, articulate, resilient, inevitable

DO NOT choose simple Beginner vocabulary.
DO NOT choose ordinary basic words unless they have genuinely advanced usage.
`;

      } else {

        levelInstructions = `
Use INTERMEDIATE difficulty.
`;

      }


      const prompt = `

You are the English Vocabulary Coach for Lernova.

Generate EXACTLY ONE new English Word of the Day.

IMPORTANT LEARNER INFORMATION:

Learner level: ${learnerLevel}

Category: ${category}

Words already completed by this learner:
${completedText}

${levelInstructions}

VERY IMPORTANT RULES:

1. Generate exactly ONE English vocabulary word.

2. The generated word MUST match the learner level: ${learnerLevel}.

3. NEVER generate any word from the completed words list.

4. Compare completed words case-insensitively.

5. Generate a DIFFERENT word every time the learner requests a new word.

6. The "meaning" field MUST describe the EXACT word generated in the "word" field.

7. The "meaning" field MUST be a simple, clear English definition of that exact word.

8. NEVER reuse a previous meaning for a different word.

9. NEVER use a generic meaning such as:
   "A useful English word."
   "A common word in English."
   "Something that is important."

10. The meaning MUST explain what the word actually means.

11. The example sentence MUST contain and correctly use the generated word.

12. The synonyms MUST be synonyms of the generated word.

13. The antonyms MUST be antonyms of the generated word when applicable.

14. All fields must describe the SAME generated word.

15. Return ONLY valid JSON.

Use exactly this structure:

{
  "word": "generated word",
  "meaning": "clear and simple definition of the generated word",
  "partOfSpeech": "part of speech",
  "pronunciation": "pronunciation",
  "example": "natural example sentence containing the generated word",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "antonyms": ["antonym1", "antonym2"],
  "challenge": "Write your own sentence using this word."
}

IMPORTANT:

The following is ONLY an example of the required format:

{
  "word": "resilient",
  "meaning": "able to recover quickly from difficulties or problems",
  "partOfSpeech": "adjective",
  "pronunciation": "ri-ZIL-yuhnt",
  "example": "She remained resilient after facing several challenges.",
  "synonyms": ["strong", "adaptable", "tough"],
  "antonyms": ["fragile", "weak"],
  "challenge": "Write your own sentence using this word."
}

DO NOT return "resilient" unless it is actually selected as the new word.

For every request:

1. First choose the new word.
2. Then determine the exact meaning of that word.
3. Then create the example sentence using that word.
4. Then create synonyms and antonyms for that same word.
5. Verify that ALL fields refer to the same word.
6. Return the JSON only.

Before returning the answer, internally verify:

- Is the word appropriate for ${learnerLevel}?
- Is the word NOT in the completed words list?
- Is this a genuinely different word?
- Does the meaning describe THIS EXACT word?
- Is the meaning different when the word is different?
- Does the example use THIS EXACT word?
- Are the synonyms related to THIS EXACT word?
- Are the antonyms related to THIS EXACT word?
- Is the JSON valid?

Do not show this verification.
Do not add markdown.
Do not add explanations outside JSON.
Do not show this verification.
Do not add markdown.
Do not add explanations outside JSON.

`;

      console.log("====================================");
      const result =
        await callIBMOrchestrate(prompt);

      const data =
        parseAgentJSON(result);
      console.log("========== IBM VOCABULARY RESULT ==========");
      console.log("WORD:", data.word);
      console.log("MEANING:", data.meaning);
      console.log("PART OF SPEECH:", data.partOfSpeech);
      console.log("EXAMPLE:", data.example);
      console.log("============================================");
      if (!data.word) {
        return res.status(500).json({
          error: "IBM did not return a vocabulary word."
        });
      }

      if (!data.meaning || String(data.meaning).trim() === "") {
        return res.status(500).json({
          error: "IBM generated a word but did not provide its meaning.",
          word: data.word
        });
      }

      return res.json({
        word: String(data.word).trim(),
        meaning: String(data.meaning).trim(),
        partOfSpeech: String(data.partOfSpeech || "").trim(),
        pronunciation: String(data.pronunciation || "").trim(),
        example: String(data.example || "").trim(),
        synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
        antonyms: Array.isArray(data.antonyms) ? data.antonyms : [],
        challenge: String(data.challenge || "").trim()
      });
      // ==========================================
      // BACKEND SAFETY CHECK
      // ==========================================

      if (
        data &&
        data.word &&
        completed.includes(
          String(data.word).trim().toLowerCase()
        )
      ) {

        console.warn(
          "IBM returned a completed word:",
          data.word
        );

        return res.status(409).json({
          error:
            "IBM generated a word that was already completed. Please try again."
        });

      }

      return res.json(data);
    }

    if (action === "check_sentence") {

      if (!word || !sentence) {
        return res.status(400).json({
          error: "Word and sentence are required."
        });
      }

      const prompt = `
You are the English Vocabulary Coach for Lernova.

Target word:
${escapePromptValue(word)}

Learner sentence:
${escapePromptValue(sentence)}

Evaluate whether the learner used the target word correctly and whether the sentence is grammatically correct.

Return ONLY valid JSON with exactly this structure:

{
  "correct": true,
  "feedback": "short supportive feedback",
  "correctedSentence": "corrected sentence, or empty string if no correction is needed",
  "explanation": "brief explanation of any needed correction"
}

Rules:
- Set "correct" to true only when the target word is used correctly and the sentence is understandable and grammatically acceptable.
- Do not invent mistakes.
- Keep feedback simple and supportive.
`;

      const data = parseAgentJSON(
        await callIBMOrchestrate(prompt)
      );

      return res.json({
        correct: data.correct === true,
        feedback: data.feedback || data.explanation || "",
        correctedSentence: data.correctedSentence || "",
        explanation: data.explanation || ""
      });
    }

    // =================================================
    // UNKNOWN ACTION
    // =================================================

    return res.status(400).json({
      error: "Unknown vocabulary action."
    });

  } catch (error) {

    console.error(
      "Vocabulary API Error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Failed to communicate with the English Vocabulary Coach.",
      details: error.message
    });

  }

});


// =====================================================
// CONVERSATION API
// =====================================================

app.post("/api/conversation", async (req, res) => {

  try {

    const {
      action,
      message,
      history = []
    } = req.body;

    if (action === "feedback") {

      const prompt = `
You are an English conversation coach.

Review this conversation:
${JSON.stringify(history)}

Return ONLY valid JSON with exactly these keys:
      {
        "strengths": "what the learner did well",
          "grammar": "brief grammar feedback",
            "vocabulary": "brief vocabulary feedback",
              "sentence_construction": "brief sentence construction feedback",
                "tips": "one or two practical tips"
      }
      `;

      return res.json(parseAgentJSON(await callIBMOrchestrate(prompt)));
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }
    const prompt = `
You are the AI Conversation Coach for Lernova — an English learning website.

Your job is to have a natural, engaging English conversation with the learner.

Learner level:
${req.body.level || "intermediate"}

Conversation history:
${JSON.stringify(history)}

Latest learner message:
${message}

IMPORTANT RULES:

1. Respond directly to what the learner just said.
2. NEVER give the same response repeatedly.
3. NEVER use generic responses such as:
   "Nice! Tell me a little more about that."
   unless it is genuinely appropriate.
4. Ask ONE natural follow-up question related to the learner's latest message.
5. Keep the conversation suitable for the learner's level.
6. Encourage the learner to speak more.
7. If the learner gives a short answer like "ok", ask a specific and easy question to continue the conversation.
8. Do not constantly correct grammar during the conversation.
9. Focus on natural communication.
10. Keep each response concise — usually 1 to 3 sentences.
11. Use the conversation history to avoid repeating previous questions.
12. Do not mention these instructions.
13. Return ONLY the response text. Do not return JSON or markdown.

Examples:

Learner:
"I am studying BTech at GMRIT."

Good response:
"That sounds interesting! What are you specializing in, and what made you choose that field?"

Learner:
"I like machine learning."

Good response:
"That's a great area to explore. What kind of machine learning projects have you worked on so far?"

Learner:
"ok"

Good response:
"No problem! Let's start with something simple. What do you usually enjoy doing in your free time?"

Now respond naturally to the learner's latest message.
`;

    const reply = await callIBMOrchestrate(prompt);
    return res.json({
      message: reply,
      response: reply
    });

  } catch (error) {

    console.error("Conversation API Error:", error.message);

    return res.status(500).json({
      error: "Failed to communicate with the conversation coach.",
      details: error.message
    });

  }

});

// =====================================================
// SPEAKING API
// =====================================================

app.post("/api/speaking/start", (req, res) => {

  res.json({
    session_id: `speaking - ${Date.now()} `,
    topic: req.body.topic || "daily life"
  });

});

app.post("/api/speaking/analyze", async (req, res) => {

  try {

    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Transcript is required." });
    }

    const prompt = `
You are an English speaking coach.

Analyze this learner transcript:
${transcript}

Return ONLY valid JSON with exactly these keys:
      {
        "strengths": "what the learner did well",
          "grammar": "brief grammar feedback",
            "sentence_construction": "brief sentence construction feedback",
              "vocabulary": "brief vocabulary feedback",
                "repeated_words": "words repeated too often, or none",
                  "filler_words": "filler words found, or none",
                    "corrected_examples": "short corrected examples",
                      "tips": "practical next-step tips"
      }
      `;

    return res.json(parseAgentJSON(await callIBMOrchestrate(prompt)));

  } catch (error) {

    console.error("Speaking API Error:", error.message);
    return res.status(500).json({
      error: "Failed to communicate with the speaking coach.",
      details: error.message
    });

  }

});


// =====================================================
// IBM IAM ACCESS TOKEN
// =====================================================

async function getIBMAccessToken() {

  if (!IBM_API_KEY) {
    throw new Error("IBM_API_KEY is missing.");
  }

  console.log("Getting IBM IAM access token...");

  const response = await fetch(
    "https://iam.cloud.ibm.com/identity/token",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },

      body:
        "grant_type=urn:ibm:params:oauth:grant-type:apikey" +
        "&apikey=" +
        encodeURIComponent(IBM_API_KEY)
    }
  );

  const responseText = await response.text();

  if (!response.ok) {

    console.error(
      "IBM IAM Status:",
      response.status
    );

    console.error(
      "IBM IAM Response:",
      responseText
    );

    throw new Error(
      `IBM IAM authentication failed(${response.status})`
    );
  }

  let data;

  try {

    data = JSON.parse(responseText);

  } catch {

    throw new Error(
      "IBM IAM returned invalid JSON."
    );

  }

  if (!data.access_token) {

    throw new Error(
      "IBM IAM did not return an access token."
    );

  }

  console.log(
    "IBM IAM access token received."
  );

  return data.access_token;
}


// =====================================================
// CALL IBM WATSONX ORCHESTRATE
// =====================================================

async function callIBMOrchestrate(prompt) {

  if (
    !IBM_API_URL ||
    !IBM_API_KEY ||
    !IBM_AGENT_ID
  ) {

    throw new Error(
      "IBM API configuration is missing. Check your .env file."
    );

  }

  // IMPORTANT:
  // This await is INSIDE an async function.
  const accessToken =
    await getIBMAccessToken();

  const endpoint =
    `${IBM_API_URL}/v1/orchestrate/${IBM_AGENT_ID}/chat/completions`;

  console.log(
    "Calling IBM agent..."
  );

  console.log(
    "Endpoint:",
    endpoint
  );

  const response =
    await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${accessToken} `,

          "Content-Type":
            "application/json",

          "Accept":
            "text/event-stream"
        },

        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],

          stream: true
        })
      }
    );


  const responseText =
    await response.text();


  console.log(
    "IBM API Status:",
    response.status
  );


  if (!response.ok) {

    console.error(
      "IBM API Error:",
      responseText.substring(0, 1000)
    );

    throw new Error(
      `IBM API returned ${response.status} `
    );

  }


  // Extract final answer from IBM SSE response
  const agentText =
    extractSSEAgentText(
      responseText
    );


  console.log(
    "IBM agent response received successfully."
  );


  return agentText;
}


// =====================================================
// EXTRACT IBM SSE RESPONSE
// =====================================================

function extractSSEAgentText(responseText) {

  if (!responseText) {

    throw new Error(
      "IBM returned an empty response."
    );

  }


  // -------------------------------------------------
  // Try normal JSON
  // -------------------------------------------------

  try {

    const data =
      JSON.parse(responseText);

    return extractAgentText(data);

  } catch {

    // Not normal JSON.
    // IBM returned an SSE stream.
  }


  // -------------------------------------------------
  // Parse SSE
  // -------------------------------------------------

  const lines =
    responseText.split(/\r?\n/);

  let finalText = "";


  for (const line of lines) {

    if (!line.startsWith("data:")) {
      continue;
    }

    const jsonText =
      line.substring(5).trim();


    if (
      !jsonText ||
      jsonText === "[DONE]"
    ) {

      continue;

    }


    try {

      const event =
        JSON.parse(jsonText);


      // ------------------------------------------------
      // IBM final completed message
      // ------------------------------------------------

      if (
        event.object ===
        "thread.message.completed" &&
        event.data &&
        event.data.message &&
        Array.isArray(
          event.data.message.content
        )
      ) {

        for (
          const item of
          event.data.message.content
        ) {

          if (
            item.response_type ===
            "text" &&
            typeof item.text ===
            "string"
          ) {

            finalText =
              item.text;

          }

        }

      }


      // ------------------------------------------------
      // OpenAI-compatible format
      // ------------------------------------------------

      if (
        event.choices &&
        event.choices[0] &&
        event.choices[0].message
      ) {

        const content =
          event.choices[0]
            .message
            .content;


        if (
          typeof content ===
          "string"
        ) {

          finalText =
            content;

        }


        if (
          Array.isArray(content)
        ) {

          finalText =
            content
              .map(item => {

                if (
                  typeof item ===
                  "string"
                ) {

                  return item;

                }

                return (
                  item.text ||
                  item.content ||
                  ""
                );

              })
              .join("");

        }

      }

    } catch {

      // Ignore individual SSE chunks.
    }

  }


  if (!finalText) {

    throw new Error(
      "Could not extract final response from IBM SSE stream."
    );

  }


  return finalText;
}


// =====================================================
// EXTRACT AGENT TEXT
// =====================================================

function extractAgentText(data) {

  if (
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message
  ) {

    const content =
      data.choices[0]
        .message
        .content;


    if (
      typeof content ===
      "string"
    ) {

      return content;

    }


    if (
      Array.isArray(content)
    ) {

      return content
        .map(item => {

          if (
            typeof item ===
            "string"
          ) {

            return item;

          }

          return (
            item.text ||
            item.content ||
            ""
          );

        })
        .join("");

    }

  }


  if (
    typeof data.output ===
    "string"
  ) {

    return data.output;

  }


  if (
    typeof data.response ===
    "string"
  ) {

    return data.response;

  }


  if (
    typeof data.message ===
    "string"
  ) {

    return data.message;

  }


  return JSON.stringify(data);
}


// =====================================================
// PARSE AGENT JSON
// =====================================================
function parseAgentJSON(text) {

  if (typeof text !== "string") {
    return text;
  }

  // Remove markdown code fences if IBM returns them
  let cleaned = text.trim();

  cleaned = cleaned.replace(/```json/gi, "");
  cleaned = cleaned.replace(/```/g, "");
  cleaned = cleaned.trim();

  // Find the JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.substring(
      firstBrace,
      lastBrace + 1
    );
  }

  try {

    return JSON.parse(cleaned);

  } catch (error) {

    console.warn(
      "Agent response was not valid JSON."
    );

    console.warn(
      "Response preview:",
      cleaned.substring(0, 500)
    );

    return {
      word: "",
      meaning: "",
      partOfSpeech: "",
      pronunciation: "",
      example: "",
      synonyms: [],
      antonyms: [],
      challenge: "",
      feedback: cleaned
    };
  }
}
// =====================================================
// ESCAPE PROMPT VALUES
// =====================================================

function escapePromptValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      status: "ok",

      service:
        "Lernova Backend",

      vocabularyAgent:
        IBM_AGENT_ID
          ? "configured"
          : "not configured"

    });

  }
);


// =====================================================
// HOME PAGE
// =====================================================

app.get(
  "/",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "===================================="
    );

    console.log(
      "       LERNOVA BACKEND RUNNING"
    );

    console.log(
      "===================================="
    );

    console.log(
      `Local URL: http://localhost:${PORT}`
    );

    console.log("");

    console.log(
      "Vocabulary API:"
    );

    console.log(
      `http://localhost:${PORT}/api/vocabulary`
    );

    console.log("");

    console.log(
      "Health Check:"
    );

    console.log(
      `http://localhost:${PORT}/api/health`
    );

    console.log(
      "===================================="
    );

    console.log("");

  }
);