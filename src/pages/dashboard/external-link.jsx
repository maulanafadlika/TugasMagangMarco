import { useDashboard } from '@/zustand'
import React, { useEffect, useState } from 'react'
import Cookies from "js-cookie";
import { decryptPayload } from "@/services/codec/codec";

const ExternalLink = ({ originalUrl }) => {
  const { VITE_BASE_URL } = import.meta.env;
  const { dataLink } = useDashboard();
  const groupDivisionCookies = Cookies.get("GROUP_DIVISION");
  const tokenCookies = Cookies.get("TOKEN");
  const parseData = groupDivisionCookies ? decryptPayload(groupDivisionCookies) : null
  const groupDivision = parseData ? parseData : null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!groupDivisionCookies) {
    alert('Auth Group Division Not found')
    return
  }
  if (!groupDivision) {
    alert('Group Division Not found')
    return
  }

  if (!dataLink) {
    return <div>Loading...</div>;
  }

  // Gantikan [div] dalam URL dengan nilai groupDivision
  const replacedLink = originalUrl.replace("[div]", encodeURIComponent(groupDivision));

  // Create URL with token as query parameter for iframe
  const iframeUrl = `${VITE_BASE_URL}/proxy/curr_project?link=${encodeURIComponent(replacedLink)}&token=${encodeURIComponent(tokenCookies)}`;

  return (
    <iframe
      src={iframeUrl}
      title="External Content"
      className="w-full h-screen border-none"
      sandbox="allow-same-origin allow-scripts allow-downloads allow-popups allow-forms allow-top-navigation allow-modals allow-popups-to-escape-sandbox"
      allow="fullscreen"
    />
  );
};

export default ExternalLink;