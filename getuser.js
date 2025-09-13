const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('./supabase');
const logCommand = require('./logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getuser')
    .setDescription('Lookup linked Roblox or Discord user')
    .addSubcommand(sub =>
      sub.setName('roblox')
        .setDescription('Get Roblox username linked to a Discord user')
        .addUserOption(opt =>
          opt.setName('discord')
            .setDescription('Discord user')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('discord')
        .setDescription('Get Discord user linked to a Roblox username')
        .addStringOption(opt =>
          opt.setName('roblox')
            .setDescription('Roblox username')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'roblox') {
      const discordUser = interaction.options.getUser('discord');

      const { data, error } = await supabase
        .from('redeemed_users')
        .select('roblox_username, plan, redeemed_at')
        .eq('discord_id', discordUser.id)
        .maybeSingle();

      if (error || !data || !data.roblox_username) {
        await interaction.reply({
          content: `No Roblox user linked to <@${discordUser.id}>.`,
          ephemeral: true
        });
        return logCommand(interaction);
      }

      const embed = new EmbedBuilder()
        .setTitle('🔗 Roblox Link Info')
        .setColor('Blue')
        .addFields(
          { name: 'Discord User', value: `<@${discordUser.id}>`, inline: true },
          { name: 'Roblox Username', value: `**${data.roblox_username}**`, inline: true },
          { name: 'Tier', value: `\`${data.plan || 'Unknown'}\``, inline: true },
          { name: 'Redeemed At', value: `\`${data.redeemed_at || 'Unknown'}\``, inline: true }
        );

      await interaction.reply({ embeds: [embed] });
      return logCommand(interaction);
    }

    if (sub === 'discord') {
      const robloxName = interaction.options.getString('roblox').trim();

      const { data, error } = await supabase
        .from('redeemed_users')
        .select('discord_id, plan, redeemed_at')
        .eq('roblox_username', robloxName)
        .maybeSingle();

      if (error || !data || !data.discord_id) {
        await interaction.reply({
          content: `❌ No Discord user linked to Roblox username **${robloxName}**.`,
          ephemeral: true
        });
        return logCommand(interaction);
      }

      const embed = new EmbedBuilder()
        .setTitle('🔗 Discord Link Info')
        .setColor('Green')
        .addFields(
          { name: 'Roblox Username', value: `**${robloxName}**`, inline: true },
          { name: 'Discord User', value: `<@${data.discord_id}>`, inline: true },
          { name: 'Tier', value: `\`${data.plan || 'Unknown'}\``, inline: true },
          { name: 'Redeemed At', value: `\`${data.redeemed_at || 'Unknown'}\``, inline: true }
        );

      await interaction.reply({ embeds: [embed] });
      return logCommand(interaction);
    }
  }
};
