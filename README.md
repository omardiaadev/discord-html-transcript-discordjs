<h1 align="center">discord-html-transcript-discordjs</h1>

<p align="center">
    <strong>Generate natively styled logs for your Discord chats using discord.js</strong>
    <br>
    <a href="https://github.com/discordjs/discord.js">discord.js</a> wrapper for <a href="https://github.com/omardiaadev/discord-html-transcript">discord-html-transcript</a>
</p>

<p align="center">
    <a href="https://github.com/omardiaadev/discord-html-transcript-discordjs/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/omardiaadev/discord-html-transcript-discordjs?label=License&labelColor=05122A&color=05122A"></a>
    <a href="https://discord.gg/fWtQjEJgWX"><img alt="Discord" src="https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=FFF&color=5865F2"></a>
</p>

<details>
    <summary><b>Table of Contents</b></summary>
    <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#preview">Preview</a></li>
        <li><a href="#getting-started">Getting Started</a></li>
        <li><a href="#usage">Usage</a></li>
        <li><a href="#contributing">Contributing</a></li>
        <li><a href="#support">Support</a></li>
    </ul>
</details>

## Features

- **discord.js Integration:** Retrieve channel messages seamlessly with your discord.js client instance.
- **Beautiful UI:** Modern HTML/CSS that has the look and feel of the Discord desktop client.

## Preview

<a title="Click For Full Preview" href="https://htmlpreview.github.io/?https://github.com/omardiaadev/discord-html-transcript/blob/main/examples/transcript.html">
    <img alt="discord-html-transcript" src="https://res.cloudinary.com/omardiaadev/image/upload/v1771423142/discord-html-transcript_ocjq03.png">
</a>

## Getting Started

### Installation

By default, installing `discord-html-transcript-discordjs` will automatically download a required
[executable server](https://github.com/omardiaadev/discord-html-transcript) which is responsible for the generation of
the transcripts.

#### Local Server

```shell
npm install discord-html-transcript-discordjs
pnpm add discord-html-transcript-discordjs
```

#### External Server (Advanced)

If you are using a self-hosted server, you can skip the executable download using an environment variable or NPM
configuration flag.

- **Via CLI Flags**
    ```shell
    npm install discord-html-transcript-discordjs --transcript-server-skip-download
    pnpm add discord-html-transcript-discordjs --config.transcript-server-skip-download=true
    ```

- **Via Environment Variables**
    ```shell
    TRANSCRIBER_SERVER_SKIP_DOWNLOAD=true npm install discord-html-transcript-discordjs
    TRANSCRIBER_SERVER_SKIP_DOWNLOAD=true pnpm add discord-html-transcript-discordjs
    ```

> [!NOTE]
> Using an external server requires [extra configuration](#external-server).

## Usage

### Prerequisites

- **Node.js v24.14.0+**
- **discord.js v14+**
- `Guilds`, `GuildMembers`, `MessageContent`
  [intents](https://discordjs.guide/legacy/popular-topics/intents#enabling-intents) enabled.

### Configuration

You can configure the `TranscriberClient` depending on how you installed the package.

#### Local Server

You can optionally override the server's host and port:

```javascript
const transcriber = new TranscriberClient(client, {
    host: 'localhost', // default: '127.0.0.1'
    port: 8080 // default: 7000
});

await transcriber.start();
```

#### External Server

You must provide the URL to your externally hosted transcript server.

```javascript
const transcriber = new TranscriberClient(client, {
    externalUrl: 'https://your-server-url',
    apiKey: 'your-secret-key' // Required if your server requires authentication
});

await transcriber.start();
```

### Example: Slash Command

> [!NOTE]
> This section of the documentation is incomplete.

```javascript
import {Client, Events, GatewayIntentBits} from 'discord.js';
import TranscriberClient from 'discord-html-transcript-discordjs';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent],
});

const transcriber = new TranscriberClient(client);

client.once(Events.ClientReady, (readyClient) => console.log(`Logged in as ${readyClient.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.commandName !== 'transcript') return;

    const {channel} = interaction;

    // Safely retrieve the channel
    if (!channel) {
        await interaction.reply({content: 'Failed to retrieve channel.', ephemeral: true});
        return;
    }

    // Safely check the channel's type
    if (channel.isDMBased() || !channel.isTextBased) {
        await interaction.reply({content: 'This command can only be used in guild text channels.', ephemeral: true});
        return;
    }

    try {
        // Acknowledge the interaction before Discord expires it
        // This is required in instances where a channel may have a large amount of messages to retrieve
        await interaction.deferReply();

        const transcript = await transcriber.transcribe(channel);
        const attachment = transcript.toAttachmentBuilder(channel.name);

        // Send the generated transcript
        await interaction.editReply({files: [attachment]});
    } catch (err) {
        await interaction.editReply({content: 'Failed to generate transcript.'});
    }
});

await transcriber.start();
await client.login(process.env.DISCORD_BOT_TOKEN);
```

## [Contributing](CONTRIBUTING.md)

Need help? Wanna request a feature? [Join us today](https://discord.omardiaa.dev)!

## Support

If you found this useful, please consider giving it a 🌟!

<a href="https://fiverr.com/skywolfxp"><img alt="Fiverr" src="https://img.shields.io/badge/-1DBF73?style=for-the-badge&logo=fiverr&logoColor=FFF&logoSize=auto"></a>
<a href="https://ko-fi.com/omardiaadev"><img alt="Ko-fi" src="https://img.shields.io/badge/ko--fi-FF6433?style=for-the-badge&logo=kofi&logoColor=FFF"></a>
