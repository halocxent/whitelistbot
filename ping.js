const { SlashCommandBuilder } = require('discord.js')
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true })
    const latency = sent.createdTimestamp - interaction.createdTimestamp
    const apiLatency = Math.round(interaction.client.ws.ping)

    await interaction.editReply({
      content: `🏓 Pong!\nLatency: **${latency}ms**\nAPI Latency: **${apiLatency}ms**`
    })
  }
}


