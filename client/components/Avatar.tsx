import { styles } from '@/assets/styles/Avatar.styles';
import React from 'react';
import { View, Text, Image } from 'react-native';


const PALETTE = ["#7b3ff2", "#ff64c8", "#dd5b00", "#1aae39", "#2a9d99"]

interface IAvatarProps {
    name: string,
    size?: number,
    online?: boolean,
    src?: string
}

const Avatar = ({ name, size = 40, online, src }: IAvatarProps) => {

    const color = PALETTE[name.charCodeAt(0) % PALETTE.length];
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const idicatorSize = Math.round(size * 0.28);
    return (
        <View style={[styles.root, { width: size, height: size }]}>
            <View style={[styles.circle, {
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: src ? "transparent" : color
            }]}>
                {
                    src ? (
                        <Image source={{ uri: src }}
                            style={{ width: size, height: size, borderRadius: size / 2 }} />
                    ) :
                        (
                            <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
                                {initials}
                            </Text>
                        )
                }
            </View>
            {online !== undefined && <View style={[styles.indicator, {
                width: idicatorSize,
                height: idicatorSize,
                borderRadius: idicatorSize / 2,
                backgroundColor: online ? "#22c55e" : "#abadae",
                bottom: 0,
                right: 0,
            }]} />}
        </View>
    );
};

export default Avatar;