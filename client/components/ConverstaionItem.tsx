import { styles } from '@/assets/styles/ConvoItem.styles';
import { Conversation } from '@/assets/types';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Avatar from './Avatar';
import { formatTime } from '@/utils/formatTime'

interface ConverstaionItemProps {
    converstaion: Conversation,
    selected: boolean,
    onPress: () => void;
}

export default function ConverstaionItem({ converstaion, selected, onPress }: ConverstaionItemProps) {

    const name = converstaion.participant?.name || "User";
    const avatar = converstaion.participant?.avatar;
    const online = converstaion.participant?.isOnline;
    const sub = `@${converstaion.participant?.handle}`;
    const lastMsg = converstaion.lastMessage?.text || (converstaion.lastMessage?.mediaType === "image" ? "📷 Photo" : converstaion.lastMessage?.mediaUrl ? "📽 Video" : "Start a conversation ")


    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.row, selected && styles.rowSelected]}>
            <Avatar name={name} src={avatar} size={48} online={online} />
            <View style={styles.info}>
                <View style={styles.topRow}>
                    <View style={styles.nameCol}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.handle}>{sub}</Text>
                    </View>

                    {converstaion.updatedAt &&
                        <Text style={styles.time}>
                            {formatTime(converstaion.updatedAt)}
                        </Text>}
                </View>

                <Text>{lastMsg}</Text>

            </View>
        </TouchableOpacity>
    )
}