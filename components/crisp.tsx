"use client"

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (websiteId) {
      Crisp.configure(websiteId);
    }
  }, []);

  return null;
}

export default CrispChat;
