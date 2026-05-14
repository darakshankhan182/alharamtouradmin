// utils/websocket.js
class WebSocketClient {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.isConnected = false;
    this.messageHandlers = [];
    this.connectionCallbacks = [];
    this.reconnectTimeout = null;
    this.pingInterval = null;
  }

  connect(token) {
    if (!token) {
      return;
    }

    // If already connected, do nothing
    if (this.socket && this.isConnected) {
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    try {
      const wsUrl = `wss://alharamtour-backend.vercel.app?token=${token}`;
      // const wsUrl = `wss://localhost:5000?token=${token}`;
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Start ping interval
        this.pingInterval = setInterval(() => {
          if (this.isConnected) {
            this.send({ type: 'PING', timestamp: Date.now() });
          }
        }, 30000); // Ping every 30 seconds
        
        // Notify all connection callbacks
        this.connectionCallbacks.forEach(callback => callback(true));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          switch (data.type) {
            case 'CONNECTED':
              break;
              
            case 'NOTIFICATION':
              // Dispatch multiple events for different handlers
              const notificationEvent = new CustomEvent('websocket-notification', {
                detail: {
                  type: 'NOTIFICATION',
                  data: data.data,
                  timestamp: new Date().toISOString()
                }
              });
              window.dispatchEvent(notificationEvent);
              
              // Also dispatch specific event for immediate UI update
              const immediateEvent = new CustomEvent('immediate-notification-update', {
                detail: {
                  notification: data.data,
                  action: 'ADD'
                }
              });
              window.dispatchEvent(immediateEvent);
              break;
              
            case 'NEW_INQUIRY':
              // Dispatch event for new inquiry
              const inquiryEvent = new CustomEvent('websocket-new-inquiry', {
                detail: {
                  type: 'NEW_INQUIRY',
                  data: data.data,
                  timestamp: new Date().toISOString()
                }
              });
              window.dispatchEvent(inquiryEvent);
              break;
              
            case 'PONG':
              break;
          }
          
          // Call all registered message handlers
          this.messageHandlers.forEach(handler => handler(data));
          
        } catch (error) {
          // Silent error handling
        }
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        
        // Clear intervals
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }
        
        // Only attempt reconnect if it wasn't a normal closure
        if (event.code !== 1000) {
          this.attemptReconnect(token);
        }
        
        // Notify all connection callbacks
        this.connectionCallbacks.forEach(callback => callback(false));
        
        // Dispatch disconnected event
        window.dispatchEvent(new CustomEvent('websocket-disconnected'));
      };

      this.socket.onerror = (error) => {
        this.isConnected = false;
      };

    } catch (error) {
      // Silent error handling
    }
  }

  attemptReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
      this.isConnected = false;
      
      // Clear intervals
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      // Clear reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    }
  }

  send(data) {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
        return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }

  onConnect(callback) {
    this.connectionCallbacks.push(callback);
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const webSocketClient = new WebSocketClient();

// Helper function to initialize WebSocket with token
export const initWebSocket = (token) => {
  if (!token) {
    return () => {};
  }
  
  webSocketClient.connect(token);
  
  // Return cleanup function
  return () => {
    webSocketClient.disconnect();
  };
};