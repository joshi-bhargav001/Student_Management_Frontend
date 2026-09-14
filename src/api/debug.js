/**
 * Debug utility to test authentication API responses
 * Open browser console and run: window.testAuth.testLogin()
 */

export const testAuth = {
  async testLogin(username = 'admin', password = 'password') {
    console.log('=== TESTING LOGIN API ===')
    console.log('Endpoint: http://localhost:8080/api/auth/login')
    console.log('Payload:', { username, password })

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      console.log('Response Status:', response.status)
      const data = await response.json()
      console.log('=== FULL RESPONSE ===')
      console.log(JSON.stringify(data, null, 2))
      console.log('Response Keys:', Object.keys(data))

      // Check for token
      const token = data?.token || data?.jwt || data?.accessToken || data?.access_token
      console.log('Token found?', !!token)
      if (token) console.log('Token:', token.substring(0, 50) + '...')

      // Check for user/role
      const user = data?.user || data?.userInfo || data?.data?.user
      console.log('=== USER OBJECT ===')
      console.log(JSON.stringify(user, null, 2))
      console.log('User Keys:', user ? Object.keys(user) : 'N/A')
      
      if (user) {
        console.log('User.id:', user.id)
        console.log('User.username:', user.username)
        console.log('User.fullName:', user.fullName)
        console.log('User.role:', user.role)
        console.log('User.roles:', user.roles)
        console.log('User.authorities:', user.authorities)
        console.log('User.grantedAuthorities:', user.grantedAuthorities)
      }

      return data
    } catch (error) {
      console.error('Test failed:', error)
    }
  },

  showCurrentUser() {
    console.log('=== CURRENT USER IN LOCALSTORAGE ===')
    const token = localStorage.getItem('jwtToken')
    const user = localStorage.getItem('currentUser')
    console.log('Token stored?', !!token)
    if (token) console.log('Token:', token.substring(0, 50) + '...')
    console.log('User:', user ? JSON.parse(user) : 'N/A')
  },

  async testRegister(name = 'Test User', username = 'testuser', email = 'test@example.com', password = 'password123', confirmPassword = 'password123') {
    console.log('=== TESTING REGISTER API ===')
    console.log('Endpoint: http://localhost:8080/api/auth/register')
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, confirmPassword })
      })

      console.log('Response Status:', response.status)
      const data = await response.json()
      console.log('Full Response:', data)

      return data
    } catch (error) {
      console.error('Test failed:', error)
    }
  },

  testLoginWithCustomCredentials() {
    const username = prompt('Enter username:')
    const password = prompt('Enter password:')
    if (username && password) {
      return this.testLogin(username, password)
    }
  },

  async checkDatabaseUsers() {
    console.log('=== CHECKING DATABASE USERS (via API) ===')
    console.log('Endpoint: http://localhost:8080/api/students (to verify backend is running)')
    
    try {
      const response = await fetch('http://localhost:8080/api/students')
      console.log('Backend Status:', response.status)
      if (response.ok) {
        console.log('✓ Backend is running')
      } else {
        console.log('✗ Backend returned error')
      }
    } catch (error) {
      console.error('✗ Backend not reachable:', error.message)
    }
  },

  printDebugGuide() {
    console.clear()
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║         AUTHENTICATION DEBUG GUIDE                             ║
╚════════════════════════════════════════════════════════════════╝

Available commands:

1. Test Login (default admin):
   window.testAuth.testLogin()

2. Test Login (custom credentials):
   window.testAuth.testLogin('username', 'password')

3. Show Current User in LocalStorage:
   window.testAuth.showCurrentUser()

4. Check Backend Connection:
   window.testAuth.checkDatabaseUsers()

5. Test Register:
   window.testAuth.testRegister()

DEBUGGING STEPS:
1. Run: window.testAuth.printDebugGuide()  (you are here)
2. Run: window.testAuth.checkDatabaseUsers()  (verify backend runs)
3. Run: window.testAuth.testLogin('admin', 'password')  (test login)
4. Look at output - find where ROLE is located
5. Share the output with the developer

KEY THINGS TO CHECK:
- Is "response Status" 200?
- Does "user" object exist?
- What fields are in user? (look for role, roles, authorities, etc)
- Is role value "ADMIN" or something else?
    `)
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.testAuth = testAuth
  console.log('✓ Debug tools loaded! Run: window.testAuth.printDebugGuide()')
}

