import React from 'react';

const Avatar = ({ seed, size = 40, className = '' }) => {
    // Using DiceBear "notionists" or "avataaars" or "bottts"
    // "notionists" is clean and friendly.
    // "bottts" is robotic.
    // "initials" is simple.
    // Let's go with "notionists" for a sketchy/friendly vibe

    // Fallback if no seed
    const safeSeed = seed || 'default';

    // Construct URL
    // We can use the official HTTP API for simplicity
    const style = 'notionists'; // or 'avataaars', 'bottts', 'adventurer'
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(safeSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <img
            src={url}
            alt="Avatar"
            className={`user-avatar ${className}`}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.2)'
            }}
        />
    );
};

export default Avatar;
