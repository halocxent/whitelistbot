const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const { Octokit } = require('@octokit/rest')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const octokit = new Octokit({ auth: process.env.GITOKEN })

const owner = 'halocxent' //replace with ur real github username
const repo = 'coolrepo'  //replace with ur real repo
const path = '/api/blabla.json'  //replace with ur real data path

const allowedRoles = ['123', '123']  //replace with ur buyer roles

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Roblox account')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your Roblox username')
        .setRequired(true)
    ),

  async execute(interaction) {
    const memberRoles = interaction.member.roles.cache.map(role => role.id)
    if (!allowedRoles.some(role => memberRoles.includes(role))) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Access Denied')
        .setDescription('You do not have the required role to use this command.')
        .setColor(0xFF0000)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    const username = interaction.options.getString('username')
    const discordId = interaction.user.id

    await interaction.deferReply({ ephemeral: true })

    try {
      const res = await fetch(`https://users.roblox.com/v1/usernames/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: true
        })
      })

      const data = await res.json()

      if (!data.data || !data.data.length) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Roblox User Not Found')
          .setDescription(`Could not find Roblox user: **${username}**`)
          .setColor(0xFF0000)
        return interaction.editReply({ embeds: [embed] })
      }

      const userId = data.data[0].id
      const userName = data.data[0].name 
      const { error } = await supabase
        .from('linked_accounts')
        .upsert({
          discord_id: discordId,
          roblox_username: username,
          roblox_userid: userId
        }, { onConflict: 'discord_id' })

      if (error) {
        console.error(error)
        const embed = new EmbedBuilder()
          .setTitle('⚠️ Link Failed')
          .setDescription('Failed to link account. Try again later.')
          .setColor(0xFFA500)
        return interaction.editReply({ embeds: [embed] })
      }

      const { data: allLinks, error: fetchError } = await supabase.from('linked_accounts').select('*')
      if (fetchError) throw fetchError

      const { data: file } = await octokit.repos.getContent({
        owner,
        repo,
        path
      })

      const sha = file.sha
      const newContent = Buffer.from(JSON.stringify(allLinks, null, 2)).toString('base64')

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Bot sync: updated linked_accounts.json`,
        content: newContent,
        sha
      })

      const embed = new EmbedBuilder()
        .setTitle('✅ Account Linked')
        .setDescription(`Linked Discord <@${discordId}> with Roblox **${username}** (ID: ${userId})\n📤 Synced to GitHub.`)
        .setColor(0x00FF00)
        .setTimestamp()

      return interaction.editReply({ embeds: [embed] })

    } catch (err) {
      console.error(err)
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Error')
        .setDescription('An error occurred while linking.')
        .setColor(0xFF4500)
      return interaction.editReply({ embeds: [embed] })
    }
  }
}
