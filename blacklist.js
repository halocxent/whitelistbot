const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('./supabase');
const logCommand = require('./logger');

const allowedRoles = [
  "1396194778953023498", "1396364773901471846", "1396177890944614491",
  "1396176168608075907", "1396178433335230655", "1396182695997870152",
  "1396178250539077752", "1396178731797712906", "1396078322588581938",
  "1396180956678852842"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Blacklist or unblacklist a user')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Blacklist a user and remove their data')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('The user to blacklist')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a user from the blacklist')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('The user to unblacklist')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const userRoles = interaction.member.roles.cache.map(role => role.id);
    if (!userRoles.some(role => allowedRoles.includes(role))) {
      return interaction.reply({
        content: '❌ You are not authorized to use this command.',
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const userId = user.id;

    // Log the command usage
    await logCommand(interaction, '1396136826778943658');

    // Embed helpers
    const errorEmbed = (msg) =>
      new EmbedBuilder().setTitle('❌ Failed').setDescription(msg).setColor(0xFF0000);
    const successEmbed = (msg) =>
      new EmbedBuilder().setTitle('✅ Success').setDescription(msg).setColor(0x00FF99);

    if (sub === 'add') {
      // ✅ Corrected table name
      const { data: userData, error: fetchError } = await supabase
        .from('redeemed_users')
        .select('*')
        .eq('discord_id', userId)
        .single();

      if (fetchError) {
        console.error('[Supabase fetch error]', fetchError);
        return interaction.reply({
          embeds: [errorEmbed('Internal error when checking redeemed users.')],
          ephemeral: false
        });
      }

      if (!userData) {
        return interaction.reply({
          embeds: [errorEmbed('User not found in redeemed list.')],
          ephemeral: false
        });
      }

      const { error: insertError } = await supabase
        .from('blacklist')
        .insert({
          discord_id: userData.discord_id,
          roblox_id: userData.roblox_id,
          roblox_username: userData.roblox_username,
          plan: userData.plan,
          blacklisted_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[Supabase insert error]', insertError);
        return interaction.reply({
          embeds: [errorEmbed('Failed to insert into blacklist.')],
          ephemeral: false
        });
      }

      // ✅ Delete from corrected table name
      const { error: deleteError } = await supabase
        .from('redeemed_users')
        .delete()
        .eq('discord_id', userId);

      if (deleteError) {
        console.error('[Supabase delete error]', deleteError);
        return interaction.reply({
          embeds: [errorEmbed('User was blacklisted, but could not delete from redeemed list.')],
          ephemeral: false
        });
      }

      return interaction.reply({
        embeds: [successEmbed(`<@${userId}> has been blacklisted and removed from redeemed list.`)],
        ephemeral: false
      });
    }

    if (sub === 'remove') {
      const { error: deleteError } = await supabase
        .from('blacklist')
        .delete()
        .eq('discord_id', userId);

      if (deleteError) {
        console.error('[Supabase blacklist removal error]', deleteError);
        return interaction.reply({
          embeds: [errorEmbed('Failed to remove from blacklist.')],
          ephemeral: false
        });
      }

      return interaction.reply({
        embeds: [successEmbed(`<@${userId}> has been removed from blacklist.`)],
        ephemeral: false
     
      });
      require('./logger')(interaction);
    }
  }
};
