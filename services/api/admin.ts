/**
 * Admin Service (Logs, Certificates, R2)
 */
import type { SystemActivityLog, Certificate } from '../../types';
import { getAuthToken } from './auth';

export interface R2Item {
    key?: string;
    name?: string;
    size?: number;
    lastModified?: string;
}

export const adminApi = {
    getLogs: async (): Promise<SystemActivityLog[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/system-activity-logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    logAction: async (userId: string, userName: string, action: string, details: string): Promise<void> => {
        const token = getAuthToken();
        await fetch('/api/system-activity-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId, userName, action, details })
        });
    },

    getCertificates: async (): Promise<Certificate[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/certificates', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    getAllCertificates: async (): Promise<Certificate[]> => {
        const token = getAuthToken();
        const response = await fetch('/api/certificates/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    issueCertificate: async (data: any): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch('/api/certificates/issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to issue certificate');
        return await response.json();
    },

    generateCertificate: async (courseId: string): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch('/api/certificates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId })
        });
        if (!response.ok) throw new Error('Failed to generate certificate');
        return await response.json();
    },

    generateMasterCertificate: async (): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch('/api/certificates/master', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to generate master certificate');
        return await response.json();
    },

    r2: {
        listFiles: async (prefix: string = ''): Promise<{ files: R2Item[]; folders: R2Item[]; prefix: string }> => {
            const token = getAuthToken();
            const response = await fetch(`/api/r2/files?prefix=${encodeURIComponent(prefix)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch R2 files');
            return await response.json();
        },

        getUploadUrl: async (fileName: string, fileType: string): Promise<{ uploadUrl: string, key: string, publicUrl: string }> => {
            const token = getAuthToken();
            const response = await fetch('/api/r2/upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fileName, fileType })
            });
            if (!response.ok) throw new Error('Failed to get upload URL');
            return await response.json();
        },

        deleteFile: async (key: string): Promise<void> => {
            const token = getAuthToken();
            const response = await fetch('/api/r2/file', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key })
            });
            if (!response.ok) throw new Error('Failed to delete file');
        },

        renameFile: async (oldKey: string, newKey: string): Promise<void> => {
            const token = getAuthToken();
            const response = await fetch('/api/r2/rename', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldKey, newKey })
            });
            if (!response.ok) throw new Error('Failed to rename file');
        },

        createFolder: async (folderPath: string): Promise<void> => {
            const token = getAuthToken();
            const response = await fetch('/api/r2/folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ folderPath })
            });
            if (!response.ok) throw new Error('Failed to create folder');
        }
    }
};
