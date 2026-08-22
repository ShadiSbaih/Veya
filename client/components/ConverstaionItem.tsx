import { styles } from '@/assets/styles/ConvoItem.styles';
import { Conversation } from '@/assets/types';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Avatar from './Avatar';
import { formatTime } from '@/utils/formatTime'
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/assets/constants/Colors';
import { formatSpaceDeadline, getSpaceStatusLabel } from '@/utils/space';

interface ConverstaionItemProps {
    converstaion: Conversation,
    selected: boolean,
    onPress: () => void;
    onLongPress?: () => void;
    onDelete?: () => void;
}

export default function ConverstaionItem({ converstaion, selected, onPress, onLongPress, onDelete }: ConverstaionItemProps) {
    const avatar = converstaion.participant?.avatar;
    const online = converstaion.participant?.isOnline;
    
    let lastMsg = converstaion.lastMessage?.text || (converstaion.lastMessage?.mediaType === "image" ? "📷 Photo" : converstaion.lastMessage?.mediaUrl ? "📽 Video" : "Start a conversation ");
    if (converstaion.lastMessage?.messageType === "decision" && converstaion.lastMessage?.decisionData) {
        lastMsg = `📊 ${converstaion.lastMessage.decisionData.question}`;
    }

    const space = converstaion.space;
    const isSpace = !!space;
    const isContextual = !isSpace && converstaion.contextType && converstaion.contextType !== "chat";
    const context = converstaion.context;
    
    // Default chat details
    let displayName = space
        ? space.title
        : converstaion.isGroup
        ? (converstaion.context?.title || "Group Chat") 
        : (converstaion.participant?.name || "User");
    let displaySub = space
        ? `${getSpaceStatusLabel(space.status)}${formatSpaceDeadline(space.deadline) ? ` · Due ${formatSpaceDeadline(space.deadline)}` : ""}`
        : converstaion.isGroup
        ? `${converstaion.participants?.length || 0} members` 
        : `@${converstaion.participant?.handle}`;
    let iconName = isSpace ? 'layers' : converstaion.isGroup ? 'people' : null;

    if (isContextual) {
        displayName = context?.title || "Context Conversation";
        
        const parts = [];
        if (context?.date) parts.push(context.date);
        if (context?.time) parts.push(context.time);
        if (context?.deadline) parts.push(`Deadline: ${context.deadline}`);
        if (context?.location) parts.push(context.location);
        
        displaySub = parts.length > 0 ? parts.join(' · ') : `${converstaion.contextType} context`;

        switch (converstaion.contextType) {
            case 'plan': iconName = 'map'; break;
            case 'event': iconName = 'calendar'; break;
            case 'decision': iconName = 'help-circle'; break;
            case 'study': iconName = 'book'; break;
            case 'project': iconName = 'briefcase'; break;
            default: iconName = 'chatbubble'; break;
        }

        if (converstaion.status === 'completed') {
            displaySub = `[Completed] ${displaySub}`;
            iconName = 'checkmark-done';
        }
    }

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} onLongPress={onLongPress} delayLongPress={400} style={[styles.row, selected && styles.rowSelected, isContextual && styles.contextualRow, converstaion.status === 'completed' && { opacity: 0.7 }]}>
            <View>
                {converstaion.isGroup && !isContextual && !isSpace ? (
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="people" size={24} color={Colors.primary} />
                    </View>
                ) : (
                    <Avatar name={displayName} src={avatar} size={48} online={online} />
                )}
                {isContextual && iconName && (
                    <View style={styles.contextBadge}>
                        <Ionicons name={iconName as any} size={12} color={Colors.surfaceLowest} />
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <View style={styles.topRow}>
                    <View style={styles.nameCol}>
                        <Text style={[styles.name, isContextual && styles.contextName]} numberOfLines={1}>{displayName}</Text>
                        <Text style={isContextual ? styles.contextSub : styles.handle} numberOfLines={1}>{displaySub}</Text>
                    </View>

                    {converstaion.updatedAt &&
                        <Text style={styles.time}>
                            {formatTime(converstaion.updatedAt)}
                        </Text>}
                </View>

                <Text style={styles.lastMsg} numberOfLines={1}>{lastMsg}</Text>

            </View>
        </TouchableOpacity>
    )
}
