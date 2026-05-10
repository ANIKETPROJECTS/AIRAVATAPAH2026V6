import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'km_token',
  MOBILE: 'km_mobile',
  FARMER: 'km_farmer',
  LANG: 'km_lang',
};

export const storage = {
  async saveSession(token: string, mobile: string) {
    await AsyncStorage.multiSet([
      [KEYS.TOKEN, token],
      [KEYS.MOBILE, mobile],
    ]);
  },

  async saveToken(token: string) {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },

  async saveMobile(mobile: string) {
    await AsyncStorage.setItem(KEYS.MOBILE, mobile);
  },

  async saveFarmer(farmer: object) {
    await AsyncStorage.setItem(KEYS.FARMER, JSON.stringify(farmer));
  },

  async loadSession(): Promise<{ token: string | null; mobile: string | null; farmer: object | null }> {
    const [[, token], [, mobile], [, farmerRaw]] = await AsyncStorage.multiGet([
      KEYS.TOKEN,
      KEYS.MOBILE,
      KEYS.FARMER,
    ]);
    let farmer: object | null = null;
    if (farmerRaw) {
      try { farmer = JSON.parse(farmerRaw); } catch { /* ignore */ }
    }
    return { token, mobile, farmer };
  },

  async clearSession() {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.MOBILE, KEYS.FARMER]);
  },

  async saveLang(lang: string) {
    await AsyncStorage.setItem(KEYS.LANG, lang);
  },

  async loadLang(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LANG);
  },
};
