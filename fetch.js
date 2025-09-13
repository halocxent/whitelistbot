const { SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const logger = require('./logger');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fetch')
    .setDescription('Manually copy database to Roblox database'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Fetch from Supabase
      const [redeemedRes, blacklistRes, codesRes] = await Promise.all([
        supabase.from('redeemed_users').select('*'),
        supabase.from('blacklist').select('*'),
        supabase.from('codes').select('*')
      ]);

      if (redeemedRes.error || blacklistRes.error || codesRes.error) {
        throw new Error(`Supabase error: ${redeemedRes.error?.message || blacklistRes.error?.message || codesRes.error?.message}`);
      }

      // Format with nulls
      const redeemedFormatted = redeemedRes.data.map(row => ({
        roblox_id: row.roblox_id ?? null,
        linked_at: row.linked_at ?? null,
        redeemed_at: row.redeemed_at ?? null,
        discord_id: row.discord_id ?? null,
        roblox_username: row.roblox_username ?? null,
        code: row.code ?? null,
        plan: row.plan ?? null
      }));

      const blacklistFormatted = blacklistRes.data.map(row => ({
        roblox_id: row.roblox_id ?? null,
        blacklisted_at: row.blacklisted_at ?? null,
        discord_id: row.discord_id ?? null,
        roblox_username: row.roblox_username ?? null,
        plan: row.plan ?? null
      }));

      const codesFormatted = codesRes.data.map(row => ({
        id: row.id ?? null,
        used: row.used ?? null,
        claimed_at: row.claimed_at ?? null,
        created_at: row.created_at ?? null,
        created_by: row.created_by ?? null,
        code: row.code ?? null,
        claimed_by: row.claimed_by ?? null,
        user_id: row.user_id ?? null,
        key: row.key ?? null,
        type: row.type ?? null
      }));

      // Write local files
      fs.writeFileSync('./redeemed.json', JSON.stringify(redeemedFormatted, null, 2));
      fs.writeFileSync('./blacklist.json', JSON.stringify(blacklistFormatted, null, 2));
      fs.writeFileSync('./codes.json', JSON.stringify(codesFormatted, null, 2));

      // Push each to GitHub
      await pushToGitHub('redeemed.json', process.env.GITHUB_PATH1);
      await pushToGitHub('blacklist.json', process.env.GITHUB_PATH2);
      await pushToGitHub('codes.json', process.env.GITHUB_PATH3);

      await interaction.editReply('✅ Database copied!');
      await logger(interaction); // ✅ Log the command
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Failed to fetch data.');
    }
  }
};

async function pushToGitHub(localPath, remotePath) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const content = fs.readFileSync(localPath, 'utf8');

  // Get current file SHA if it exists
  let sha = undefined;
  try {
    const { data: existingFile } = await octokit.repos.getContent({
      owner,
      repo,
      path: remotePath,
      ref: process.env.GITHUB_BRANCH || 'main'
    });

    if (existingFile && existingFile.sha) {
      sha = existingFile.sha;
    }
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  // Push to GitHub
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: remotePath,
    message: `Update ${remotePath}`,
    content: Buffer.from(content).toString('base64'),
    branch: process.env.GITHUB_BRANCH || 'main',
    sha
  });
}
