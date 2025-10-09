import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

interface CallParticipant {
  ws: WebSocket;
  roomId: string;
  userName: string;
  userRole: 'therapist' | 'patient';
}

class VideoCallSignalingServer {
  private participants = new Map<WebSocket, CallParticipant>();
  private rooms = new Map<string, Set<WebSocket>>();

  handleConnection(ws: WebSocket, req: IncomingMessage) {
    console.log('New WebSocket connection for video call');

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'join':
        this.handleJoin(ws, message);
        break;
      case 'offer':
        this.handleOffer(ws, message);
        break;
      case 'answer':
        this.handleAnswer(ws, message);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(ws, message);
        break;
      case 'leave':
        this.handleLeave(ws, message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleJoin(ws: WebSocket, message: any) {
    const { roomId, userName, userRole } = message;

    // Store participant info
    this.participants.set(ws, { ws, roomId, userName, userRole });

    // Add to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(ws);

    console.log(`${userName} (${userRole}) joined room ${roomId}`);

    // Notify other participants in the room
    this.broadcastToRoom(roomId, ws, {
      type: 'user-joined',
      userName,
      userRole,
    });

    // Send current participants to the new user
    const room = this.rooms.get(roomId);
    if (room) {
      const existingParticipants = Array.from(room)
        .filter((participant) => participant !== ws)
        .map((participant) => {
          const info = this.participants.get(participant);
          return {
            userName: info?.userName,
            userRole: info?.userRole,
          };
        });

      this.send(ws, {
        type: 'existing-participants',
        participants: existingParticipants,
      });
    }
  }

  private handleOffer(ws: WebSocket, message: any) {
    const { roomId, offer } = message;
    console.log(`Forwarding offer in room ${roomId}`);

    this.broadcastToRoom(roomId, ws, {
      type: 'offer',
      offer,
    });
  }

  private handleAnswer(ws: WebSocket, message: any) {
    const { roomId, answer } = message;
    console.log(`Forwarding answer in room ${roomId}`);

    this.broadcastToRoom(roomId, ws, {
      type: 'answer',
      answer,
    });
  }

  private handleIceCandidate(ws: WebSocket, message: any) {
    const { roomId, candidate } = message;

    this.broadcastToRoom(roomId, ws, {
      type: 'ice-candidate',
      candidate,
    });
  }

  private handleLeave(ws: WebSocket, message: any) {
    const { roomId } = message;
    const participant = this.participants.get(ws);

    if (participant) {
      console.log(`${participant.userName} left room ${roomId}`);

      this.broadcastToRoom(roomId, ws, {
        type: 'user-left',
        userName: participant.userName,
        userRole: participant.userRole,
      });
    }

    this.removeFromRoom(ws, roomId);
  }

  private handleDisconnect(ws: WebSocket) {
    const participant = this.participants.get(ws);

    if (participant) {
      const { roomId, userName, userRole } = participant;
      console.log(`${userName} disconnected from room ${roomId}`);

      this.broadcastToRoom(roomId, ws, {
        type: 'user-left',
        userName,
        userRole,
      });

      this.removeFromRoom(ws, roomId);
    }

    this.participants.delete(ws);
  }

  private removeFromRoom(ws: WebSocket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} is now empty and deleted`);
      }
    }
  }

  private broadcastToRoom(roomId: string, sender: WebSocket, message: any) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach((ws) => {
        if (ws !== sender && ws.readyState === WebSocket.OPEN) {
          this.send(ws, message);
        }
      });
    }
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

export const videoCallSignaling = new VideoCallSignalingServer();
