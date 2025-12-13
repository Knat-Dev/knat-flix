import { SlashCommandBuilder } from 'discord.js';
import { statusCommand } from './status.js';
import { updateCommand } from './update.js';
import { testCommand } from './test.js';

// All available subcommands
export const subcommands = [statusCommand, updateCommand, testCommand];

/**
 * Builds the main /arr command with all subcommands
 */
function buildArrCommand() {
  const command = new SlashCommandBuilder()
    .setName('arr')
    .setDescription('Manage arr-stack containers');

  // Add each subcommand
  for (const sub of subcommands) {
    command.addSubcommand((subcommand) =>
      subcommand.setName(sub.name).setDescription(sub.description)
    );
  }

  return command;
}

/**
 * Get the main /arr command for registration with Discord API
 */
export function getArrCommand() {
  return {
    name: 'arr',
    data: buildArrCommand(),
  };
}

