import 'dotenv/config';

export default {
  expo: {
    name: "BudGo",
    slug: "budgetingapp",
    icon: "./assets/Budgo.png",
    android: {
      package: "com.b8udg371ng.budgetingapp",
    },
    extra: {
      apiKey: process.env.REACT_APP_API_KEY,
      authDomain: process.env.REACT_APP_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_PROJECT_ID,
      storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_APP_ID,
      measurementId: process.env.REACT_APP_MEASUREMENT_ID,
      eas: {
        projectId: "82985b13-bf74-46da-be55-2dbf75c28afb",
      },
    },
  },
};
