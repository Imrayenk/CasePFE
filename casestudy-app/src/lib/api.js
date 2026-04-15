const API_BASE = 'http://localhost:4000/api';

async function handleResponse(res) {
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    
    if (!res.ok) {
        let errStr = `HTTP error! status: ${res.status}`;
        try {
            const errData = await res.json();
            errStr = errData.error || errStr;
        } catch(e) {
            // Unparseable error stream safely bypassed
        }
        throw new Error(errStr);
    }
    return res.json();
}

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: getHeaders(),
    });
    return handleResponse(res);
}

export async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiPut(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(res);
}
