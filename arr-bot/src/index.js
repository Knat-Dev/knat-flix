import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { getArrCommand, subcommands } from './commands/index.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

async function registerSlashCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const arrCommand = getArrCommand();

  try {
    console.log('Registering /arr command...');

    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: [arrCommand.data.toJSON()],
    });

    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving ${client.guilds.cache.size} guild(s)`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Handle subcommands under /arr
  if (interaction.commandName === 'arr') {
    const subcommandName = interaction.options.getSubcommand();
    const command = client.commands.get(subcommandName);

    if (!command) {
      await interaction.reply({
        content: `Unknown subcommand: ${subcommandName}`,
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing /arr ${subcommandName}:`, error);
      const reply = {
        content: 'An error occurred while executing this command.',
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
});

async function main() {
  // Load subcommands into collection for execution
  for (const cmd of subcommands) {
    client.commands.set(cmd.name, cmd);
  }

  // Register slash commands with Discord API
  await registerSlashCommands();

  // Login to Discord
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

