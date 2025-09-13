//warning this command is not complete use it carefully
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('./supabase');

const tierRoles = {
  standard: '123',
  premium: '123',
  ultimate: '123'// replace those 3 with ur discord roles id u want
};

const buyerRoleId = '123'; //optional

module.exports = {
  data: new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem a whitelist code')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Your whitelist code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const input = interaction.options.getString('code').trim();
    const userId = interaction.user.id;
    const member = interaction.member;

    const errorEmbed = (msg) => new EmbedBuilder()
      .setTitle('Redemption Failed')
      .setDescription(msg)
      .setColor(0xFF0000);

    const successEmbed = (tier) => new EmbedBuilder()
      .setTitle('Redemption Successful')
      .setDescription(`You have redeemed a **${tier}** tier code.\nYour roles have been assigned.`)
      .setColor(0x00FF99);

    if (!/^(standard|premium|ultimate)_.{10,}$/.test(input)) {
      return interaction.reply({
        embeds: [errorEmbed('Invalid code format.')],
        ephemeral: false
      });
    }

    const { data: existing, error: checkError } = await supabase
      .from('redeemed_users')
      .select('code')
      .eq('discord_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Check error:', checkError);
      return interaction.reply({
        embeds: [errorEmbed('Internal error while checking redemption.')],
        ephemeral: false
      });
    }

    if (existing) {
      return interaction.reply({
        embeds: [errorEmbed('You already redeemed a code.')],
        ephemeral: false
      });
    }

    const { data: codeData, error: codeError } = await supabase
      .from('codes')
      .select('type, used')
      .eq('code', input)
      .maybeSingle();

    if (codeError) {
      console.error('Code lookup error:', codeError);
      return interaction.reply({
        embeds: [errorEmbed('Error while validating the code.')],
        ephemeral: false
      });
    }

    if (!codeData) {
      return interaction.reply({
        embeds: [errorEmbed('Code does not exist.')],
        ephemeral: false
      });
    }

    if (codeData.used) {
      return interaction.reply({
        embeds: [errorEmbed('Code has already been used.')],
        ephemeral: false
      });
    }

    const tier = codeData.type;

    const { data: updatedCode, error: updateError } = await supabase
      .from('codes')
      .update({
        used: true,
        claimed_by: userId,
        claimed_at: new Date().toISOString()
      })
      .eq('code', input)
      .eq('used', false)
      .select()
      .maybeSingle();

    if (updateError || !updatedCode) {
      console.error('Failed to update code as used:', updateError);
      return interaction.reply({
        embeds: [errorEmbed('Failed to claim the code. Try again or use another.')],
        ephemeral: false
      });
    }

    const { error: insertError } = await supabase
      .from('redeemed_users')
      .insert({
        discord_id: userId,
        code: input,
        plan: tier,
        redeemed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to insert redemption log:', insertError);
      return interaction.reply({
        embeds: [errorEmbed('Failed to log redemption. Contact staff.')],
        ephemeral: false
      });
    }

    try {
      await member.roles.add(tierRoles[tier]);
      await member.roles.add(buyerRoleId);
    } catch (roleError) {
      console.error('Role assignment failed:', roleError);
      return interaction.reply({
        embeds: [errorEmbed('Failed to assign roles. Make sure the bot has permission.')],
        ephemeral: false
      });
    }

    await interaction.reply({
      embeds: [successEmbed(tier)],
      ephemeral: false
    });

