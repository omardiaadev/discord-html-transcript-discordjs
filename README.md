<h1 align="center">discord-html-transcript-discordjs</h1>

<p align="center">
    <strong>Generate natively styled Discord chat logs with discord.js</strong>
    <br>
    <a href="https://github.com/omardiaadev/discord-html-transcript">discord-html-transcript</a> wrapper for discord.js
</p>

<p align="center">
    <a href="https://npmjs.com/discord-html-transcript-discordjs"><img alt="npm" src="https://img.shields.io/npm/v/discord-html-transcript-discordjs?color=0055D2"></a>
    <a href="https://github.com/omardiaadev/discord-html-transcript"><img alt="discord-html-transcript" src="https://img.shields.io/github/v/tag/omardiaadev/discord-html-transcript?filter=0.1.0-beta.6&label=discord-html-transcript&color=0559D2"></a>
    <a href="https://github.com/omardiaadev/discord-html-transcript-jda/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/omardiaadev/discord-html-transcript-jda?label=License&color=0559D2"></a>
    <a href="https://discord.gg/fWtQjEJgWX"><img alt="Discord" src="https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=FFF&color=5865F2"></a>
</p>

<details>
    <summary>Table of Contents</summary>
    <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#preview">Preview</a></li>
        <li><a href="#getting-started">Getting Started</a></li>
        <li><a href="#usage">Usage</a></li>
        <li><a href="#contributing">Contributing</a></li>
    </ul>
</details>

## Features

- **discord.js Integration:** Built specifically for discord.js developers.
- **Beautiful UI:** Modern styling that replicates the look and feel of the Discord desktop client.
- **100% Offline:** Built to contain all information in one file.

## Preview

<a title="✨" href="https://htmlpreview.github.io/?https://github.com/omardiaadev/discord-html-transcript/blob/main/examples/transcript.html">
    <img alt="discord-html-transcript" src="https://res.cloudinary.com/omardiaadev/image/upload/discord-html-transcript_ocjq03.png">
</a>

## Getting Started

### Prerequisites

- **Node.js** v24.14.0 or higher
- **discord.js** v14 or higher
- **discord-html-transcript** v0.1.0-beta.6
- [**Required Intents**](https://docs.discord.com/developers/quick-start/getting-started#what-are-intents):
  `GUILDS`, `GUILD_MEMBERS`, `MESSAGE_CONTENT`.

### Installation

```shell
npm i discord-html-transcript-discordjs
```

### Configuration

#### Local Server (Default)

By default, the library downloads [`discord-html-transcript`](https://github.com/omardiaadev/discord-html-transcript)
at runtime and places it inside `~/.local/share/discord-html-transcript/`.

> [!TIP]
> If you wish to download the server manually:
> 1. Download [`discord-html-transcript`](https://github.com/omardiaadev/discord-html-transcript).
> 2. Specify `DISCORD_HTML_TRANSCRIPT_PATH` environment variable.\
     (e.g., `DISCORD_HTML_TRANSCRIPT_PATH=~/Downloads/discord-html-transcript...`)

```javascript
const transcriber = new TranscriberClient(client, {
    // override the default host and port if needed
    host: 'localhost', // default: '127.0.0.1'
    port: 8080         // default: 7000
});
```

#### Remote Server

If you're self-hosting [`discord-html-transcript`](https://github.com/omardiaadev/discord-html-transcript):

```javascript
const transcriber = new TranscriberClient(client, {
    externalUrl: 'https://server-url', // required
    apiKey: 'secret-key'               // required if the server requires authentication
});
```

## Usage

### Example: Slash Command

```javascript
import {REQUIRED_INTENTS, TranscriberClient} from 'discord-html-transcript-discordjs';
import {Client, Events, MessageFlags, Routes, SlashCommandBuilder} from 'discord.js';

const client = new Client({intents: REQUIRED_INTENTS});
const transcriber = new TranscriberClient(client);

client.once(Events.ClientReady, (readyClient) => console.log(`Logged in as ${readyClient.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const {channel} = interaction;

    // safely retrieve the channel
    if (!channel) {
        await interaction.reply({
            content: 'Failed to retrieve channel.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // safely check the channel's type
    if (channel.isDMBased() || !channel.isTextBased) {
        await interaction.reply({
            content: 'This command can only be used in guild text channels.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    try {
        // acknowledge the interaction before Discord expires it
        // this is required in instances where a channel may have a large amount of messages to retrieve
        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        const transcript = await transcriber.transcribe(channel, {
            attachment: {save_images: true},
        });

        const attachment = transcript.toAttachmentBuilder({name: channel.name});

        // send the generated transcript
        await interaction.followUp({files: [attachment]});
    } catch (error) {
        await interaction.followUp({content: 'Failed to generate transcript.'});
    }
});

await transcriber.start();
await client.login(process.env.DISCORD_BOT_TOKEN);
```

## Contributing

**If you found `discord-html-transcript-discordjs` useful, please consider giving it a 🌟!**

Need help? [Ask the Community](https://discord.omardiaa.dev)!

<div align="center">
    <p>Made With ❤️ By <a href="https://github.com/omardiaadev"><b>Omar Diaa</b></a></p>
    <a href="https://fiverr.com/skywolfxp"><img alt="Fiverr" src="https://img.shields.io/badge/-1DBF73?style=for-the-badge&logo=fiverr&logoColor=FFF&logoSize=auto"></a>
    <a href="https://ko-fi.com/omardiaadev"><img alt="Ko-fi" src="https://img.shields.io/badge/ko--fi-FF6433?style=for-the-badge&logo=kofi&logoColor=FFF"></a>
</div>
