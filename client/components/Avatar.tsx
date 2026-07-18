import { styles } from '@/assets/styles/Avatar.styles';
import React from 'react';
import { View, Text, Image } from 'react-native';


const PALETTE = ["#4652b0", "#933880", "#3946a4", "#6750A4", "#7965AF"]

interface IAvatarProps {
    name: string,
    size?: number,
    outline?: boolean,
    src?: string
}

const Avatar = ({ name, size = 40, outline, src }: IAvatarProps) => {

    const color = PALETTE[name.charCodeAt(0) % PALETTE.length];
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const idicatorSize = Math.round(size * 0.28);
    return (
        <View style={[styles.root, { width: size, height: size }]}>
            <View style={[styles.circle, {
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: src ? "transpaernt" : color
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
            {outline !== undefined && <View style={[styles.indicator, {
                width: idicatorSize,
                height: idicatorSize,
                borderRadius: idicatorSize / 2,
                backgroundColor: outline ? "#22c55e" : "#abadae",
                bottom: 0,
                right: 0,
            }]} />}
        </View>
    );
};

export default Avatar;