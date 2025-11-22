import { useEffect, useState } from 'react';

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      app.ready();
      app.expand();
      setWebApp(app);
    }
  }, []);

  return webApp;
};

export const useTelegramUser = () => {
  const webApp = useTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
};
