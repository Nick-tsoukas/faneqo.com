import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const firebaseConfig = {
    apiKey: 'AIzaSyDgSOx5LNx8ExxU7-kWLrNFsylk4GOzjvA',
    authDomain: 'musicbizqr-f3261.firebaseapp.com',
    projectId: 'musicbizqr-f3261',
    storageBucket: 'musicbizqr-f3261.appspot.com',
    messagingSenderId: '425243507529',
    appId: '1:425243507529:web:52eb9d3019401882fa7898',
    measurementId: 'G-LRB82HECE7'
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()

  return {
    provide: {
      firebase: { app, auth, provider }
    }
  }
})
