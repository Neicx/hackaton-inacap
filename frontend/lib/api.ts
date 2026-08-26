const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LoginResponse {
  jwt_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'technical' | 'user';
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Credenciales inválidas');
  }

  return response.json();
}

export async function register(name: string, email: string, password: string, role: string) {
  const response = await fetch(`${API_URL}/users/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear usuario');
  }

  return response.json();
}

export async function getUsers(token: string) {
  const response = await fetch(`${API_URL}/users/get-all-users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No autorizado');
  }

  return response.json();
}
