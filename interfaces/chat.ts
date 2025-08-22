export interface Conversation {
  id: string;
  members: string[];
  lastMessage?: {
    text?: string;
    imageUrl?: string;
    senderId: string;
    createdAt: Date;
  };
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  createdAt: Date;
  status: "sent" | "delivered" | "read";
}
