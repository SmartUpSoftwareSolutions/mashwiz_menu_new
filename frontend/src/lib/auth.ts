export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('clientId');
  localStorage.removeItem('activeUsers');
  localStorage.removeItem('dbCredentials');
};

export async function login(user: { email: string; password: string }) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify(user),
    headers: { 
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const resData = await response.json();
  if (!response.ok) throw new Error(resData.message || "Login failed");

  // Store user info
  localStorage.setItem("user", JSON.stringify({ id: resData.id, email: user.email }));
  localStorage.setItem("token", resData.token);
  localStorage.setItem("clientId", resData.clientId || '');
  localStorage.setItem("isLoggedIn", "true");
  
  // Store database credentials for change detection
  localStorage.setItem("dbCredentials", JSON.stringify({
    email: user.email,
    password: user.password, // Note: Storing password in localStorage is not ideal for security, but needed for comparison
    databaseName: resData.databaseName,
    timestamp: Date.now(),
  }));

  return resData.message;
}

