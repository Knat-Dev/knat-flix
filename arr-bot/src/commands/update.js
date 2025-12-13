import { EmbedBuilder } from "discord.js";

const WATCHTOWER_URL = process.env.WATCHTOWER_URL || "http://watchtower:8080";
const WATCHTOWER_TOKEN = process.env.WATCHTOWER_TOKEN;

export const updateCommand = {
  name: "update",
  description: "Apply pending container updates detected by Watchtower",

  async execute(interaction) {
    await interaction.deferReply();

    if (!WATCHTOWER_TOKEN) {
      await interaction.editReply("❌ Watchtower API token not configured.");
      return;
    }

    try {
      const response = await fetch(`${WATCHTOWER_URL}/v1/update`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${WATCHTOWER_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Watchtower responded with status ${response.status}`);
      }

      const embed = new EmbedBuilder()
        .setTitle("🚀 Updating Containers")
        .setColor(0x57f287)
        .setDescription(
          "Watchtower is pulling and applying updates.\n\n" +
            "You'll get an @here notification with the results."
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error triggering Watchtower update:", error);

      const embed = new EmbedBuilder()
        .setTitle("❌ Update Failed")
        .setColor(0xed4245)
        .setDescription(
          `Failed to trigger update.\n\`\`\`${error.message}\`\`\``
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
