const express = require("express");
const router = express.Router();

const { AzureOpenAIClient } = require("../utils/azure");
const authMiddleware = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");

// token encoder to count the number of tokens
const { encode } = require("gpt-3-encoder");

/* SSE Connections Endpoint */
const activeConnections = [];

/**
 * Generate a client id.
 * @param {message[]} messages
 * @param {options} options
 * @returns {string} client id
 */
function generateClientId(messages, options) {
  const clientId = uuidv4();
  console.log("Generate client id: " + clientId);
  activeConnections.push({
    clientId,
    messages,
    options,
  });
  console.log("Active connections: " + activeConnections.length);
  return clientId;
}

/**
 * Close SSE connection.
 * @param {string} clientId
 */
function closeSSEConnection(clientId) {
  const index = activeConnections.findIndex(
    (item) => item.clientId === clientId
  );
  if (index !== -1) {
    activeConnections.splice(index, 1);
    console.log("Close connection: " + clientId);
  }
}

/* POST send AI msg */
router.post("/:model", authMiddleware, async function (req, res, next) {
  const { model } = req.params;
  const supportModel = process.env.MODEL_NAME.split(",");
  if (!supportModel.includes(model)) {
    return res.json({
      code: -1,
      message: "Model not found.",
      data: null,
    });
  }
  let { messages, options } = req.body;

  if (!messages || !messages.length) {
    const response = {
      code: -1,
      msg: "You must provide a message.",
      data: null,
    };
    res.status(400).json(response);
    return;
  }

  if (!options || !options.length) {
    // default options
    options = {
      model: supportModel[0],
      maxTokens: 1000,
      temperature: 0.9,
      topP: 1,
      frequencyPenalty: 0.0,
      presencePenalty: 0.6,
    };
  }

  // count the number of tokens
  let totalTokens = 0;
  messages.forEach((item) => {
    totalTokens += encode(item.content).length;
  });

  // if you want to use more tokens, you can change the value of COMPRESSED_LENGTH in env
  const maximumTokens = process.env.COMPRESSED_LENGTH
    ? parseInt(process.env.COMPRESSED_LENGTH)
    : 4000;

  if (totalTokens > maximumTokens && messages.length > 1) {
    // save all messages that its role is system, and remove others
    let index = 0;
    while (totalTokens > maximumTokens && index < messages.length) {
      if (messages[index].role !== "system") {
        const tokens = encode(messages[index].content).length;
        messages.splice(index, 1);
        totalTokens -= tokens;
      }
      index++;
    }
  } else if (totalTokens > maximumTokens) {
    // if there is only one message, then return error
    const response = {
      code: -1,
      msg: "Messages too long.",
      data: null,
    };
    res.status(400).json(response);
    return;
  }

  const clientId = generateClientId(messages, options);

  res.json({
    code: 0,
    message: "Success.",
    data: {
      id: clientId,
    },
  });
});

router.post("/stream/:id", authMiddleware, async function (req, res, next) {
  const { id } = req.params;

  const index = activeConnections.findIndex((item) => item.clientId === id);
  if (index === -1) {
    const response = {
      code: -1,
      msg: "Client not found.",
      data: null,
    };
    res.status(400).json(response);
    return;
  }

  const connection = activeConnections[index];
  const { messages, options } = connection;
  const { model } = options;
  const modelOptions = {
    maxTokens: parseInt(options.maxTokens) ?? 1000,
    temperature: parseFloat(options.temperature) ?? 0.9,
    topP: parseFloat(options.topP) ?? 1,
    frequencyPenalty: parseFloat(options.frequencyPenalty) ?? 0.0,
    presencePenalty: parseFloat(options.presencePenalty) ?? 0.0,
  };

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const asyncResult = AzureOpenAIClient.listChatCompletions(
    model,
    messages,
    modelOptions
  );

  const stream = await asyncResult;

  for await (const s of stream) {
    if (!s.choices[0].delta) {
      const response = {
        code: -1,
        msg: "Error.",
        data: null,
      };
      res.status(400).json(response);
    }
    const { role, content } = s.choices[0].delta;
    if (role === undefined && content === undefined) {
      // close SSE connection
      closeSSEConnection(id);
      res.end();
      break;
    } else if (content !== undefined) {
      // send SSE message
      res.write(content);
    }
  }
});

module.exports = router;
