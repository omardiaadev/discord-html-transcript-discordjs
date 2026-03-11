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
        <li><a href="#development">Development</a></li>
        <li><a href="#support">Support</a></li>
    </ul>
</details>

## Features

- **discord.js Integration:** Retrieve channel messages with your existing discord.js client instance.
- **Beautiful UI:** Modern HTML/CSS that has the look and feel of the Discord desktop client.

> [!NOTE]
> This package is still actively under development.

## Preview

<a title="Click For Full Preview" href="https://htmlpreview.github.io/?https://github.com/omardiaadev/discord-html-transcript/blob/main/examples/transcript.html">
    <img alt="discord-html-transcript" src="https://res.cloudinary.com/omardiaadev/image/upload/v1771423142/discord-html-transcript_ocjq03.png">
</a>

## Getting Started

This package depends on a [web server](https://github.com/omardiaadev/discord-html-transcript) to handle the generation
of the transcripts.

### Installation

#### Local Web Server (Default)

```shell
npm i discord-html-transcript-discordjs
```

#### Hosted Web Server

```shell
npm i discord-html-transcript-discordjs --ignore-scripts
```

> [!NOTE]
> If using a hosted web server, you must specify [`TRANSCRIPT_SERVER_URL`](#configuration)
> (and [`TRANSCRIPT_SERVER_API_KEY`](#configuration) if authentication is required) in your environment variables.

## Usage

### Prerequisites

To use this library, your discord.js client instance must enable the
following [intents](https://discordjs.guide/legacy/popular-topics/intents#enabling-intents)

- `Guilds`
- [`GuildMembers`](https://discordjs.guide/legacy/popular-topics/intents#privileged-intents) (Privileged Intent)
- [`MessageContent`](https://discordjs.guide/legacy/popular-topics/intents#privileged-intents) (Privileged Intent)

### Configuration

#### Environment Variables

<table>
    <tr>
        <th>Variable</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>TRANSCRIPT_SERVER_HOST</code></td>
        <td>Specifies custom host for the local web server.<br>(default: <code>127.0.0.1</code>)</td>
    </tr>
    <tr>
        <td><code>TRANSCRIPT_SERVER_PORT</code></td>
        <td>Specifies custom port for the local web server.<br>(default: <code>7000</code>)</td>
    </tr>
    <tr>
        <td><code>TRANSCRIPT_SERVER_API_KEY</code></td>
        <td>Specifies the secret key for authenticating external web server requests.</td>
    </tr>
    <tr>
        <td><code>TRANSCRIPT_SERVER_URL</code></td>
        <td>
            Specifies external web server URL.
            <br>Setting this will skip local web server execution and download.
        </td>
    </tr>
</table>

### Examples

#### 1. Slash Command

> [!NOTE]
> This section of the documentation is incomplete.

```typescript
import {Client, Events, GatewayIntentBits} from 'discord.js';
import TranscriberClient from 'discord-html-transcript-discordjs';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent],
});

const transcriber = new TranscriberClient(client);

client.once(Events.ClientReady, (readyClient) => console.log(`Logged in as ${readyClient.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const {commandName, channel} = interaction;
  
  if (commandName !== 'transcript') return;
  
  // Safely retrieve the channel
  if (!channel) {
    await interaction.reply({
      content: 'Failed to retrieve channel.', ephemeral: true,
    });
    return;
  }
  
  // Safely check the channel's type
  if (channel.isDMBased() || !channel.isTextBased) {
    await interaction.reply({
      content: 'This command can only be used in guild text channels.', ephemeral: true,
    });
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

await client.login(process.env.DISCORD_BOT_TOKEN);
```

## Development

> [!NOTE]
> This section of the documentation is incomplete.

### Setup

- Clone the repository:

```shell 
git clone https://github.com/omardiaadev/discord-html-transcript-discordjs.git
cd discord-html-transcript-discordjs
npm install
```

### Testing

- Configure `.env` file for testing:

<table>
    <tr>
        <th>Variable</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>DISCORD_BOT_TOKEN</code></td>
        <td>Specifies Discord bot token.</td>
    </tr>
    <tr>
        <td><code>DISCORD_CHANNEL_ID</code></td>
        <td>Specifies Discord target guild channel.</td>
    </tr>
</table>

## Support

If you found this useful, please consider giving it a 🌟!

<a href="https://fiverr.com/skywolfxp"><img alt="Fiverr" src="https://img.shields.io/badge/-1DBF73?style=for-the-badge&logo=fiverr&logoColor=FFF&logoSize=auto"></a>
<a href="https://ko-fi.com/omardiaadev"><img alt="Ko-fi" src="https://img.shields.io/badge/ko--fi-FF6433?style=for-the-badge&logo=kofi&logoColor=FFF"></a>
