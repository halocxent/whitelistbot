# whitelistbot
this is the first version that i make i will update it 👍

How to use?
1. go make account in [supabase](https://supabase.com/)
then go set up free plan (the nano one) then press "sql editor" in left bar
and paste ```create table linked_accounts (
  discord_id text primary key,
  roblox_username text not null,
  roblox_userid bigint not null
);```
then click run on bottom left or just click ctrl

2. after it if u have shell access paste this
```git clone https://github.com/halocxent/whitelistbot.git```
if u dont have shell access dont worry! you can download the release package then upload to ur host

3. modify the ".env.example" rename it to ".env"
