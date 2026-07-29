import { Colors } from '@/assets/constants/Colors';
import { styles } from '@/assets/styles/Bubble.styles';
import { Message } from '@/assets/types';
import { formatTime } from '@/utils/formatTime';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';

import { api, useApp } from '@/context/AppContext';

interface IChatBubbleProps {
    msg: Message;
    isMine: boolean;
    onVote?: (messageId: string, optionId: string) => void;
}

const ChatBubble = ({ msg, isMine, onVote }: IChatBubbleProps) => {


    const content = <BubbleContent msg={msg} isMine={isMine} onVote={onVote} />;


    return (
        <View style={[styles.row, isMine ? styles.rowMe : styles.rowThem]}>
            {isMine ? (
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bubble, styles.bubbleMe]}
                >
                    {content}
                </LinearGradient>
            ) : (
                <View style={[styles.bubble, styles.bubbleThem]}>{content}</View>
            )}
        </View>
    )
};

export default ChatBubble;
function BubbleContent({ msg, isMine, onVote }: { msg: Message; isMine: boolean; onVote?: (mId: string, oId: string) => void }) {
    const { auth } = useApp();
    const currentUserId = auth.user?._id;

    if (msg.messageType === 'decision' && msg.decisionData) {
        return (
            <View style={{ width: 220 }}>
                <Text style={[styles.msgText, isMine ? styles.msgTextMe : styles.msgTextThem, { fontWeight: '700', marginBottom: 12 }]}>
                    {msg.decisionData.question}
                </Text>
                {msg.decisionData.options.map(opt => {
                    const hasVoted = opt.votes.includes(currentUserId || '');
                    const voteCount = opt.votes.length;
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            activeOpacity={0.7}
                            onPress={() => onVote && onVote(msg._id, opt.id)}
                            style={{
                                backgroundColor: hasVoted ? Colors.primary : Colors.surfaceHigh,
                                padding: 10,
                                borderRadius: 8,
                                marginBottom: 8,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderWidth: hasVoted ? 0 : 1,
                                borderColor: Colors.outlineVariant + '40',
                            }}
                        >
                            <Text style={{ 
                                color: hasVoted ? Colors.onPrimary : Colors.onSurface,
                                fontWeight: hasVoted ? '600' : '400',
                                flex: 1
                            }}>
                                {opt.text}
                            </Text>
                            {voteCount > 0 && (
                                <View style={{
                                    backgroundColor: hasVoted ? Colors.surfaceLowest + '40' : Colors.outlineVariant + '20',
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 12,
                                    marginLeft: 8
                                }}>
                                    <Text style={{ 
                                        color: hasVoted ? Colors.onPrimary : Colors.onSurfaceVariant,
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
                <View style={[styles.footer, isMine ? styles.footerRight : styles.footerLeft]}>
                    <Text style={[styles.timeText, isMine ? styles.timeMe : styles.timeThem]}>{formatTime(msg.createdAt)}</Text>
                </View>
            </View>
        );
    }

    return (
        <View>
            {msg.mediaUrl && (
                <View style={styles.mediaWrapper}>
                    {msg.mediaType === 'image' ? (
                        <TouchableOpacity onPress={() => Linking.openURL(msg.mediaUrl!)}>
                            <Image source={{ uri: msg.mediaUrl }} style={styles.mediaImage} resizeMode='cover' />
                        </TouchableOpacity>
                    ) : (
                        <VideoPlayer uri={msg.mediaUrl} style={styles.mediaVideo} />
                    )}
                </View>
            )}
            {msg.text && <Text style={[styles.msgText, isMine ? styles.msgTextMe : styles.msgTextThem]}>{msg.text}</Text>}

            <View style={[styles.footer, isMine ? styles.footerRight : styles.footerLeft]}>
                <Text style={[styles.timeText, isMine ? styles.timeMe : styles.timeThem]}>{formatTime(msg.createdAt)}</Text>
            </View>

            {isMine && (
                <Ionicons name={msg.read ? "checkmark-done" : "checkmark"}
                    size={12} color={msg.read ? Colors.onPrimary : `${Colors.
                        onPrimary}88`} />
            )}
        </View>
    )
}

function VideoPlayer({ uri, style }: { uri: string, style: any }) {
    const player = useVideoPlayer({ uri }, (p) => {
        p.loop = false
    })
    return <VideoView player={player} style={style} nativeControls />
}