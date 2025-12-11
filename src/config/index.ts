import config from "./config.json";
interface Config {
  baseURL: string;
  foundationURL: string;
  websocketURL: string;
  echoAvatarURL: string;
  feedUrl: string;
  recordShareBasicUrl: string;
}

// const config = {
//   // baseURL: "https://sugartalk.yamimeal.ca",
//   baseURL: "https://sugartalktest.yamimeal.ca",
//   // prd
//   foundationURL: "https://passport.sjfood.us",
//   // foundationURL: "http://passtest.wiltechs.com",
//   //test
//   // foundationURL: "http://auth.testomenow.com",

//   websocketURL: "wss://ams-origin.wiltechs.com/LiveApp/websocket",
// }

export default config as Config;
