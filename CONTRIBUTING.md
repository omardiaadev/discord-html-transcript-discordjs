# Contributing

💖 thank you for considering contributing! Any form of contribution means a lot.

If you don't have the time to contribute code, you can still support the project by:

- **Starring** the repository.
- **Following** my GitHub profile.

## Guide

### I Have A Question

If you're stuck, need clarification, or just want to discuss the project, the community is here to help!

You can join my [Discord Server](https://discord.omardiaa.dev) to directly ask away.

### I Want To Contribute

Ready to jump into the code? The quick [development](#development) guide below will help you get your
local environment running.

## Development

> [!NOTE]
> This section of the documentation is incomplete.

### Setup

- **Clone the repository:**
    ```shell
    git clone https://github.com/omardiaadev/discord-html-transcript-discordjs.git
    cd discord-html-transcript-discordjs
    npm install
    ```

### Configuration

#### package.json

This package requires specific `package.json` configuration to function correctly.
A custom JSON property `server` is required in order to resolve the executable server's version.

- **Example**
    ```json
    {
      "server": {
        "version": "<expected_server_version>"
      }
    }
    ```

### Testing

#### Environment

1. Configure `.env` file in your project root:
    ```env
    DISCORD_BOT_TOKEN=your_bot_token
    DISCORD_CHANNEL_ID=your_channel_id
    ```

2. **Run the tests:**
    ```shell
    npm test
    ```
