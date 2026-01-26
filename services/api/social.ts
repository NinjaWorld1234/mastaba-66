/**
 * Social Service (Community & Messaging)
 */
import type { Post } from '../../types';
import { getAuthToken } from './auth';

export const socialApi = {
    getCommunityPosts: async (): Promise<Post[]> => {
        const response = await fetch('/api/community/posts');
        return response.ok ? await response.json() : [];
    },

    getMessages: async (): Promise<any[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/social/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    sendMessage: async (receiverId: string, content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch('/api/social/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ receiverId, content, attachmentUrl, attachmentType, attachmentName })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return await response.json();
    },

    markMessageRead: async (id: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(`/api/social/messages/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    markConversationAsRead: async (userId: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(`/api/social/messages/conversation/${userId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    getUnreadCount: async (): Promise<number> => {
        const token = getAuthToken();
        const response = await fetch('/api/social/messages/unread', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            return data.count;
        }
        return 0;
    }
};
