const { SlashCommandBuilder } = require('discord.js')
const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const { Octokit } = require('@octokit/rest')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const octokit = new Octokit({ auth: process.env.GITOKEN })

const owner = 'halocxent'
const repo = 'itftdfpb15v3t1ewp9054vznp0xuu6'
const path = 'rh7b7hdxr3ha0yai2ixj5qgaqcf87m/d8rmgwa78xtb7nfyvhwhp0vxfmpw6u/jb3gwm2cvwn4518i6ed0jb2ev14che/gxm4ddrx2th03vcgy1eqkiafu2zyri/phnze5hn836jj8f8hemyd53m2qg7fg/01ykeakyqrup5r13x6hxvd58kdj61x/iy82q6a8v9zyt72t8rex1tdrcbtfk1/8atf4jedenvax4vduc9adyv04xnirugew1wxkermq9qwn1itb2/kgaj8wrnipk4qmfg1rf4rntebh4aa7jwa7ykr2gkk9qucgtr29/kgaj8wrnipk4qmfg1rf4rntebh4aa7jwa7ykr2gkk9qucgtr29/tx10egef6yd649k8qcmt1xbwbabtqkr449zd6b4r3wr9e58rea/a1gpckckf623nwa5ym4dtak0uu5a80gxf6y0pnpiezpdt3ueqq/f8452vnbehyvtrfz8j8zzadcxk785d.json'

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
  return interaction.editReply(`❌ Could not find Roblox user: **${username}**`)
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
        return interaction.editReply(`⚠️ Failed to link account. Try again later.`)
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

      return interaction.editReply(
        `✅ Linked Discord <@${discordId}> with Roblox **${username}** (ID: ${userId})\n📤 Synced to GitHub.`
      )

    } catch (err) {
      console.error(err)
      return interaction.editReply(`⚠️ An error occurred while linking.`)
    }
  }
}
