import { decryptPayload, encryptPayload } from "@/services/codec/codec";
const { VITE_BASE_URL, VITE_MODE_ENCRYPT} = import.meta.env;
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const GET = async (url , payload = {}) => {
    const token = Cookies.get("TOKEN");
  
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  
    const options = {
      method: "GET",
      headers,
    };
  
    try {
    
      const response = await fetch(`${VITE_BASE_URL}${url}`, options);
      const result = await response.json();
        if (response.status === 409) {
            Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'You will be logged out automatically.',
            timer: 3000,
            showConfirmButton: false,
            willClose: () => {
                Cookies.remove("TOKEN");
                Cookies.remove("USER_ID");
                Cookies.remove("NAME");
                Cookies.remove("GROUP_ID");
                Cookies.remove("GROUP_NAME");
                Cookies.remove("MENU_LIST");

                window.location.href = "pmweb/auth/login";
            },
            width: '400px',
            borderRadius: '10px',
            didOpen: () => {
                document.querySelector('.swal2-popup').style.fontFamily = 'Poppins, sans-serif';
                const title = document.querySelector('.swal2-title');
                if (title) {
                title.style.fontSize = '20px';
                }
                const text = document.querySelector('.swal2-html-container');
                if (text) {
                text.style.fontSize = '14px';
                }
            }
            });
        }
      return VITE_MODE_ENCRYPT === "PRODUCTION" ? JSON.parse(decryptPayload(result.msg)) : result;
    } catch (error) {
      console.error(`GET request error to ${url}:`, error);
      return Promise.reject(error);
    }
  };
  
  const POST = async ({ url, method = "POST", payload = {} }) => {
    const token = Cookies.get("TOKEN");
    console.log('VITE_MODE_ENCRYPT',VITE_MODE_ENCRYPT);
    
    const encryptedPayload =
      VITE_MODE_ENCRYPT === "PRODUCTION"
        ? JSON.stringify({ msg: encryptPayload(JSON.stringify(payload)) })
        : JSON.stringify(payload);
  
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  
    const options = {
      method,
      headers,
      body: encryptedPayload,
    };
  
    try {
      const response = await fetch(`${VITE_BASE_URL}${url}`, options);
      const result = await response.json();
        if (response.status === 409) {
            Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'You will be logged out automatically.',
            timer: 3000,
            showConfirmButton: false,
            willClose: () => {
                Cookies.remove("TOKEN");
                Cookies.remove("USER_ID");
                Cookies.remove("NAME");
                Cookies.remove("GROUP_ID");
                Cookies.remove("GROUP_NAME");
                Cookies.remove("MENU_LIST");

                window.location.href = "pmweb/auth/login";
            },
            width: '400px',
            borderRadius: '10px',
            didOpen: () => {
                document.querySelector('.swal2-popup').style.fontFamily = 'Poppins, sans-serif';
                const title = document.querySelector('.swal2-title');
                if (title) {
                title.style.fontSize = '20px';
                }
                const text = document.querySelector('.swal2-html-container');
                if (text) {
                text.style.fontSize = '14px';
                }
            }
            });
        }
      return VITE_MODE_ENCRYPT === "PRODUCTION" ? JSON.parse(decryptPayload(result.msg)) : result;
    } catch (error) {
      console.error(`POST request error to ${url}:`, error);
      return Promise.reject(error);
    }
  };
  

export { GET, POST };
