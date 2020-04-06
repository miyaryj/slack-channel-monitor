# slack-channel-monitor

Detect unused channels and post alert message.

## Slack App Configuration

### OAuth & Permissions

- Add below **Bot Token Scopes** in **Scope**

  - chat.write
  - chat.write.public

- Add below **User Token Scopes** in **Scope**

  - channels.history
  - channels.read

- **Install App**

- Copy `OAuth Access Token` and use as `USER_OAUTH_TOKEN`

- Copy `Bot User OAuth Access Token` and use as `BOT_OAUTH_TOKEN`

## Usage

### Installation

```
npm install
```

### Environment values

- `USER_OAUTH_TOKEN` : App's OAuth Access Token. See above
- `BOT_OAUTH_TOKEN` : App's Bot User OAuth Access Token. See above
- `WHITELIST` : Channel names to ignore (comma-separated)

Specify environment values in terminal
```
set USER_OAUTH_TOKEN=xxx BOT_OAUTH_TOKEN=xxx npm start
```
or in `.env` file
```
USER_OAUTH_TOKEN="xxx"
BOT_OAUTH_TOKEN="xxx"
WHITELIST="aaa,bbb"
```

### Execution

Detect unused channels from all public channels and post alert message to the channel and admin channel

```
npm start
```

