import React from 'react';

const Avatar = ({ user, size = '40px' }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        return name.substring(0, 2).toUpperCase();
    };

    const name = user?.firestoreData?.name || user?.displayName || user?.email || '?';
    const photoURL = user?.photoURL || user?.firestoreData?.avatar;

    // Generate a random color based on the user's uid or name
    const getStringColor = (str) => {
        if (!str) return '#6366f1';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 60%)`;
    };

    const bgColor = getStringColor(user?.uid || name);

    if (photoURL) {
        return (
            <img
                src={photoURL}
                alt="Avatar"
                className="avatar"
                style={{ width: size, height: size }}
                referrerPolicy="no-referrer"
            />
        );
    }

    return (
        <div
            className="avatar"
            style={{ backgroundColor: bgColor, width: size, height: size, fontSize: `calc(${size} * 0.4)` }}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
