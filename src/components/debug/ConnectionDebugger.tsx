import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import webSocketControllerService from '../../services/WebSocketControllerService';
import nativeSocketService from '../../services/NativeSocketService';
import { normalizeSize, scaleFontSize } from '../../utils/SizeUtils';

interface Message {
  type: string;
  content: string;
  timestamp: number;
  direction: 'in' | 'out';
}

const ConnectionDebugger: React.FC = () => {
  // Connection state
  const [isServerRunning, setIsServerRunning] = useState<boolean>(false);
  const [clientCount, setClientCount] = useState<number>(0);
  const [connectionPort, setConnectionPort] = useState<number>(0);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Capture the original broadcast function to monitor outgoing messages
  useEffect(() => {
    const originalBroadcast = nativeSocketService.broadcast;
    
    // Replace with our monitoring version
    (nativeSocketService as any).broadcast = (data: any) => {
      // Call the original function
      originalBroadcast.call(nativeSocketService, data);
      
      // Record this outgoing message
      const newMessage: Message = {
        type: data.type || 'unknown',
        content: JSON.stringify(data),
        timestamp: Date.now(),
        direction: 'out'
      };
      
      setMessages(prev => [newMessage, ...prev].slice(0, 10)); // Keep last 10 messages
    };
    
    // Setup message handler to capture incoming messages
    const messageHandler = (data: any) => {
      const newMessage: Message = {
        type: data.type || 'unknown',
        content: JSON.stringify(data),
        timestamp: Date.now(),
        direction: 'in'
      };
      
      setMessages(prev => [newMessage, ...prev].slice(0, 10)); // Keep last 10 messages
    };
    
    nativeSocketService.addMessageHandler(messageHandler);
    
    // Restore original function on cleanup
    return () => {
      (nativeSocketService as any).broadcast = originalBroadcast;
      nativeSocketService.removeMessageHandler(messageHandler);
    };
  }, []);
  
  // Update status every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsServerRunning(nativeSocketService.isRunning());
      setClientCount(nativeSocketService.getClientCount());
      setConnectionPort(nativeSocketService.getPort());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  if (!expanded) {
    return (
      <TouchableOpacity 
        style={styles.collapsedContainer}
        onPress={() => setExpanded(true)}
      >
        <Text style={styles.collapsedText}>
          WS: {isServerRunning ? '✅' : '❌'} Clients: {clientCount}
        </Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={() => setExpanded(false)}
      >
        <Text style={styles.headerText}>Connection Debugger</Text>
        <Text style={styles.collapseText}>➖</Text>
      </TouchableOpacity>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Server: {isServerRunning ? '✅ Running' : '❌ Stopped'}
        </Text>
        <Text style={styles.statusText}>
          Port: {connectionPort}
        </Text>
        <Text style={styles.statusText}>
          Clients: {clientCount}
        </Text>
      </View>
      
      <View style={styles.messagesContainer}>
        <Text style={styles.sectionHeader}>Recent Messages:</Text>
        <ScrollView style={styles.messagesList}>
          {messages.length === 0 ? (
            <Text style={styles.noMessagesText}>No messages yet</Text>
          ) : (
            messages.map((msg, index) => (
              <View key={index} style={styles.messageItem}>
                <Text style={[
                  styles.messageDirection,
                  msg.direction === 'in' ? styles.incomingMessage : styles.outgoingMessage
                ]}>
                  {msg.direction === 'in' ? '📥' : '📤'} {msg.type}
                </Text>
                <Text style={styles.messageTime}>{formatTimestamp(msg.timestamp)}</Text>
                <Text style={styles.messageContent} numberOfLines={2}>
                  {msg.content}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            isServerRunning ? styles.stopButton : styles.startButton
          ]}
          onPress={() => {
            if (isServerRunning) {
              webSocketControllerService.stop();
            } else {
              webSocketControllerService.start();
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {isServerRunning ? 'Stop Server' : 'Start Server'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: normalizeSize(50),
    right: normalizeSize(10),
    width: normalizeSize(300),
    backgroundColor: 'rgba(10, 20, 30, 0.9)',
    borderRadius: normalizeSize(10),
    padding: normalizeSize(10),
    zIndex: 1000,
  },
  collapsedContainer: {
    position: 'absolute',
    bottom: normalizeSize(50),
    right: normalizeSize(10),
    backgroundColor: 'rgba(10, 20, 30, 0.9)',
    borderRadius: normalizeSize(10),
    padding: normalizeSize(5),
    zIndex: 1000,
  },
  collapsedText: {
    color: 'white',
    fontSize: scaleFontSize(12),
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalizeSize(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: normalizeSize(5),
  },
  headerText: {
    color: 'white',
    fontSize: scaleFontSize(16),
    fontWeight: 'bold',
  },
  collapseText: {
    color: 'white',
    fontSize: scaleFontSize(14),
  },
  statusContainer: {
    marginBottom: normalizeSize(10),
  },
  statusText: {
    color: 'white',
    fontSize: scaleFontSize(14),
    marginBottom: normalizeSize(5),
  },
  messagesContainer: {
    marginBottom: normalizeSize(10),
    maxHeight: normalizeSize(150),
  },
  sectionHeader: {
    color: 'white',
    fontSize: scaleFontSize(14),
    fontWeight: 'bold',
    marginBottom: normalizeSize(5),
  },
  messagesList: {
    maxHeight: normalizeSize(120),
  },
  noMessagesText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: normalizeSize(10),
  },
  messageItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: normalizeSize(5),
    padding: normalizeSize(5),
    marginBottom: normalizeSize(5),
  },
  messageDirection: {
    color: 'white',
    fontSize: scaleFontSize(12),
    fontWeight: 'bold',
  },
  incomingMessage: {
    color: '#4caf50',
  },
  outgoingMessage: {
    color: '#2196f3',
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: scaleFontSize(10),
  },
  messageContent: {
    color: 'white',
    fontSize: scaleFontSize(11),
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: normalizeSize(8),
    borderRadius: normalizeSize(5),
    alignItems: 'center',
    minWidth: normalizeSize(100),
  },
  startButton: {
    backgroundColor: '#4caf50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ConnectionDebugger; 