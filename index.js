const {Client, Intents, MessageEmbed} = require("discord.js");
const dotenv = require("dotenv");
const util = require("util");
const fs = require("fs");

//init dotenv
dotenv.config();

let discord_token = process.env.DISCORD_TOKEN; //Discord Bot Token (env: DISCORD_TOKEN)
let discord_guild = process.env.DISCORD_GUILD_ID; //Discord Guild ID (ID of you discord server) (env: DISCORD_GUILD)
let account_dir = __dirname+"/accounts/";

//Data for all commands
const command_data = {
    'generate': {
        name: 'generate',
        description: 'Generate a random account',
        options: [{
            name: 'service',
            type: 'STRING',
            description: 'Name of account you want to generate',
            required: true
        }]
    },
    'stock': {
        name: 'stock',
        description: 'Check account stock'
    },
    'add': {
        name: 'add',
        description: 'Add a random account',
        options: [
            {
                name: 'service',
                type: 'STRING',
                description: 'Name of account service (Minecraft, Netflix)',
                required: true
            },
            {
                name: 'account',
                type: 'STRING',
                description: 'Account (email:password)',
                required: true
            }
        ]
    },
    'help': {
        name: 'help',
        description: 'View all commands for generator',
    }
}

//Set bot intents
const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const create_embed = (content) => {

    const embed = new MessageEmbed()
        .setColor('#009ad6')
        .setTitle('Account Generator')
        .setDescription("**"+content+"**");

    return embed;
}

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

//check for on ready event
bot.on('ready', async () => {
    console.log("The bot is online");

    //Create commands
    const generate_command = await bot.guilds.cache.get(discord_guild)?.commands.create(command_data['generate']);
    const stock_command = await bot.guilds.cache.get(discord_guild)?.commands.create(command_data['stock']);
    const add_command = await bot.guilds.cache.get(discord_guild)?.commands.create(command_data['add']);
    const help_command = await bot.guilds.cache.get(discord_guild)?.commands.create(command_data['help']);
});

bot.on('interactionCreate', async interaction => {
    if(interaction.isCommand){
        let command_name = (interaction.commandName).toLowerCase();
        if(command_name === "generate"){
            try{
                let generate_service = (interaction.options.getString("service")).toLowerCase();
                let generate_file = account_dir+generate_service+".json";

                if(fs.existsSync(generate_file)){
                    fs.readFile(generate_file, "utf8", async function(err, data){
                        if(err){
                            throw err;
                        }

                        if(data && data.length){
                            account_array = JSON.parse(data);
                            account_array_len = account_array.length;
                            account_rand = Math.floor(Math.random() * account_array_len);
                            account_name = capitalize(generate_service);
                            account_val = account_array[account_rand];
    
                            if(account_val){
                                const reply_embed = create_embed("✅ Check your messages for the account");
                                const dm_embed = create_embed("Your "+account_name+" account:\n\n"+account_val);
                                let user_full = interaction.user.username+"#"+interaction.user.discriminator;
                                interaction.user.send({embeds: [dm_embed]}).catch(() => {console.log("Can't DM user: %d", user_full)});
        
                                await interaction.reply({embeds: [reply_embed], ephemeral: true});
                            }
                            else{
                                const embed = create_embed("⚠️ No stock available");
                                await interaction.reply({embeds: [embed], ephemeral: true});
                            }
                        }
                        else{
                            const embed = create_embed("⚠️ No stock available");
                            await interaction.reply({embeds: [embed], ephemeral: true});
                        }
                    });
                }
                else{
                    const embed = create_embed("⚠️ This account service does not exist");
                    await interaction.reply({embeds: [embed], ephemeral: true});
                }
            }
            catch(err){
                console.log(err);
            }
        }
        else if(command_name === "stock"){

            try{
                fs.readdir(account_dir, 'utf-8', async (err, data) => {

                    let stock_msg = "";

                    for (const file of data){
                        const accounts = await util.promisify(fs.readFile)(account_dir+file, 'utf8');
                        const clean_name = file.substring(0, file.length - 5);
                        accounts_len = JSON.parse(accounts).length;
                        stock_msg += capitalize(clean_name)+": "+accounts_len+"\n";
                    }
                    const embed = create_embed(stock_msg);
                    interaction.reply({embeds: [embed], ephemeral: true})
                });
            }
            catch(err){
                const embed = create_embed("⚠️ Sorry, can't fetch stock right now");
                interaction.reply({embeds: [embed], ephemeral: true})
                console.log(err);
            }
        }
        else if(command_name === "add"){
            if(interaction.member.permissions.has("ADMINISTRATOR")){
                try{
                    let generate_service = (interaction.options.getString("service")).toLowerCase();
                    let generate_account = (interaction.options.getString("account"));
    
                    let generate_file = account_dir+generate_service+".json";
    
                    if(fs.existsSync(generate_file)){
                        fs.readFile(generate_file, "utf8", async function(err, data){
                            if(err){
                                throw err;
                            }
                            if(data && data.length){
                                let account_array = JSON.parse(data);
                                account_array.push(generate_account);
                                account_array_json = JSON.stringify(account_array);
                                fs.writeFile(generate_file, account_array_json, () => {
                                    const embed = create_embed("✅ This account has been added");
                                    interaction.reply({embeds: [embed], ephemeral: true});
                                });
                            }
                            else{
                                
                                let account_array_json = JSON.stringify([generate_account]);
                                fs.writeFile(generate_file, account_array_json, () => {
                                    const embed = create_embed("✅ New service has been created and account added");
                                    interaction.reply({embeds: [embed], ephemeral: true});
                                });
                            }
                        });
                    }
                    else{
    
                        let account_array_json = JSON.stringify([generate_account]);
                        fs.writeFile(generate_file, account_array_json, () => {
                            const embed = create_embed("✅ New service has been created and account added");
                            interaction.reply({embeds: [embed], ephemeral: true});
                        });
                    }
                }
                catch(err){
                    console.log(err);
                }
            }
            else{
                const embed = create_embed("⚠️ Only admin's can use this command");
                interaction.reply({embeds: [embed], ephemeral: true});
            }
        }
        else if(command_name === "help"){

            let help_txt = "\n/generate <service>\n/stock\n/add <service> <account>\n/help";

            const embed = create_embed(help_txt);
            interaction.reply({embeds: [embed], ephemeral: true});
        }
    }
});

//Log bot in with token
bot.login(discord_token);