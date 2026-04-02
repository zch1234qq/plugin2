import React from 'react';

interface CaptchaAProps {
  callback: (captchaVerifyParam: string) => Promise<{
    captchaResult: boolean;
    bizResult: boolean;
  }>;
  children: React.ReactNode;
}

declare const CaptchaA: React.FC<CaptchaAProps>;

export default CaptchaA; 