import { EmbedBuilder } from "discord.js";

export const testCommand = {
  name: "test",
  description: "Send a mock update notification to test the webhook",

  async execute(interaction) {
    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setTitle("🔔 Container Updates Available")
      .setColor(0xffa500)
      .setDescription(
        "@here\n\n" +
          "**The following containers have updates:**\n\n" +
          "📦 **sonarr**\n" +
          "└ `lscr.io/linuxserver/sonarr:4.0.0` → `4.0.1`\n\n" +
          "📦 **radarr**\n" +
          "└ `lscr.io/linuxserver/radarr:5.2.0` → `5.2.1`\n\n" +
          "*Use `/arr update` to apply these updates.*"
      )
      .setFooter({ text: "This is a test notification" })
      .setTimestamp();

    await interaction.editReply({ content: "@here", embeds: [embed] });
  },
};
