import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import Icon from '@/components/ui/Icon';
import { chatbotStyles as styles } from '@/styles/chatbot.styles';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'bot' | 'user';
};

const SUGGESTIONS = [
  '¿Qué bus sirve para el Hospital?',
  '¿Cuál es la tarifa actual?',
  '¿Horarios de la ruta R-02?',
];

export default function ChatbotWidget({ isCompact = false }: Readonly<{ isCompact?: boolean }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy RutaBot 🤖, tu asistente de transporte para Tunja. Próximamente podrás preguntarme en tiempo real sobre rutas, tarifas y paraderos.',
      sender: 'bot',
    },
  ]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: '🚀 ¡Esta funcionalidad estará disponible muy pronto! Estamos preparando a RutaBot para ayudarte a navegar por Tunja en tiempo real.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 600);
  };

  return (
    <View style={[styles.container, isCompact && styles.containerPhone]}>
      {/* Floating Popover Window */}
      {isOpen && (
        <View style={[styles.chatWindow, isCompact && styles.chatWindowPhone]}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <View style={styles.headerInfo}>
              <Image
                source={require('@/assets/images/bot.png')}
                style={styles.headerAvatar}
              />
              <View>
                <Text style={styles.headerTitle}>RutaBot</Text>
                <View style={styles.headerSubtitleRow}>
                  <View style={styles.headerStatusDot} />
                  <Text style={styles.headerSubtitle}>Asistente Virtual · Próximamente</Text>
                </View>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Cerrar chat"
              onPress={() => setIsOpen(false)}
              style={styles.closeButton}
            >
              <Icon name="close" color="#728092" size={18} />
            </Pressable>
          </View>

          {/* Body / Message List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatBody}
            contentContainerStyle={styles.chatBodyContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Welcome Box */}
            <View style={styles.welcomeBox}>
              <Image
                source={require('@/assets/images/bot.png')}
                style={styles.welcomeAvatar}
              />
              <Text style={styles.welcomeTitle}>¡Próximamente IA en Tunja!</Text>
              <Text style={styles.welcomeText}>
                Estamos construyendo a RutaBot para que planificar tu viaje en la ciudad sea aún más fácil.
              </Text>
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingBadgeText}>EN DESARROLLO</Text>
              </View>
            </View>

            {/* Conversation Bubbles */}
            <View style={styles.messageGroup}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={msg.sender === 'bot' ? styles.botBubble : styles.userBubble}
                >
                  <Text
                    style={msg.sender === 'bot' ? styles.botMessageText : styles.userMessageText}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Quick Suggestion Chips */}
            <Text style={styles.suggestionsTitle}>Consultas de prueba:</Text>
            <View style={styles.suggestionsRow}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSendMessage(suggestion)}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Escribe una pregunta de prueba..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              style={styles.textInput}
            />
            <Pressable
              accessibilityLabel="Enviar mensaje"
              onPress={() => handleSendMessage()}
              style={styles.sendButton}
            >
              <Icon name="arrow" color="#ffffff" size={18} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Floating Action Trigger Button */}
      <Pressable
        accessibilityLabel="Abrir asistente virtual RutaBot"
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.floatingButton, isCompact && styles.floatingButtonPhone]}
      >
        <Image
          source={require('@/assets/images/bot.png')}
          style={[styles.floatingAvatar, isCompact && styles.floatingAvatarPhone]}
        />
        <View style={styles.badgeDot} />
      </Pressable>
    </View>
  );
}
