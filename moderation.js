const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderate')
    .setDescription('Moderation commands')
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Kick a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Ban a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('unban')
        .setDescription('Unban a user by ID')
        .addStringOption(opt => opt.setName('userid').setDescription('User ID to unban').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('warn')
        .setDescription('Warn a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('mute')
        .setDescription('Mute a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to mute').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const member = interaction.member;
    const guild = interaction.guild;

    if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({ content: 'No permission.', ephemeral: true });
    }

    const log = async (msg) => {
      const channel = guild.channels.cache.get('YOUR_LOG_CHANNEL_ID');
      if (channel) channel.send(msg);
    };

    if (sub === 'kick') {
      const user = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason';
      const memberTarget = guild.members.cache.get(user.id);

      if (!memberTarget) return interaction.reply({ content: 'User not found.', ephemeral: true });

      await memberTarget.kick(reason);
      await interaction.reply({ content: `Kicked ${user.tag}.` });
      await log(`User ${user.tag} was kicked. Reason: ${reason}`);
    }

    if (sub === 'ban') {
      const user = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason';
      await guild.members.ban(user.id, { reason });
      await interaction.reply({ content: `Banned ${user.tag}.` });
      await log(`User ${user.tag} was banned. Reason: ${reason}`);
    }

    if (sub === 'unban') {
      const userId = interaction.options.getString('userid');
      try {
        await guild.members.unban(userId);
        await interaction.reply({ content: `Unbanned user ID ${userId}` });
        await log(`User ID ${userId} was unbanned.`);
      } catch {
        interaction.reply({ content: 'Failed to unban.', ephemeral: true });
      }
    }

    if (sub === 'warn') {
      const user = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason';
      await interaction.reply({ content: `Warned ${user.tag}.` });
      await log(`User ${user.tag} was warned. Reason: ${reason}`);
    }

    if (sub === 'mute') {
      const user = interaction.options.getUser('target');
      const duration = interaction.options.getInteger('duration');
      const muteRole = guild.roles.cache.find(r => r.name === 'Muted');
      const memberTarget = guild.members.cache.get(user.id);

      if (!muteRole || !memberTarget) {
        return interaction.reply({ content: 'Mute role or user not found.', ephemeral: true });
      }

      await memberTarget.roles.add(muteRole);
      await interaction.reply({ content: `Muted ${user.tag} for ${duration} minutes.` });
      await log(`User ${user.tag} was muted for ${duration} minutes.`);

      setTimeout(async () => {
        await memberTarget.roles.remove(muteRole).catch(() => null);
        await log(`User ${user.tag} was automatically unmuted.`);
      }, duration * 60000);
    }
  }
};
