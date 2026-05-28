// Storage Manager - Handle all localStorage operations

const STORAGE_KEYS = {
  USERS: 'pcb_users',
  SETTINGS: 'pcb_settings',
};

// Initialize default data
const DEFAULT_USERS = [
  { id: 'admin', name: 'Admin User', password: 'admin123', role: 'ADMIN', accessPages: [] },
  { id: 'user', name: 'Employee 1', password: 'user123', role: 'USER', accessPages: [] },
  { id: 'user2', name: 'Employee 2', password: 'user123', role: 'USER', accessPages: [] }
];

const DEFAULT_SETTINGS = {
  groupHeads: ['IT', 'HR', 'Finance', 'Operations', 'Marketing'],
  paymentModes: ['Cash', 'Cheque', 'Bank Transfer', 'Online Payment'],
  lastSerialNumber: 0
};

// Initialize storage with defaults
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
};

// Get data from storage
export const getFromStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Save data to storage
export const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// User operations
export const getUsers = () => {
  const users = getFromStorage(STORAGE_KEYS.USERS);
  if (!users || !users.some(u => u.id === 'admin')) {
    saveToStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  return users;
};
export const saveUsers = (users) => saveToStorage(STORAGE_KEYS.USERS, users);

export { STORAGE_KEYS };
