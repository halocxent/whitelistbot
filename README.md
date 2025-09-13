# whitelistbot
this is the first version that i make i will update it 👍
#if u have any suggestion or improve feel free to fork


How to use?
1. go make account in [supabase](https://supabase.com/)
then go set up free plan (the nano one) then press "sql editor" in left bar
and paste
```create table linked_accounts (
  discord_id text primary key,
  roblox_username text not null,
  roblox_userid bigint not null
```
2.click run on bottom left or just click ctrl

3. after it if u have shell access paste this

```
git clone https://github.com/halocxent/whitelistbot.git
```

if u dont have shell access dont worry! zip the file and then upload

4. modify the ".env.example" rename it to ".env"
replace it with ur real token, id, etc
how to get it?
- supabase url you can get it from project settings in leftbar then data api
- supabase service role key you can grab it from project settings in leftbar then api keys
- discord token you can get it from [here](https://discord.com/developers/applications) click the bot that u already created then in leftbar click bot then reset token if you forget
- guild id? you can get it from ur discord server by right clicking the icon then copy server id(make sure ur developer option is true)
- client id? in [here](https://discord.com/developers/applications) go to oauth2 then copy the client id
- git token? go to [here](https://github.com/settings/tokens) then generate a new token
5. type
  ```
  npm install
  ```
  on shell (if you have shell if u dont have most likely will be installed by the hosting automatically)
6. create github repo with the exact path and name from env
  
7. create [vercel project](https://vercel.com/new) then go deploy the repo u created


9. if you have any trouble try to contact me in dicord @cxent
  recommended to deploy with [this host](https://bot-hosting.net/?aff=969877800746123284) or [this one](https://dashboard.katabump.com/auth/login#0d2770)
