const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const supabase = require('./supabase');

const restockRoleId = '1367399080656896100';

function generateCode(type) {
  const raw = crypto.randomBytes(38);
  const encoded = raw.toString('base64').substring(0, 50);
  return `${type}_${encoded}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restock')
    .setDescription('Generate and store new codes')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of code to generate')
        .setRequired(true)
        .addChoices(
          { name: 'standard', value: 'standard' },
          { name: 'premium', value: 'premium' },
          { name: 'ultimate', value: 'ultimate' }
        )
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('How many codes to generate (max 20)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute(interaction) {
    const userRoles = interaction.member.roles.cache.map(role => role.id);
    if (!userRoles.includes(restockRoleId)) {
      return interaction.reply({
        content: 'You are not authorized to use this command.',
        ephemeral: true
      });
    }

    const type = interaction.options.getString('type');
    const amount = interaction.options.getInteger('amount');
    const userId = interaction.user.id;

    const codes = [];

    for (let i = 0; i < amount; i++) {
      let tries = 0;
      let code;

      while (tries < 10) {
        const candidate = generateCode(type);
        const { data: existing } = await supabase
          .from('codes')
          .select('id')
          .eq('code', candidate)
          .single();

        if (!existing) {
          code = candidate;
          break;
        }

        tries++;
      }

      if (!code) {
        return interaction.reply({
          content: `Failed to generate a unique code after 10 tries at position ${i + 1}.`,
          ephemeral: true
        });
      }

      codes.push({
        code,
        type,
        used: false,
        created_by: userId,
        created_at: new Date().toISOString()
      });
    }

    const { error } = await supabase.from('codes').insert(codes);

    if (error) {
      console.error('Supabase insert error:', error);
      return interaction.reply({
        content: 'Failed to store codes in Supabase.',
        ephemeral: true
      });
    }

    const codeList = codes.map(c => c.code).join('\n');

    return interaction.reply({
      content: `Generated ${codes.length} '${type}' codes:\n\`\`\`\n${codeList}\n\`\`\``,
      ephemeral: true
    });
      require('./logger')(interaction); 
  }
};
