import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/assets/constants/Colors';
import { ConversationContext, ConversationContextType } from '@/assets/types';

interface ContextHeaderProps {
    contextType: ConversationContextType;
    context?: ConversationContext;
    participantCount: number;
    status?: string;
}

export default function ContextHeader({ contextType, context, participantCount, status }: ContextHeaderProps) {
    const [expanded, setExpanded] = useState(false);

    if (contextType === 'chat' || !context) return null;

    const getIcon = () => {
        switch (contextType) {
            case 'plan': return 'map';
            case 'event': return 'calendar';
            case 'decision': return 'help-circle';
            case 'study': return 'book';
            case 'project': return 'briefcase';
            default: return 'chatbubble';
        }
    };

    const getPrimaryLine = () => {
        const parts = [];
        if (context.date) parts.push(context.date);
        if (context.time) parts.push(context.time);
        if (context.deadline) parts.push(`Deadline: ${context.deadline}`);
        if (context.location) parts.push(context.location);
        
        if (parts.length === 0) return `${participantCount} participants`;
        return parts.join(' · ');
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.header} 
                activeOpacity={0.7} 
                onPress={() => setExpanded(!expanded)}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={getIcon()} size={20} color={Colors.primary} />
                </View>
                <View style={styles.info}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                            {context.title || 'Context Conversation'}
                        </Text>
                        {status === 'completed' && (
                            <View style={styles.completedBadge}>
                                <Text style={styles.completedText}>Completed</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {getPrimaryLine()}
                    </Text>
                </View>
                <Ionicons 
                    name={expanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={Colors.outlineVariant} 
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.expandedContent}>
                    {context.course && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Course:</Text>
                            <Text style={styles.detailValue}>{context.course}</Text>
                        </View>
                    )}
                    {context.date && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{context.date}</Text>
                        </View>
                    )}
                    {context.time && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time:</Text>
                            <Text style={styles.detailValue}>{context.time}</Text>
                        </View>
                    )}
                    {context.deadline && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Deadline:</Text>
                            <Text style={styles.detailValue}>{context.deadline}</Text>
                        </View>
                    )}
                    {context.location && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{context.location}</Text>
                        </View>
                    )}
                    {context.description && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Description:</Text>
                            <Text style={styles.detailValue}>{context.description}</Text>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Participants:</Text>
                        <Text style={styles.detailValue}>{participantCount} people</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surfaceLowest,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceHigh,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.onSurface,
        flexShrink: 1,
    },
    completedBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    completedText: {
        color: Colors.onPrimary,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 4,
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailLabel: {
        width: 90,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
        fontWeight: '500',
    },
    detailValue: {
        flex: 1,
        fontSize: 13,
        color: Colors.onSurface,
    },
});
