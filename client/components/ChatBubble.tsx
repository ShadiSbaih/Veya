import { Colors } from '@/assets/constants/Colors';
import { styles } from '@/assets/styles/Bubble.styles';
import { Message } from '@/assets/types';
import { formatTime } from '@/utils/formatTime';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, Pressable } from 'react-native';

import { useApp } from '@/context/AppContext';

interface IChatBubbleProps {
    msg: Message;
    isMine: boolean;
    senderName?: string;
    onVote?: (messageId: string, optionId: string) => void;
    onCloseDecision?: (messageId: string) => void;
    onLongPress?: (message: Message) => void;
}

const ChatBubble = ({ msg, isMine, senderName, onVote, onCloseDecision, onLongPress }: IChatBubbleProps) => {

    const content = <BubbleContent msg={msg} isMine={isMine} senderName={senderName} onVote={onVote} onCloseDecision={onCloseDecision} />;

    return (
        <Pressable
            onLongPress={() => onLongPress?.(msg)}
            delayLongPress={450}
            style={[styles.row, isMine ? styles.rowMe : styles.rowThem]}
        >
            <View style={[styles.bubble, isMine ? styles.bubbleMe : styles.bubbleThem]}>
                {content}
            </View>
        </Pressable>
    )
};

export default ChatBubble;

function BubbleContent({ msg, isMine, senderName, onVote, onCloseDecision }: { msg: Message; isMine: boolean; senderName?: string; onVote?: (mId: string, oId: string) => void, onCloseDecision?: (mId: string) => void }) {
    const { auth } = useApp();
    const currentUserId = auth.user?._id;

    // Premium Checkmark logic (only for my messages)
    const renderFooter = (marginTop = 0) => (
        <View style={[styles.footer, isMine ? styles.footerRight : styles.footerLeft, { marginTop }]}>
            <Text style={[styles.timeText, isMine ? styles.timeMe : styles.timeThem]}>{formatTime(msg.createdAt)}</Text>
            {isMine && (
                <Ionicons name={msg.read ? "checkmark-done" : "checkmark"}
                    size={14} color={msg.read ? Colors.onPrimary : `${Colors.onPrimary}88`} style={{ marginLeft: 2 }} />
            )}
        </View>
    );

    if (msg.messageType === 'decision' && msg.decisionData) {
        const isClosed = (msg.decisionData as any).status === "closed";
        let winnerText = "";
        if (isClosed) {
            const sorted = [...msg.decisionData.options].sort((a, b) => b.votes.length - a.votes.length);
            winnerText = sorted[0]?.text || "No winner";
        }

        return (
            <View style={{ width: 240, padding: 12 }}>
                {senderName && !isMine && <Text style={styles.senderName}>{senderName}</Text>}
                <Text style={[styles.msgText, isMine ? styles.msgTextMe : styles.msgTextThem, { fontWeight: "600", marginBottom: 12, paddingHorizontal: 0, paddingTop: senderName && !isMine ? 4 : 0, paddingBottom: 0 }]}>
                    {msg.decisionData.question}
                </Text>

                {isClosed && (
                    <View style={{ backgroundColor: isMine ? 'rgba(255,255,255,0.1)' : Colors.surfaceHigh, padding: 8, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: isMine ? Colors.onPrimary : Colors.primary }}>DECISION CLOSED</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: isMine ? Colors.onPrimary : Colors.onSurface, marginTop: 4 }}>Winner: {winnerText}</Text>
                    </View>
                )}

                {msg.decisionData.options.map(opt => {
                    const hasVoted = opt.votes.includes(currentUserId || '');
                    const voteCount = opt.votes.length;
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            activeOpacity={isClosed ? 1 : 0.7}
                            onPress={() => !isClosed && onVote && onVote(msg._id, opt.id)}
                            style={{
                                backgroundColor: isMine
                                    ? (hasVoted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)')
                                    : (hasVoted ? Colors.primary : Colors.surfaceHigh),
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 8,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: isMine
                                    ? (hasVoted ? 'rgba(255,255,255,0.4)' : 'transparent')
                                    : (hasVoted ? Colors.primary : Colors.outlineVariant + '40'),
                                opacity: isClosed && !hasVoted ? 0.6 : 1
                            }}
                        >
                            <Text style={{ 
                                color: isMine ? Colors.onPrimary : (hasVoted ? Colors.onPrimary : Colors.onSurface),
                                fontWeight: hasVoted ? '600' : '500',
                                flex: 1,
                                fontSize: 14
                            }}>
                                {opt.text}
                            </Text>
                            {voteCount > 0 && (
                                <View style={{
                                    backgroundColor: isMine 
                                        ? (hasVoted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)')
                                        : (hasVoted ? Colors.surfaceLowest + '40' : Colors.outlineVariant + '20'),
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 12,
                                    marginLeft: 8
                                }}>
                                    <Text style={{ 
                                        color: isMine ? Colors.onPrimary : (hasVoted ? Colors.onPrimary : Colors.onSurfaceVariant),
                                        fontSize: 12,
                                        fontWeight: '600'
                                    }}>
                                        {voteCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
                
                {isMine && !isClosed && (
                    <TouchableOpacity onPress={() => onCloseDecision && onCloseDecision(msg._id)} style={{ marginTop: 4, alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}>
                        <Text style={{ color: Colors.onPrimary, fontSize: 13, fontWeight: '600' }}>Close Decision</Text>
                    </TouchableOpacity>
                )}

                {renderFooter(8)}
            </View>
        );
    }

    return (
        <View style={{ paddingBottom: 4 }}>
            {senderName && !isMine && <Text style={styles.senderName}>{senderName}</Text>}
            {msg.mediaUrl && (
                <View style={[styles.mediaWrapper, senderName && !isMine ? { paddingTop: 4 } : {}]}>
                    {msg.mediaType !== 'video' && (!msg.mediaUrl || !/\.(mp4|mov|avi|webm|mkv)$/i.test(msg.mediaUrl)) ? (
                        <TouchableOpacity onPress={() => Linking.openURL(msg.mediaUrl!)}>
                            <Image source={{ uri: msg.mediaUrl }} style={styles.mediaImage} resizeMode='cover' />
                        </TouchableOpacity>
                    ) : (
                        <VideoPlayer uri={msg.mediaUrl} style={styles.mediaVideo} />
                    )}
                </View>
            )}
            {msg.text ? (
                <Text style={[styles.msgText, isMine ? styles.msgTextMe : styles.msgTextThem]}>{msg.text}</Text>
            ) : null}

            {msg.entityType === "task" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginHorizontal: 10, marginTop: 6, opacity: 0.8 }}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={isMine ? Colors.onPrimary : Colors.primary} />
                    <Text style={{ color: isMine ? Colors.onPrimary : Colors.primary, fontSize: 11, fontWeight: "700" }}>Added as an action</Text>
                </View>
            )}

            {renderFooter(msg.text ? 0 : 4)}
        </View>
    )
}

function VideoPlayer({ uri, style }: { uri: string, style: any }) {
    const player = useVideoPlayer({ uri }, (p) => {
        p.loop = false
    })
    return <VideoView player={player} style={style} nativeControls />
}
