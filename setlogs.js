// setlogs.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LOG_CONFIG_FILE = path.join(__dirname, 'log_config.json');
const OWNER_ID = '969877800746123284';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogs')
    .setDescription('Set')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('to')
        .setRequired(true))
    .setDMPermission(false),

  async execute(interaction) {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: 'gng im tired lemme sleep', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const config = { logChannelId: channel.id };
    fs.writeFileSync(LOG_CONFIG_FILE, JSON.stringify(config, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('Log')
      .setDescription(`Bot logs will go to <#${channel.id}>`)
      .setColor(0x00AE86)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    require('./logger')(interaction); // Optional: log that setlogs was used
  }
};
