// client/services/api.ts

// 自动判断环境：本地开发用 localhost:3001，线上用 /api (走 Nginx 代理)
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const api = {
    // 认证
    login: async (credentials: any) => {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    register: async (credentials: any) => {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    // 资料
    getProfile: async () => {
        const res = await fetch(`${API_BASE}/profile`, { headers: getHeaders() });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data) return null;
        return {
            name: data.name,
            gender: data.gender,
            birthDate: new Date(data.birthDate), // 注意这里字段名要对应后端
            avatar: data.avatar,
            userId: data.userId
        };
    },

    saveProfile: async (profile: any) => {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(profile)
        });
        if (!res.ok) throw new Error('保存失败');
        return res.json();
    },

    // 日志
    getLogs: async () => {
        const res = await fetch(`${API_BASE}/logs`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取日志失败');
        return res.json();
    },

    addLog: async (log: any) => {
        const res = await fetch(`${API_BASE}/logs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(log)
        });
        if (!res.ok) throw new Error('添加失败');
        return res.json();
    },

    deleteLog: async (id: string) => {
        const res = await fetch(`${API_BASE}/logs/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('删除失败');
        return res.json();
    }
};