import React, { useState, useEffect } from "react";
import { FaUserCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hover, setHover] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const msg = await res.text();
      alert(msg);
      return;
    }

    const data = await res.json();

    // ✅ THIS is where it goes
    localStorage.setItem("user", JSON.stringify(data.user));


    // ✅ Redirect
    navigate("/dashboard");

  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
};




  return (
    <>
      {/* GLOBAL BACKGROUND FIX — removes all white gaps */}
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          background: linear-gradient(46deg, #122753, #0F0F1A) !important;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
        }

        input[type="password"]::-webkit-textfield-decoration-container {
          display: none;
        }
        input[type="password"]::-ms-reveal {
          display: none;
        }
      `}</style>

      <div className="login-page" style={styles.container}>
        <div className="login-container" style={styles.loginContainer}>
          <FaUserCircle size={200} color="#fff" />

          <form style={styles.form} onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...styles.input, height: "30%" }}
            />

            {/* Password input with eye toggle */}
            <div style={{ position: "relative", width: "90%" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...styles.input,
                  paddingRight: "50px",
                  marginLeft: "-15px",
                  height: "30%",
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "15px",
                  top: "40%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#ccc",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <p style={styles.signupText}>
              New User?{" "}
              <Link to="/Signup" style={styles.signupLink}>
                Sign up
              </Link>
            </p>

            <button
              type="submit"
              style={{
                ...styles.button,
                backgroundColor: hover ? "#0f1735ff" : "#02062B",
                transform: hover ? "scale(1.03)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              Login
            </button>
          </form>
        </div>

        {/* Autofill styling */}
        <style>{`
          input {
            color: #fff;
            caret-color: #fff;
            background-color: #01041E;
          }
          
          input::placeholder {
            color:  #cccccc7a;
          }
          input[type="password"]::placeholder {
            color: #cccccc7a;
            padding-left: 30px;
          }

          input::selection {
            background-color: #1F2F6E;
            color: #fff;
          }

          input:-webkit-autofill,
          input:-webkit-autofill::first-line,
          input:-webkit-autofill::selection {
            -webkit-text-fill-color: #fff !important;
            background-color: #01041E !important;
            color: #fff !important;
          }
        `}</style>

        <style>{`
          input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0px 1000px #01041E inset !important;
            -webkit-text-fill-color: #fff !important;
          }

          input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0px 1000px #01041E inset !important;
            -webkit-text-fill-color: #fff !important;
          }
        `}</style>
      </div>
    </>
  );
};

const styles = {
  body: { overflow: "hidden" },
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(46deg, #122753, #0F0F1A)",
    fontFamily: "Arial, sans-serif",
  },
  loginContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    height: "65vh",
    width: "400px",
    background: "#0B1534",
    border: "1px solid #1F2F6E",
    borderRadius: "30px",
    padding: "40px 20px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
  },
  form: {
    marginTop: "35px",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "15px",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#01041E",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #01041E",
    fontSize: "18px",
    color: "#fff",
    width: "90%",
  },
  signupText: {
    color: "#ccc",
    fontSize: "14px",
    alignSelf: "flex-start",
    paddingLeft: "10px",
  },
  signupLink: {
    color: "#9D89E2",
    cursor: "pointer",
    paddingLeft: "5px",
  },
  button: {
    padding: "13px",
    borderRadius: "15px",
    backgroundColor: "#02062B",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    width: "70%",
    fontWeight: "bold",
    border: "1px solid #1F2F6E",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Login;
