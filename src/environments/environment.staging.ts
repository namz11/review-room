export const environment = {
    production: false,
    errorMsg: 'An error has occurred!',
    baseUrl: 'http://localhost:4600',
    firebase: {
        // firebase config goes here
        apiKey: process.env['RR_FIREBASE_KEY'],
        authDomain: process.env['RR_FIREBASE_DOMAIN'],
        databaseURL: process.env['RR_FIREBASE_DATABASE'],
        projectId: process.env['RR_FIREBASE_PROJECT_ID'],
        storageBucket: process.env['RR_FIREBASE_STORAGE_BUCKET'],
        messagingSenderId: process.env['RR_FIREBASE_SENDER_ID'],
        appId: process.env['RR_FIREBASE_APP_ID'],
    },
};
