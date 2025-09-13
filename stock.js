const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('./supabase'); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stock')
    .setDescription('View how many keys are in stock'),

  async execute(interaction) {
    const types = ['standard', 'premium', 'ultimate'];
    const counts = {};

    for (const type of types) {
      const { count, error } = await supabase
        .from('codes')
        .select('id', { count: 'exact', head: true })
        .eq('type', type)
        .eq('used', false);

      if (error) {
        console.error('Supabase query error:', error);
        return interaction.reply({
          content: 'Failed to fetch stock data.',
          ephemeral: true,
        });
      }

      counts[type] = count ?? 0;
    }

    const embed = new EmbedBuilder()
      .setTitle('Key Stock')
      .setColor(0xFF0000) 
      .addFields(
        { name: 'Standard Key', value: `\`${counts.standard}\``, inline: true },
        { name: 'Premium Key', value: `\`${counts.premium}\``, inline: true },
        { name: 'Ultimate Key', value: `\`${counts.ultimate}\``, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Key Stock' });
 
    await interaction.reply({ embeds: [embed], ephemeral: false });
        require('./logger')(interaction);
  },
};
