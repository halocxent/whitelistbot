const { SlashCommandBuilder } = require('discord.js');
const supabase = require('./supabase');

const allowedRoles = [
  "1396178250539077752", "1396178433335230655", "1396182695997870152",
  "1396194778953023498", "1396195863113498716", "1396364773901471846",
  "1396180956678852842", "1367399080656896100", "1376012556094668950",
  "1396176168608075907", "1396078322588581938"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('generate')
    .setDescription('Get a key (code) from stock')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of code to get')
        .setRequired(true)
        .addChoices(
          { name: 'standard', value: 'standard' },
          { name: 'premium', value: 'premium' },
          { name: 'ultimate', value: 'ultimate' }
        )
    ),

  async execute(interaction) {
    const userRoles = interaction.member.roles.cache.map(role => role.id);
    if (!userRoles.some(role => allowedRoles.includes(role))) {
      await interaction.reply({
        content: 'You are not authorized to use this command.',
        ephemeral: true
      });
      return require('./logger')(interaction); 
    }

    const type = interaction.options.getString('type');

    const { data: availableKeys, error: fetchError } = await supabase
      .from('codes')
      .select('code')
      .eq('type', type)
      .eq('used', false)
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching code:', fetchError);
      await interaction.reply({
        content: 'Database error while fetching code.',
        ephemeral: true
      });
      return require('./logger')(interaction);
    }

    if (!availableKeys) {
      await interaction.reply({
        content: `No ${type} codes left in stock.`,
        ephemeral: true
      });
      return require('./logger')(interaction);
    }

    await interaction.reply({
      content: `Here is your ${type} code:\n\`\`\`\n${availableKeys.code}\n\`\`\``,
      ephemeral: true
    });

    return require('./logger')(interaction); 
  }
};
