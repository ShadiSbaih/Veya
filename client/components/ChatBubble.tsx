import { Colors } from '@/assets/constants/Colors';
import { styles } from '@/assets/styles/Bubble.styles';
import { Message } from '@/assets/types';
import { formatTime } from '@/utils/formatTime';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';

interface IChatBubbleProps {
    msg: Message;
    isMine: boolean;
}

const ChatBubble = ({ msg, isMine }: IChatBubbleProps) => {


    const content = <BubbleContent msg={msg} isMine={isMine} />;


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
function BubbleContent({ msg, isMine }: { msg: Message; isMine: boolean }) {
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