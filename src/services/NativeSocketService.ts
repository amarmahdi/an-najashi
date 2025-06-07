import TcpSocket from 'react-native-tcp-socket';
import locationService from '../core/LocationSettings';

// Event types
type MessageHandler = (data: any) => void;
type ConnectionHandler = (clientId: string) => void;
type ErrorHandler = (error: Error) => void;

/**
 * A simplified WebSocket-like server implementation for React Native
 * using react-native-tcp-socket
 */
class NativeSocketService {
  private static instance: NativeSocketService;
  private server: any = null;
  private clients: Map<string, any> = new Map();
  private port: number = 3000;
  private nextClientId: number = 1;
  private isStarting: boolean = false;
  
  // Event handlers
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): NativeSocketService {
    if (!NativeSocketService.instance) {
      NativeSocketService.instance = new NativeSocketService();
    }
    return NativeSocketService.instance;
  }
  
  /**
   * Start the socket server
   */
  public start(port: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        console.log('Socket server already running');
        resolve();
        return;
      }
      
      if (this.isStarting) {
        console.log('Socket server is currently starting');
        resolve();
        return;
      }
      
      this.isStarting = true;
      this.port = port;
      
      console.log(`Attempting to start socket server on port ${port}...`);
      
      try {
        // Create TCP server with more detailed error handling
        console.log('Creating TCP server...');
        
        // Check if TcpSocket.createServer exists
        if (typeof TcpSocket.createServer !== 'function') {
          console.error('TcpSocket.createServer is not a function');
          this.isStarting = false;
          reject(new Error('TcpSocket.createServer is not available'));
          return;
        }
        
        // Try to create the server
        const server = TcpSocket.createServer((socket) => {
          const clientId = `client_${this.nextClientId++}`;
          const clientInfo = socket.address ? JSON.stringify(socket.address()) : 'unknown';
          
          console.log(`New client connected: ${clientId} from ${clientInfo}`);
          
          // Buffer for incoming data
          let dataBuffer = '';
          let isWebSocketHandshakeDone = false;
          
          // Store socket in clients map
          this.clients.set(clientId, {
            socket,
            isWebSocket: false,
            isWebSocketHandshakeDone: false
          });
          
          // Handle data from client
          socket.on('data', (data) => {
            try {
              // Convert buffer to string
              const rawData = data.toString();
              
              // Check if this might be a WebSocket handshake
              if (!isWebSocketHandshakeDone && rawData.includes('GET') && rawData.includes('Upgrade: websocket')) {
                console.log(`Client ${clientId} is attempting WebSocket handshake`);
                this.handleWebSocketHandshake(clientId, socket, rawData);
                isWebSocketHandshakeDone = true;
                this.clients.set(clientId, {
                  socket,
                  isWebSocket: true,
                  isWebSocketHandshakeDone: true
                });
                
                // Notify connection handlers
                this.connectionHandlers.forEach(handler => {
                  try {
                    handler(clientId);
                  } catch (error) {
                    console.error('Error in connection handler:', error);
                  }
                });
                
                return;
              }
              
              // If WebSocket handshake is done, process WebSocket frames
              const client = this.clients.get(clientId);
              if (client && client.isWebSocket && client.isWebSocketHandshakeDone) {
                this.processWebSocketFrame(clientId, data);
                return;
              }
              
              // For normal TCP sockets
              console.log(`Received raw data from client ${clientId}: ${rawData}`);
              dataBuffer += rawData;
              
              // Process complete JSON messages if possible
              let message;
              try {
                message = JSON.parse(dataBuffer);
                dataBuffer = ''; // Clear buffer after successful parse
              } catch (e) {
                // Incomplete or invalid JSON, keep collecting
                return;
              }
              
              console.log(`Parsed message from client ${clientId}:`, message);
              
              // Notify message handlers
              this.messageHandlers.forEach(handler => {
                try {
                  handler(message);
                } catch (error) {
                  console.error('Error in message handler:', error);
                }
              });
            } catch (error) {
              console.error(`Error processing data from client ${clientId}:`, error);
            }
          });
          
          // Handle client disconnect
          socket.on('close', () => {
            console.log(`Client disconnected: ${clientId}`);
            this.clients.delete(clientId);
          });
          
          // Handle errors
          socket.on('error', (error) => {
            console.error(`Socket error for client ${clientId}:`, error);
            this.clients.delete(clientId);
            
            // Notify error handlers
            this.errorHandlers.forEach(handler => {
              try {
                handler(error);
              } catch (handlerError) {
                console.error('Error in error handler:', handlerError);
              }
            });
          });
        });
        
        // Check if server is null
        if (!server) {
          console.error('TcpSocket.createServer returned null');
          this.isStarting = false;
          reject(new Error('Failed to create TCP server'));
          return;
        }
        
        console.log('Server created, attempting to listen...');
        
        // Try to listen on the specified port
        try {
          server.listen({ port, host: '0.0.0.0' }, () => {
            console.log(`Socket server successfully listening on port ${port}`);
            this.server = server;
            this.isStarting = false;
            resolve();
          });
        } catch (listenError) {
          console.error('Error calling listen on server:', listenError);
          this.isStarting = false;
          reject(listenError);
          return;
        }
        
        // Handle server errors
        server.on('error', (error: Error) => {
          console.error('Server error:', error);
          
          // Only reject if we're still starting
          if (this.isStarting) {
            this.isStarting = false;
            reject(error);
          }
          
          // Notify error handlers
          this.errorHandlers.forEach(handler => {
            try {
              handler(error);
            } catch (handlerError) {
              console.error('Error in error handler:', handlerError);
            }
          });
        });
      } catch (error) {
        console.error('Error creating socket server:', error);
        this.isStarting = false;
        reject(error);
      }
    });
  }
  
  /**
   * Process a WebSocket frame and extract the message
   */
  private processWebSocketFrame(clientId: string, data: Buffer | string): void {
    try {
      // Convert string to Buffer if needed
      const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      // Simple WebSocket frame decoder
      // First byte: FIN, RSV1-3, Opcode
      const firstByte = bufferData[0];
      const opcode = firstByte & 0x0F;
      
      // Second byte: MASK, Payload length
      const secondByte = bufferData[1];
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7F;
      
      let maskingKeyOffset = 2;
      
      // Extended payload length (16-bit)
      if (payloadLength === 126) {
        payloadLength = bufferData.readUInt16BE(2);
        maskingKeyOffset = 4;
      } 
      // Extended payload length (64-bit) - not handling properly, simplification
      else if (payloadLength === 127) {
        // For simplicity, we're not parsing 64-bit length correctly
        payloadLength = bufferData.readUInt32BE(6); // Read just the lower 32 bits
        maskingKeyOffset = 10;
      }
      
      // Handle different opcodes
      switch (opcode) {
        case 0x1: // Text frame
        case 0x2: // Binary frame
          if (isMasked) {
            // Get masking key (4 bytes)
            const maskingKey = bufferData.slice(maskingKeyOffset, maskingKeyOffset + 4);
            const payloadOffset = maskingKeyOffset + 4;
            
            // Unmask payload
            const payload = Buffer.alloc(payloadLength);
            for (let i = 0; i < payloadLength; i++) {
              payload[i] = bufferData[payloadOffset + i] ^ maskingKey[i % 4];
            }
            
            // Convert to string
            const messageText = payload.toString('utf8');
            
            console.log(`Received WebSocket message from client ${clientId}: ${messageText}`);
            
            try {
              // Parse JSON if possible
              const message = JSON.parse(messageText);
              
              // Notify message handlers
              this.messageHandlers.forEach(handler => {
                try {
                  handler(message);
                } catch (error) {
                  console.error('Error in message handler:', error);
                }
              });
            } catch (jsonError: any) {
              console.error(`Error parsing WebSocket message as JSON: ${jsonError.message}`);
            }
          } else {
            console.warn(`Received unmasked WebSocket frame from client ${clientId}`);
          }
          break;
          
        case 0x8: // Close frame
          console.log(`Received WebSocket close frame from client ${clientId}`);
          this.sendWebSocketCloseFrame(clientId);
          break;
          
        case 0x9: // Ping frame
          console.log(`Received WebSocket ping from client ${clientId}`);
          this.sendWebSocketPongFrame(clientId);
          break;
          
        default:
          console.warn(`Received unsupported WebSocket opcode ${opcode} from client ${clientId}`);
      }
    } catch (error) {
      console.error(`Error processing WebSocket frame from client ${clientId}:`, error);
    }
  }
  
  /**
   * Send a WebSocket pong frame in response to a ping
   */
  private sendWebSocketPongFrame(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client || !client.isWebSocket) return;
    
    const pongFrame = Buffer.from([0x8A, 0x00]); // Pong frame with no payload
    client.socket.write(pongFrame);
  }
  
  /**
   * Send a WebSocket close frame
   */
  private sendWebSocketCloseFrame(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client || !client.isWebSocket) return;
    
    const closeFrame = Buffer.from([0x88, 0x00]); // Close frame with no payload
    client.socket.write(closeFrame);
    
    // Close socket after sending frame
    setTimeout(() => {
      try {
        client.socket.destroy();
      } catch (e) {
        console.error(`Error closing socket for client ${clientId}:`, e);
      }
    }, 100);
  }
  
  /**
   * Handle WebSocket handshake
   */
  private handleWebSocketHandshake(clientId: string, socket: any, request: string): void {
    try {
      console.log(`Processing WebSocket handshake for client ${clientId}`);
      
      // Extract the WebSocket key
      const keyRegex = /Sec-WebSocket-Key: (.+)/i;
      const match = request.match(keyRegex);
      
      if (!match || !match[1]) {
        console.error('No WebSocket key found in handshake');
        socket.destroy();
        return;
      }
      
      const webSocketKey = match[1].trim();
      
      // Generate the accept key (simplified, not cryptographically secure)
      // In a real implementation, this would use crypto
      const acceptKey = this.generateAcceptKey(webSocketKey);
      
      // Send handshake response
      const handshakeResponse = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n'
      ].join('\r\n');
      
      socket.write(handshakeResponse);
      console.log(`WebSocket handshake completed for client ${clientId}`);
    } catch (error) {
      console.error(`Error during WebSocket handshake for client ${clientId}:`, error);
      socket.destroy();
    }
  }
  
  /**
   * Generate a WebSocket accept key (simplified version)
   * In a real implementation, this would use proper hashing
   */
  private generateAcceptKey(key: string): string {
    // This is a simplified mockup that doesn't actually do the real computation
    // Real implementation would use SHA-1 hash with the magic string
    return Buffer.from(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').toString('base64');
  }
  
  /**
   * Stop the socket server
   */
  public stop(): void {
    if (!this.server) {
      console.log('No socket server running to stop');
      return;
    }
    
    console.log('Stopping socket server...');
    
    // Close all client connections
    for (const [clientId, client] of this.clients.entries()) {
      try {
        const socket = client.isWebSocket ? client.socket : client;
        if (client.isWebSocket) {
          // Send close frame before destroying
          this.sendWebSocketCloseFrame(clientId);
        } else {
          socket.destroy();
        }
        console.log(`Closed connection to client ${clientId}`);
      } catch (error) {
        console.error(`Error closing client ${clientId}:`, error);
      }
    }
    
    this.clients.clear();
    
    // Close server
    try {
      this.server.close(() => {
        console.log('Socket server closed successfully');
      });
      this.server = null;
    } catch (error) {
      console.error('Error stopping server:', error);
      // Force reset server reference even if close fails
      this.server = null;
    }
  }
  
  /**
   * Return whether the server is running
   */
  public isRunning(): boolean {
    return this.server !== null;
  }
  
  /**
   * Send a message to a specific client
   */
  public sendToClient(clientId: string, data: any): boolean {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return false;
    }
    
    try {
      const message = JSON.stringify(data);
      
      if (client.isWebSocket) {
        // Send as WebSocket frame
        this.sendWebSocketMessage(client.socket, message);
      } else {
        // Send as raw TCP
        client.socket.write(message);
      }
      return true;
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      return false;
    }
  }
  
  /**
   * Send a message in WebSocket frame format
   */
  private sendWebSocketMessage(socket: any, message: string): void {
    try {
      const messageBuffer = Buffer.from(message);
      const messageLength = messageBuffer.length;
      
      let header;
      
      // Create header based on message length
      if (messageLength <= 125) {
        header = Buffer.alloc(2);
        header[0] = 0x81; // Text frame
        header[1] = messageLength;
      } else if (messageLength <= 65535) {
        header = Buffer.alloc(4);
        header[0] = 0x81; // Text frame
        header[1] = 126;
        header.writeUInt16BE(messageLength, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81; // Text frame
        header[1] = 127;
        header.writeUInt32BE(0, 2); // High 32 bits (assume 0)
        header.writeUInt32BE(messageLength, 6); // Low 32 bits
      }
      
      // Send header and message
      socket.write(Buffer.concat([header, messageBuffer]));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }
  
  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(data: any): void {
    if (this.clients.size === 0) {
      console.log('No clients connected, broadcast ignored:', JSON.stringify(data));
      return;
    }
    
    try {
      const messageObj = data;
      const messageStr = JSON.stringify(messageObj);
      console.log(`Broadcasting message to ${this.clients.size} clients:`, messageStr);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const [clientId, client] of this.clients.entries()) {
        try {
          if (client.isWebSocket) {
            // Send as WebSocket frame
            this.sendWebSocketMessage(client.socket, messageStr);
            successCount++;
          } else {
            // Send as raw TCP
            const result = client.socket.write(messageStr);
            if (result) {
              successCount++;
            } else {
              console.warn(`Socket buffer full for client ${clientId}, message might be delayed`);
              failCount++;
            }
          }
        } catch (error: any) {
          console.error(`Error broadcasting to client ${clientId}:`, error);
          failCount++;
          
          // Remove dead clients
          if (error.message && (
              error.message.includes('This socket has been ended') || 
              error.message.includes('Socket is closed') ||
              error.message.includes('EPIPE')
          )) {
            console.log(`Removing dead client ${clientId}`);
            this.clients.delete(clientId);
          }
        }
      }
      
      console.log(`Broadcast results: ${successCount} successful, ${failCount} failed`);
    } catch (error) {
      console.error('Error preparing broadcast message:', error);
    }
  }
  
  /**
   * Add a message handler
   */
  public addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }
  
  /**
   * Remove a message handler
   */
  public removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }
  
  /**
   * Add a connection handler
   */
  public addConnectionHandler(handler: ConnectionHandler): void {
    this.connectionHandlers.add(handler);
  }
  
  /**
   * Remove a connection handler
   */
  public removeConnectionHandler(handler: ConnectionHandler): void {
    this.connectionHandlers.delete(handler);
  }
  
  /**
   * Add an error handler
   */
  public addErrorHandler(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }
  
  /**
   * Remove an error handler
   */
  public removeErrorHandler(handler: ErrorHandler): void {
    this.errorHandlers.delete(handler);
  }
  
  /**
   * Get the number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }
  
  /**
   * Get the port the server is running on
   */
  public getPort(): number {
    return this.port;
  }
}

// Export singleton instance
const nativeSocketService = NativeSocketService.getInstance();
export default nativeSocketService; 