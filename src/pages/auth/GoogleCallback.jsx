import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const GoogleCallback = () => {
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConflictPopup, setShowConflictPopup] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const navigate = useNavigate();

  const showToast = (message, type) => {
    if (isToastVisible) return;
    setIsToastVisible(true);

    const capitalizeWords = (text) =>
      text
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

    const capitalizedMessage = capitalizeWords(message) + "!";

    const toastConfig = {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      onClose: () => setIsToastVisible(false),
    };

    const messageElement = (
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px" }}>
        {capitalizedMessage}
      </div>
    );
    type === "success"
      ? toast.success(messageElement, toastConfig)
      : toast.error(messageElement, toastConfig);
  };

  const handleGoogleAuthCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");
      const message = urlParams.get("message");
      const data = urlParams.get("data");

      if (error) {
        let errorMessage = message || "Authentication failed";
        switch (error) {
          case "oauth_cancelled":
            errorMessage = "Google authentication was cancelled";
            break;
          case "no_code":
            errorMessage = "No authorization code received";
            break;
          case "invalid_google_account":
            errorMessage = "Invalid Google account data";
            break;
          case "login_conflict":
            errorMessage = "Login conflict detected";
            break;
          case "oauth_error":
            errorMessage = "OAuth authentication error";
            break;
          case "auth_failed":
            errorMessage = message || "Authentication failed";
            break;
        }

        showToast(errorMessage, "error");
        navigate("/auth/login");
        return;
      }

      if (!data) {
        showToast("No authentication data received", "error");
        navigate("/auth/login");
        return;
      }

      const queryParams = new URLSearchParams();
      if (data) queryParams.append("data", data);
      if (error) queryParams.append("error", error);
      if (message) queryParams.append("message", message);

      const queryString = queryParams.toString();
      const backendUrl = `${import.meta.env.VITE_BASE_URL}/auth/google/result${
        queryString ? `?${queryString}` : ""
      }`;

    //   console.log("Sending request to:", backendUrl);

      const res = await fetch(backendUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const rawResponse = await res.json();
    //   console.log("Raw Google login response:", rawResponse);

      let responseData;
      try {
        const decrypted = decryptPayload(rawResponse.msg);
        responseData = JSON.parse(decrypted);
        // console.log("Decrypted Google login response:", responseData);
      } catch (err) {
        console.error("Failed to decrypt/parse response msg:", err);
        showToast("Failed to decrypt authentication data", "error");
        navigate("/auth/login");
        return;
      }

      if (res.status === 404) {
        showToast("Authentication session expired. Please try again.", "error");
        navigate("/auth/login");
        return;
      }

      if (res.status === 409) {
        setCurrentDeviceId(responseData.current_device_id);
        setCurrentUserId(responseData.current_user_id);
        setShowConflictPopup(true);
        return;
      }

      if (res.status === 200) {
        if (responseData.status === 'success' && responseData.data) {
          const authData = responseData.data;

          try {
            const decryptedToken = jwtDecode(authData.token);
            const decryptedTokenPayload = decryptPayload(decryptedToken.payload);
            // console.log("Decrypted Token Payload:", decryptedTokenPayload);

            const tokenData = JSON.parse(decryptedTokenPayload);
            const { email, phone_number, division } = tokenData;

            Cookies.set("TOKEN", authData.token, { expires: 1 });
            Cookies.set("USER_ID", encryptPayload(authData.user_id), { expires: 1 });
            Cookies.set("NAME", encryptPayload(authData.name), { expires: 1 });
            Cookies.set("GROUP_ID", encryptPayload(authData.group_id), { expires: 1 });
            Cookies.set("GROUP_NAME", encryptPayload(authData.group_name), { expires: 1 });
            Cookies.set("MENU_LIST", encryptPayload(JSON.stringify(authData.menu_list)), {
              expires: 1,
            });
            Cookies.set("EMAIL", encryptPayload(email), { expires: 1 });
            Cookies.set("PHONE_NUMBER", encryptPayload(phone_number), { expires: 1 });
            Cookies.set("GROUP_DIVISION", encryptPayload(division), { expires: 1 });
            Cookies.set("SITE_TYPE", encryptPayload(authData.site), { expires: 1 });

            if (authData.user_forgot_password) {
              Cookies.set("USER_FORGOT_PASSWORD", authData.user_forgot_password, {
                expires: 1,
              });
            }
          } catch (tokenError) {
            console.error("Token processing error:", tokenError);

            Cookies.set("TOKEN", authData.token, { expires: 1 });
            Cookies.set("USER_ID", encryptPayload(authData.user_id), { expires: 1 });
            Cookies.set("NAME", encryptPayload(authData.name), { expires: 1 });
            Cookies.set("GROUP_ID", encryptPayload(authData.group_id), { expires: 1 });
            Cookies.set("GROUP_NAME", encryptPayload(authData.group_name), { expires: 1 });
            Cookies.set("MENU_LIST", encryptPayload(JSON.stringify(authData.menu_list)), {
              expires: 1,
            });

            if (authData.user_forgot_password) {
              Cookies.set("USER_FORGOT_PASSWORD", authData.user_forgot_password, {
                expires: 1,
              });
            }
          }

          showToast(responseData.message || "Login successful", "success");
          navigate("/dashboard/home", {
            state: { message: responseData.message || "Login successful" },
            replace: true,
          });
        } else {
          showToast(responseData.message || "Authentication failed", "error");
          navigate("/auth/login");
        }
      } else {
        showToast(responseData.message || "Authentication failed", "error");
        navigate("/auth/login");
      }
    } catch (error) {
      console.error(`Google Auth Error: ${error}`);
      showToast("An error occurred during authentication. Please try again!", "error");
      navigate("/auth/login");
    }
  };

  useEffect(() => {
    handleGoogleAuthCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-lg">Processing Google authentication...</p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default GoogleCallback;
