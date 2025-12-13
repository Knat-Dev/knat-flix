import { EmbedBuilder } from 'discord.js';
import { getContainers, getStateEmoji } from '../utils/docker.js';

export const statusCommand = {
  name: 'status',
  description: 'Show status of all arr-stack containers',

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const containers = await getContainers();

      if (containers.length === 0) {
        await interaction.editReply('No containers found.');
        return;
      }

      // Group containers by category
      const categories = {
        'Media': ['plex', 'audiobookshelf', 'overseerr', 'tautulli'],
        'Automation': ['sonarr', 'radarr', 'bazarr', 'prowlarr'],
        'Downloads': ['qbittorrent'],
        'Infrastructure': ['caddy', 'homepage', 'watchtower', 'arr-bot'],
        'Monitoring': ['uptime-kuma', 'grafana', 'prometheus', 'loki', 'promtail', 'node-exporter'],
      };

      const embed = new EmbedBuilder()
        .setTitle('📊 Arr Stack Status')
        .setColor(0x5865f2)
        .setTimestamp();

      // Count running vs total
      const running = containers.filter((c) => c.state === 'running').length;
      const total = containers.length;

      embed.setDescription(`**${running}/${total}** containers running`);

      // Add fields for each category
      for (const [category, serviceNames] of Object.entries(categories)) {
        const services = containers.filter((c) => serviceNames.includes(c.name));

        if (services.length > 0) {
          const value = services
            .map((c) => `${getStateEmoji(c.state)} **${c.name}**\n└ ${c.status}`)
            .join('\n');

          embed.addFields({ name: category, value, inline: true });
        }
      }

      // Add "Other" category for unlisted containers
      const listedNames = Object.values(categories).flat();
      const other = containers.filter((c) => !listedNames.includes(c.name));

      if (other.length > 0) {
        const value = other
          .map((c) => `${getStateEmoji(c.state)} **${c.name}**\n└ ${c.status}`)
          .join('\n');

        embed.addFields({ name: 'Other', value, inline: true });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching container status:', error);
      await interaction.editReply('Failed to fetch container status.');
    }
  },
};

