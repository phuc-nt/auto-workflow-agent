# Slack API Reference

This document provides a comprehensive overview of the Slack API calls made during our previous interactions. It serves as a reference for making specific API requests in the future.

## API Calls

### 1. List Slack Channels
- **Endpoint**: `/api/conversations.list`
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Example Usage**:
  ```bash
  curl -H "Authorization: Bearer <slack-bot-token>" "https://slack.com/api/conversations.list"
  ```

### 2. Send a Message to a Slack Channel
- **Endpoint**: `/api/chat.postMessage`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Request Body**:
  ```json
  {
    "channel": "<channel-id>",
    "text": "Your message here"
  }
  ```
- **Example Usage**:
  ```bash
  curl -X POST -H "Authorization: Bearer <slack-bot-token>" -d "channel=<channel-id>&text=Your message here" "https://slack.com/api/chat.postMessage"
  ```

### 3. Get Channel History
- **Endpoint**: `/api/conversations.history`
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Parameters**:
  - `channel`: The ID of the channel to retrieve history from.
- **Example Usage**:
  ```bash
  curl -H "Authorization: Bearer <slack-bot-token>" "https://slack.com/api/conversations.history?channel=<channel-id>"
  ```

### 4. Update a Message
- **Endpoint**: `/api/chat.update`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Request Body**:
  ```json
  {
    "channel": "<channel-id>",
    "ts": "<timestamp>",
    "text": "Updated message text"
  }
  ```
- **Example Usage**:
  ```bash
  curl -X POST -H "Authorization: Bearer <slack-bot-token>" -d "channel=<channel-id>&ts=<timestamp>&text=Updated message text" "https://slack.com/api/chat.update"
  ```

### 5. Delete a Message
- **Endpoint**: `/api/chat.delete`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Request Body**:
  ```json
  {
    "channel": "<channel-id>",
    "ts": "<timestamp>"
  }
  ```
- **Example Usage**:
  ```bash
  curl -X POST -H "Authorization: Bearer <slack-bot-token>" -d "channel=<channel-id>&ts=<timestamp>" "https://slack.com/api/chat.delete"
  ```

### 6. Create a Slack Channel
- **Endpoint**: `/api/conversations.create`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Request Body**:
  ```json
  {
    "name": "new_channel"
  }
  ```
- **Example Usage**:
  ```bash
  curl -X POST -H "Authorization: Bearer <slack-bot-token>" -d "name=new_channel" "https://slack.com/api/conversations.create"
  ```

### 7. Invite User to a Channel
- **Endpoint**: `/api/conversations.invite`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Request Body**:
  ```json
  {
    "channel": "<channel-id>",
    "users": "<user-id>"
  }
  ```
- **Example Usage**:
  ```bash
  curl -X POST -H "Authorization: Bearer <slack-bot-token>" -d "channel=<channel-id>&users=<user-id>" "https://slack.com/api/conversations.invite"
  ```

### 8. Get User Information
- **Endpoint**: `/api/users.info`
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer <slack-bot-token>`
- **Parameters**:
  - `user`: The ID of the user to retrieve information for.
- **Example Usage**:
  ```bash
  curl -H "Authorization: Bearer <slack-bot-token>" "https://slack.com/api/users.info?user=<user-id>"
  ```

## Conclusion

This document provides a detailed overview of the Slack API calls made during our interactions. Use this as a reference for making specific API requests in the future.
