// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
//DESARROLLO
/*
const firebaseConfig = {
  apiKey: "AIzaSyDYLN9obcWpHCL0KLdQFhdB4mHD5gsFOt8",
  authDomain: "quiru-b444f.firebaseapp.com",
  projectId: "quiru-b444f",
  storageBucket: "quiru-b444f.appspot.com",
  messagingSenderId: "953856024887",
  appId: "1:953856024887:web:9fcc77f3fd4e46e90efab2",
  measurementId: "G-F756MY0VB1"
};
*/
//RESERVA
/*
const firebaseConfig = {
  apiKey: "AIzaSyDoRrybGbm1je4kmznbbbyCcqNBu7pZkZI",
  authDomain: "quiru-reserva.firebaseapp.com",
  projectId: "quiru-reserva",
  storageBucket: "quiru-reserva.appspot.com",
  messagingSenderId: "653678486808",
  appId: "1:653678486808:web:83dc647c2763b886dbea6d"
};
*/
//PRODUCIÓN
/**/
const firebaseConfig = {
  apiKey: "AIzaSyCmuv9CEw64vyP6RMNBje3X-feEsbdg4Lw",
  authDomain: "quiru-prod.firebaseapp.com",
  projectId: "quiru-prod",
  storageBucket: "quiru-prod.appspot.com",
  messagingSenderId: "605281793847",
  appId: "1:605281793847:web:7635e785fb4472e24b0cb2",
  measurementId: "G-32SFW0E4RR"
};

//CHILE FREE
 /*
const firebaseConfig = {
  apiKey: "AIzaSyD7o0kBDInr5YOjuUozDzh0vnx-cRRKZ3M",
  authDomain: "quiru-cl.firebaseapp.com",
  projectId: "quiru-cl",
  storageBucket: "quiru-cl.appspot.com",
  messagingSenderId: "279094495226",
  appId: "1:279094495226:web:75892af3195f0c6a8c4643",
  measurementId: "G-VW1PZD0EHV"
};
*/
// Initialize Firebase
let app
//let analytics
let firestore
let auth
let storage
let appCheck
const iniciarFirebase = ()=> {
    app = initializeApp(firebaseConfig);
    const isLocalDevelopment = import.meta.env.DEV
      && typeof window !== 'undefined'
      && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY

    if (isLocalDevelopment) {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || true
    }

    if (isLocalDevelopment || appCheckSiteKey) {
      appCheck = initializeAppCheck(app, {
        // En modo debug Firebase intercambia el token local antes de usar este proveedor.
        provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey || 'debug-mode'),
        isTokenAutoRefreshEnabled: true
      })
    }
    //analytics = getAnalytics(app);
    firestore = getFirestore();
    auth = getAuth();
    storage = getStorage()
}

export {
  iniciarFirebase,
  app,
  firestore,
  //analytics,
  auth,
  storage,
  appCheck
}
