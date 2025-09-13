require('dotenv').config()
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js')

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

client.commands = new Collection()

const commandFiles = [
  './link.js',
  './ping.js'
]

for (const file of commandFiles) {
  try {
    const command = require(file)
    if (command && command.data && typeof command.data.name === 'string') {
      client.commands.set(command.data.name, command)
    }
  } catch (err) {
    console.error(`Failed to load ${file}:`, err)
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`)

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)
  const commands = client.commands.map(cmd => cmd.data.toJSON())

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commands }
    )
    console.log(`Registered ${commands.length} commands to guild ${process.env.GUILD_ID}`)
  } catch (error) {
    console.error('Failed to register commands:', error)
  }

  client.user.setActivity('.gg/mangoside', { type: 1 })  //replace with ur guild invite or maybe another thing u want u also can delete if u want to
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const command = client.commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error)

    const msg = {
      content: 'An error occurred while executing the command.',
      ephemeral: true
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg)
    } else {
      await interaction.reply(msg)
    }
  }
})


client.login(process.env.DISCORD_TOKEN)
