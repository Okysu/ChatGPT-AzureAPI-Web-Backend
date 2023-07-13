# ChatGPT-AzureAPI-Web

一个适用于 Azure API 的 ChatGPT 的 Web 界面（后端部分）。

A ChatGPT Web for Azure OpenAI API (Backend Part).

**Tips: If you have built the backend, you can build the frontend.**

**提示：如果你已经构建了后端，你可以构建前端。**

[ChatGPT-AzureAPI-Web-Frontend](https://github.com/Okysu/ChatGPT-AzureAPI-Web-Frontend)

## Overview 概览

![image](https://source.yby.zone/azure/1.jpg)

![image](https://source.yby.zone/azure/2.jpg)

![image](https://source.yby.zone/azure/3.jpg)

## Features 特性

- [x] Authorization Key 授权密钥

You can set your own Authorization Key to prevent others from using your API.

你可以设置自己的授权密钥，以防止他人使用你的 API。

- [x] History 历史记录

You can view the history of your conversations. and set the messages to be sent.

你可以查看你的对话历史记录，并设置要发送的消息。

- [x] Prompt 提示

You can set the prompt to facilitate your conversation.

内置中英文双语提示，快捷完成你的对话。

- [ ] i18n 多语言 **(In progress)**

## Usage 使用

### dependencies 依赖

```bash
pnpm install
```

### dev 开发

Before you start, you need to set the `.env.dev` file.

```bash
# Azure OpenAI
AZURE_API_KEY = ''
AZURE_API_ENDPOINT = ''

# Key if has more than one key, separated by ','
APP_SECRET_KEY = '20030310,MLSA,MSFT'

# Model, if has more than one model, separated by ','
MODEL_NAME = 'gpt-35-turbo'

# Compressed length(Optional)
COMPRESSED_LENGTH = 4000
```

### build 构建

Before you start, you need to set the `.env.prod` file.

```bash
# Azure OpenAI
AZURE_API_KEY = ''
AZURE_API_ENDPOINT = ''

# Key if has more than one key, separated by ','
APP_SECRET_KEY = '20030310,MLSA,MSFT'

# Model, if has more than one model, separated by ','
MODEL_NAME = 'gpt-35-turbo'

# Compressed length(Optional)
COMPRESSED_LENGTH = 4000
```

### run 运行

```bash
pnpm run start
```

## Optimization 优化

To avoid the length of the returned message exceeding the maximum length supported by the model, we have set an (optional) environment variable `COMPRESSED_LENGTH`, with a default value of 4000. If the threshold is exceeded, we will try our best to preserve the messages (messages with the role of "system" will not be deleted), and continuously delete old messages to ensure that the length does not exceed the set threshold.

避免回传的消息长度大于模型所支持的最大长度，我们设置了一个(可选)环境变量`COMPRESSED_LENGTH`，默认值为 4000，如果超过了设置的阈值，我们将尽可能的保留消息（角色为 system 的消息将不会被删除），不断的删除旧消息来保证长度不会超过设置的阈值。

```javascript
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
```
