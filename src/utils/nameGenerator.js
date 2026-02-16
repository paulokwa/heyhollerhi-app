export const generateName = () => {
    const adjectives = [
        "Neon", "Cyber", "Cosmic", "Lunar", "Solar", "Velvet", "Electric", "Silent", "Rapid", "Misty",
        "Happy", "Lucky", "Sunny", "Calm", "Wild", "Bold", "Brave", "Swift", "Quiet", "Loud",
        "Red", "Blue", "Green", "Gold", "Silver", "Crystal", "Iron", "Steel", "Glass", "Stone"
    ];

    const nouns = [
        "Rider", "Walker", "Dreamer", "Surfer", "Glider", "Seeker", "Finder", "Keeper", "Watcher", "Runner",
        "Tiger", "Lion", "Wolf", "Eagle", "Hawk", "Bear", "Fox", "Owl", "Cat", "Dog",
        "Star", "Moon", "Sun", "Sky", "Cloud", "Rain", "Storm", "Wind", "Wave", "Ocean"
    ];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100);

    return `${adj} ${noun} ${number}`;
};
