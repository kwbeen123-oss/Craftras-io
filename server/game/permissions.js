module.exports = [
    {
        key: process.env.CREATIVE,
        discordID: "0",
        nameColor: "#ffffff",
        level: 1,
        creative: true,
        commands: false,
        name: "Creative",
        note: "Craftras creative mode",
    },
    {
        key: process.env.ADMIN,
        discordID: "0",
        nameColor: "#4aa3ff",
        level: 3,
        creative: true,
        commands: true,
        admin: true,
        name: "Admin",
        note: "Craftras administrator",
    },
].filter(entry => entry.key);
